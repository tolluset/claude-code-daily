# Claude Code Daily (CCD) - Implementation Plan

> Last Updated: 2026-01-19
> Author: tolluset

**Recent Updates**:
- 2026-01-19: Added localStorage persistent caching with instant page loads

---

## API Endpoints

Base URL: `http://localhost:3847/api/v1`

### Health & Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Server status check |
| POST | /shutdown | Server shutdown |

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /sessions | Register session |
| GET | /sessions | Session list (filter support) |
| GET | /sessions/:id | Session detail |
| PUT | /sessions/:id | Update session |
| POST | /sessions/:id/bookmark | Toggle bookmark |
| POST | /sessions/clean-empty | Clean empty sessions (no messages) |
| DELETE | /sessions/:id | Delete session (cascade messages) |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /messages | Save message |
| POST | /messages/batch | Batch save messages |
| GET | /sessions/:id/messages | Get session messages |

### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /stats/today | Today's stats |
| GET | /stats/daily | Daily stats (date range) |
| GET | /stats/daily?from=...&to=... | Daily stats with range |
| GET | /stats/daily?days=7 | Last N days |
| GET | /stats/streak | Coding streak statistics |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /search | Full-text search across sessions/messages |
| GET | /search?q=...&project=...&bookmarked=true | Search with filters |

### Daily Report

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /daily-report | Comprehensive daily report (date parameter optional) |
| GET | /daily-report?date=2026-01-18 | Report for specific date |

### Sync

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /sync/transcript | Parse/sync transcript |

---

## Hook Implementation

### Claude Code Hooks Used

| Hook | Purpose |
|------|---------|
| `SessionStart` | Start server + register session + cleanup empty sessions |
| `UserPromptSubmit` | Capture user prompt |
| `Stop` | Parse transcript on Claude response complete |
| `SessionEnd` | Mark session as ended + trigger auto-extract insights |

### OpenCode Plugin Events

| Event | Purpose |
|-------|---------|
| `session.created` | Start server + register session |
| `session.idle` | End session |
| `message.updated` (role='user') | Save user message (TextPart only) |
| `message.updated` (role='assistant') | Save assistant message + tokens |

