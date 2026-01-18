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

## MCP Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `open_dashboard` | Open dashboard in browser | None |
| `get_stats` | Get session statistics | period: "today" \| "week" \| "month" \| "all" |

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

- [ ] Daily stats API (`GET /api/v1/stats/daily`)
- [ ] Date range query support
- [ ] Project-based filtering
- [ ] Reports page with charts
- [ ] Token trend chart (Recharts)
- [ ] Session bar chart (Recharts)
- [ ] Project pie chart (Recharts)

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
