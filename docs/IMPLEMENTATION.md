# Claude Code Daily (CCD) - Implementation Plan

> Last Updated: 2026-01-19
> Author: tolluset

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

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /search | Full-text search across sessions/messages |
| GET | /search?q=...&project=...&bookmarked=true | Search with filters |

### Sync

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /sync/transcript | Parse/sync transcript |

---

## Hook Implementation

### Claude Code Hooks Used

| Hook | Purpose |
|------|---------|
| `SessionStart` | Start server + register session |
| `UserPromptSubmit` | Capture user prompt |
| `Stop` | Parse transcript on Claude response complete |
| `SessionEnd` | Handle session end (unused - replaced by Stop) |

### OpenCode Plugin Events

| Event | Purpose |
|-------|---------|
| `session.created` | Start server + register session |
| `session.idle` | End session |
| `message.updated` (role='user') | Save user message (TextPart only) |
| `message.updated` (role='assistant') | Save assistant message + tokens |

#### Event Mapping with Claude Code Hooks

| Claude Code Hook | OpenCode Event | Purpose |
|-----------------|------------------|---------|
| SessionStart | session.created | Register session |
| UserPromptSubmit | message.updated (role='user') | Save user prompt |
| Stop | message.updated (role='assistant') | Save assistant response |
| (none) | session.idle | End session |

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

exit 0
```

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

### Usage Examples

Ask Claude directly:
- "Open the dashboard" → calls `open_dashboard`
- "Show my stats" → calls `get_stats`
- "What did I do this week?" → calls `get_stats(period: "week")`

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

### Plugin Architecture

The OpenCode plugin (`ccd-tracker.ts`) provides session tracking through event-based hooks:

**Location**: `packages/ccd-plugin/.opencode/plugins/ccd-tracker.ts`

**Event Subscriptions**:
- `session.created`: Register new OpenCode session
- `message.updated`: Track user/assistant messages
- `session.idle`: Mark session as ended

### Core Functions

#### Session Registration
```typescript
async function registerSession(data: {
  session_id: string;
  transcript_path: string;
  cwd: string;
  project_name?: string;
  source: 'claude' | 'opencode';
}): Promise<void>
```

- Checks server health via `/api/v1/health`
- Starts CCD server if not running
- Registers session with `source='opencode'`

#### Message Saving
```typescript
async function saveMessage(data: {
  session_id: string;
  uuid?: string;
  type: 'user' | 'assistant';
  content?: string;
  model?: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
}): Promise<void>
```

- Extracts text content from message parts (TextPart only - Option 2a)
- Saves user/assistant messages
- Updates daily stats for token usage

#### Content Extraction
```typescript
function extractTextContent(parts?: Array<{ type: string; text?: string }>): string {
  if (!parts) return '';
  return parts
    .filter(part => part.type === 'text' && part.text)
    .map(part => part.text)
    .join('');
}
```

- Filters parts by `type === 'text'`
- Extracts and concatenates text content
- Ignores tool calls, files, and other part types (Option 2a: Simple)

#### Session Management
```typescript
async function updateSessionSummary(sessionId: string, summary: string): Promise<void>
async function endSession(sessionId: string): Promise<void>
```

- First user message used as session summary (Option 3a)
- Marks session as ended on idle

### Installation

**OpenCode Plugin Directory**:
```bash
cp -r /path/to/ccd/packages/ccd-plugin/.opencode ~/.config/opencode/
```

**Auto-Loading**:
- OpenCode loads plugins from `~/.config/opencode/plugins/` or `.opencode/plugins/`
- No manual configuration required

### Key Differences from Claude Code Hooks

| Aspect | Claude Code Hooks | OpenCode Plugin |
|--------|------------------|------------------|
| Trigger | Hook JSON input | Plugin event system |
| Token Data | Transcript parsing | Direct from message.tokens |
| Server Start | Shell script | Fetch-based health check |
| Content Extraction | Full transcript | TextPart only (simplified) |

### Future Enhancements

- [ ] Support for complete part content (not just TextPart)
- [ ] Token caching tracking (tokens.cache.read/write)
- [ ] Better error handling and retry logic
- [ ] File change tracking via `file.edited` event
- [ ] Tool execution tracking via `tool.execute.after`

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