For detailed OpenCode Plugin architecture and implementation, see [ARCHITECTURE.md](ARCHITECTURE.md#opencode-plugin-architecture).

### SessionStart Core Logic

```bash
#!/bin/bash
HOOK_DATA=$(cat)
SESSION_ID=$(echo "$HOOK_DATA" | jq -r '.session_id')
TRANSCRIPT_PATH=$(echo "$HOOK_DATA" | jq -r '.transcript_path')
CWD=$(echo "$HOOK_DATA" | jq -r '.cwd')

SERVER_URL="http://localhost:3847"

# 1. Check server status, start if not running
if ! curl -s --connect-timeout 2 "$SERVER_URL/api/v1/health" > /dev/null 2>&1; then
  nohup ccd-server > /dev/null 2>&1 &
  sleep 1
fi

# 2. Register session
curl -s -X POST "$SERVER_URL/api/v1/sessions" \
  -H "Content-Type: application/json" \
  -d "{\"session_id\": \"$SESSION_ID\", \"transcript_path\": \"$TRANSCRIPT_PATH\", \"cwd\": \"$CWD\"}"

# 3. Clean empty sessions (async, non-blocking)
curl -s -X POST "$SERVER_URL/api/v1/sessions/clean-empty" > /dev/null 2>&1 &

exit 0
```

**Benefits of Empty Session Cleanup**:
- Automatically triggered on every new session start
- Runs in background without blocking session creation
- No dependency on dashboard access or API usage patterns
- Keeps database clean without manual intervention

### SessionEnd Core Logic

```bash
#!/bin/bash
HOOK_DATA=$(cat)
SESSION_ID=$(echo "$HOOK_DATA" | jq -r '.session_id')

SERVER_URL="http://localhost:3847"

# 1. Mark session as ended
curl -s -X POST "$SERVER_URL/api/v1/sessions/$SESSION_ID/end" \
  -H "Content-Type: application/json"

# 2. Trigger auto-extract insights (async, non-blocking)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    bash "$SCRIPT_DIR/auto-extract-insights.sh" "$SESSION_ID" &
fi

exit 0
```

**Key Features**:
- Sets `ended_at` timestamp via API
- Triggers background auto-extract insights if enabled
- Non-blocking execution (returns immediately)
- Only runs when session actually ends (not on every turn)

### Auto Server Shutdown

- Reset timer on every API request
- Auto shutdown after **1 hour** of no requests
- Prevent duplicate instances via PID file (`~/.ccd/server.pid`)

---

## Cost Tracking

### Model Pricing System

**Database**: `model_pricing` table stores pricing for Claude model families:

| Model Family | Input ($/MTok) | Output ($/MTok) | Notes |
|--------------|----------------|-----------------|-------|
| opus-4-5 | $15.00 | $75.00 | Claude Opus 4.5 |
| sonnet-4-5 | $3.00 | $15.00 | Claude Sonnet 4.5 |
| haiku-3-5 | $0.80 | $4.00 | Claude Haiku 3.5 |

### Cost Calculation Strategy

**Write-Time Calculation**: Costs are calculated when messages are created (not on-demand).

**Benefits**:
- Historical accuracy: Future price changes don't affect past data
- Performance: No repeated calculations
- Simplicity: Cost is stored alongside token counts

**Implementation**:

1. **CostService** (`packages/ccd-server/src/services/cost-service.ts`)
   - `extractModelFamily()`: Extracts family from full model name (e.g., "claude-opus-4-5-20251101" → "opus-4-5")
   - `getModelPricing()`: Retrieves pricing from database
   - `calculateCost()`: Computes input/output/total costs with 5 decimal precision

2. **Database Schema** (Migration 006)
   - `messages.input_cost`: Input token cost
   - `messages.output_cost`: Output token cost
   - `messages.is_estimated_cost`: Flag for backfilled costs
   - `daily_stats.total_input_cost`: Daily aggregated input cost
   - `daily_stats.total_output_cost`: Daily aggregated output cost

3. **Query Integration** (`packages/ccd-server/src/db/queries.ts`)
   - `createMessage()`: Calculates and stores cost on message creation
   - `updateDailyStats()`: Accumulates costs in daily aggregates

4. **Frontend Display** (`packages/ccd-dashboard/src/pages/Dashboard.tsx`)
   - Cost card shows total daily cost: `$X.XX`
   - Breakdown: `In $X.XXX / Out $X.XXX`
   - 5-column grid layout on desktop

### Migration Behavior

When Migration 006 runs:
1. Creates `model_pricing` table with current rates
2. Adds cost columns to `messages` and `daily_stats`
3. **Backfills all existing messages** with estimated costs (marked with `is_estimated_cost = true`)
4. **Recalculates daily_stats costs** for all historical dates

**Note**: Backfilled costs use current pricing and may not reflect historical rates.

---

## MCP Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `open_dashboard` | Open dashboard in browser | None |
| `get_stats` | Get session statistics | period: "today" \| "week" \| "month" \| "all" |
| `search_sessions` | Full-text search sessions | query (required), project (optional), days (optional, default: 30) |
| `generate_daily_report` | Generate daily report | date (optional, YYYY-MM-DD, default: today) |

### Usage Examples

Ask Claude directly:
- "Open the dashboard" → calls `open_dashboard`
- "Show my stats" → calls `get_stats`
- "What did I do this week?" → calls `get_stats(period: "week")`
- "Show me my daily report" → calls `generate_daily_report`
- "What did I do yesterday?" → calls `generate_daily_report(date: "2026-01-18")`

---

## Dashboard Features

### Page Structure

1. **Main (`/`)**: Today's stats summary + recent sessions
2. **Session list (`/sessions`)**: Filterable/sortable table
3. **Session detail (`/sessions/:id`)**: Full conversation + token usage
4. **Reports (`/reports`)**: Daily/weekly stats charts (Phase 2)

### Key Components

- `DailyStats`: Stats card grid
- `SessionList`: Session list table
- `SessionDetail`: Conversation timeline
- `BookmarkBadge`: Bookmark display/toggle

### MessageContent Pipeline

**Purpose**: Render message content with proper formatting, syntax highlighting, and code block support

**Architecture**:
```
MessageContent (react-markdown)
  └─> CodeBlock (type detection router)
       ├─> Inline code → <code> tag with muted background
       ├─> Diff blocks → DiffView (@pierre/diffs)
       ├─> Tool results → ToolResultBlock (Bash/Read output)
       └─> General code → SyntaxHighlightedCode (Shiki)
```

**Components**:

1. **MessageContent** (`src/components/MessageContent.tsx`)
   - Parses markdown with `react-markdown`, `remark-gfm`, `remark-breaks`
   - Injects custom `CodeBlock` component
   - XSS protection: disables `<script>` and `<iframe>` tags

2. **CodeBlock** (`src/components/CodeBlock.tsx`)
   - Routes code blocks to appropriate renderer based on content type
   - Type detection via `code-block-utils.ts` helpers

3. **SyntaxHighlightedCode** (`src/components/SyntaxHighlightedCode.tsx`)
   - Syntax highlighting via Shiki (singleton pattern)
   - Auto theme switching (light/dark)
   - Copy-to-clipboard button
   - Language label in header
   - Supports: TypeScript, JavaScript, Python, JSON, Bash, etc.

4. **ToolResultBlock** (`src/components/ToolResultBlock.tsx`)
   - Specialized rendering for tool execution results
   - Blue accent border for visual distinction
   - Icons: Terminal (Bash), FileText (Read)
   - Copy-to-clipboard support

5. **DiffView** (`src/components/DiffView.tsx`)
   - Git diff rendering via @pierre/diffs
   - Unified diff style with line numbers

**Type Detection Logic**:
- **Diff**: Regex `/^(diff |@@|---|\+\+\+)/m`
- **Tool Result**: Language `bash`/`shell` or line number pattern `/^\s*\d+→/`
- **General**: Fallback to Shiki syntax highlighting

**Singleton Pattern** (`src/lib/shiki-highlighter.ts`):
- Single Shiki instance shared across all code blocks
- Lazy initialization on first use
- Prevents redundant highlighter creation (~100-200ms init time)

---

## Token Usage Badge

실시간 토큰 사용량을 헤더에 표시하는 컴포넌트

**위치**: 헤더 우측 (테마 토글 왼쪽)

**기능**:
- 오늘의 총 토큰 사용량 표시
- 호버시 상세 정보 (일/주/월별)
- 30초마다 자동 갱신
- 다크 모드 지원

**구현 파일**:
- `packages/ccd-dashboard/src/components/ui/TokenUsageBadge.tsx`
- `packages/ccd-dashboard/src/lib/token-utils.ts`

---

## Implementation Phases

### Phase 1: Infrastructure ✅

- [x] pnpm monorepo setup
- [x] Turborepo setup
- [x] shared/types shared type definitions
- [x] SQLite schema and migration
- [x] Bun + Hono server basic structure
- [x] Server auto start/stop logic

### Phase 2: Plugin Development ✅

- [x] Plugin manifest (`plugin.json`)
- [x] SessionStart hook implementation
- [x] UserPromptSubmit hook implementation
- [x] Stop hook + transcript parser
- [x] `/bookmark` command implementation

### Phase 3: MCP Development ✅

- [x] MCP server package setup (@modelcontextprotocol/sdk)
- [x] `open_dashboard` tool implementation
- [x] `get_stats` tool implementation
- [x] MCP configuration (.mcp.json)

### Phase 4: Dashboard Development ✅

- [x] Vite + React + shadcn setup
- [x] API client (TanStack Query)
- [x] Main dashboard page
- [x] Session list page
- [x] Session detail page
- [x] localStorage persistent cache (2026-01-19)
- [x] Instant page loads without loading indicators
- [x] Defensive programming with data validation
- [x] Removed automatic polling (refetchInterval)

### Phase 5: Enhanced Statistics 🚧

- [x] Daily stats API (`GET /api/v1/stats/daily`)
- [x] Date range query support
- [x] Project-based filtering
- [x] Reports page with charts
- [x] Token trend chart (Recharts)
- [x] Session bar chart (Recharts)
- [ ] Project pie chart (Recharts)

### Phase 6: Enhanced Filtering ✅

- [x] Add project filter to Sessions page
- [x] Add date range to Sessions page
- [x] Add project filter to Reports page

### Phase 7: Infrastructure Improvements 🚧

- [ ] Dashboard production build setup
- [x] Schema migration system
- [ ] Add *bun-build to .gitignore
- [x] Scheduled empty session cleanup

### Phase 8: Quality & Testing 🚧

- [x] Add unit tests for server routes (22 tests)
- [ ] Add E2E tests for hooks
- [x] Add integration tests for API (7 tests)

### Phase 10: Full-Text Search ✅

- [x] FTS5 database migration (003_add_fts_search)
- [x] searchSessions() query function with BM25 ranking
- [x] GET /api/v1/search endpoint
- [x] Search page UI with filters and result highlighting
- [x] DiffView component for code diff visualization
- [x] search_sessions MCP tool
- [x] SearchResult and SearchOptions type definitions

---

## OpenCode Plugin Implementation

For detailed OpenCode Plugin architecture and implementation, see [ARCHITECTURE.md](ARCHITECTURE.md#opencode-plugin-architecture).

---

## Verification Methods

### 1. Plugin Test

```bash
# Run Claude Code with plugin
claude --plugin-dir ./packages/ccd-plugin

# Verify server auto-start
curl http://localhost:3847/api/v1/health
```

### 2. Data Capture Test

```bash
# Verify session/message storage in DB
sqlite3 ~/.ccd/ccd.db "SELECT * FROM sessions;"
sqlite3 ~/.ccd/ccd.db "SELECT * FROM messages LIMIT 5;"
```

### 3. MCP Test

Ask Claude in a session with CCD plugin:
- "Open the dashboard" → Browser opens with dashboard
- "Show my stats" → Returns session statistics

### 4. Dashboard Test

Open http://localhost:3847 in browser

---

## Potential Issues and Solutions

| Issue | Solution |
|-------|----------|
| Multiple Claude instances starting duplicate servers | Prevent with PID file + port check |
| Reading transcript while being written | Retry logic + exponential backoff |
| Large transcript files | Track last sync UUID for incremental parsing |
| Server crash | Hooks exit 0 to prevent blocking Claude |

---

## Phase 2 Technical Notes

### Recharts Setup

```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

<LineChart data={dailyStats}>
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="total_output_tokens" stroke="#8884d8" />
</LineChart>
```

### Date Range Query SQL

```sql
SELECT * FROM daily_stats
WHERE date BETWEEN ? AND ?
ORDER BY date ASC;
```

### Project Filtering SQL

```sql
SELECT * FROM sessions
WHERE project_name = ?
  AND date(started_at) BETWEEN ? AND ?
ORDER BY started_at DESC;
```

### Dependencies

```json
{
  "recharts": "^2.x",
  "date-fns": "^3.x"
}
```

---

## Commands

### Available Slash Commands

| Command | Description | Parameters |
|----------|-------------|------------|
| `/bookmark` | Toggle bookmark on current session | note (optional) |
| `/insights` | Extract AI insights from current session | None |
| `/daily-report` | Generate daily report | date (optional, YYYY-MM-DD) |

### Usage Examples

```bash
# Toggle bookmark
/bookmark
/bookmark "fix: authentication bug"

# Extract insights
/insights

# Generate daily report
/daily-report                    # Today's report
/daily-report 2026-01-18         # Specific date
```

### Implementation

Each command is a markdown file in `packages/ccd-plugin/commands/` with:

- **YAML Frontmatter**: `description`, `argument-hint`, `allowed-tools`
- **Bash Execution**: Uses `!` syntax to execute API calls
- **Response Parsing**: Handles JSON responses and provides user-friendly output

Example structure:
```markdown
---
description: Generate a daily report for today or a specific date
argument-hint: [YYYY-MM-DD]
allowed-tools: Bash(curl:*)
---

Generate a comprehensive daily report summarizing your Claude Code sessions.

!`curl -s "http://localhost:3847/api/v1/daily-report?date=$DATE"`

Based on the response:
- Parse and display the report summary
- Show session list with insights
- Provide dashboard link
```

---

## Caching Implementation

### Overview

The dashboard uses TanStack Query with localStorage persistence to provide instant page loads and minimize API calls.

### Dependencies

```json
{
  "@tanstack/react-query": "^5.66.0",
  "@tanstack/react-query-persist-client": "^5.90.21",
  "@tanstack/query-sync-storage-persister": "^5.90.21"
}
```

### Configuration (main.tsx)

```typescript
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: Number.POSITIVE_INFINITY,
      gcTime: Number.POSITIVE_INFINITY
    }
  }
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'ccd-query-cache',
  throttleTime: 1000
});

<PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
```

**Configuration Details**:
- `staleTime: Infinity` - Cache never expires
- `gcTime: Infinity` - Garbage collection disabled
- `refetchOnWindowFocus: false` - No refresh on tab switch
- `refetchInterval: 30s` - Removed from all queries
- `throttleTime: 1000ms` - Debounce localStorage writes

### Cache Keys

| Query Key | Purpose |
|-----------|---------|
| `['stats', 'today']` | Today's stats |
| `['stats', 'daily']` | Daily stats with filters |
| `['sessions']` | Session list |
| `['session', id]` | Single session detail |
| `['session', id, 'messages']` | Session messages |
| `['search', ...]` | Search results |
| `['daily-report', date]` | Daily report data |
| `['insight', sessionId]` | Session insights |

### API Hooks with Caching

**useTodayStats** (api.ts:22-36):
```typescript
export function useTodayStats() {
  return useQuery({
    queryKey: ['stats', 'today'],
    queryFn: () => fetchApi<TodayStatsResponse>('/stats/today'),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    initialData: () => {
      try {
        const cached = localStorage.getItem('ccd-query-cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          const todayData = parsed.clientState?.queries?.find((q: { queryKey: string[] }) =>
            JSON.stringify(q.queryKey) === JSON.stringify(['stats', 'today'])
          );
          return todayData?.state?.data;
        }
      } catch (e) {
        console.error('Failed to parse cached data:', e);
      }
      return undefined;
    }
  });
}
```

### Loading Logic

Pages use `!data` check instead of `isLoading` to display cached data immediately:

```typescript
// BAD - Shows loading even with cache
if (isLoading) return <Loading />;

// GOOD - Only shows loading when truly no data
if (!data) return <Loading />;

// Render cached data immediately
return <Content data={data} />;
```

### Cache Invalidation

See [DEVELOPMENT_GUIDELINES.md](DEVELOPMENT_GUIDELINES.md#react-query-cache-invalidation) for cache invalidation rules.

### Benefits

1. **Instant Page Loads**: No loading indicator on refresh
2. **Offline Support**: Cache data available offline
3. **Reduced Server Load**: Fewer API calls
4. **Better UX**: Seamless navigation between pages
5. **Silent Updates**: Background refresh without UI disruption
