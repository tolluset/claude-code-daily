# Claude Code Daily (CCD) Implementation Plan

## Project Overview

A 3-component system that automatically tracks, stores, and visualizes Claude Code sessions

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  CCD Plugin     │────▶│  CCD Server     │◀────│  CCD CLI        │
│  (Hooks)        │     │  (SQLite + API) │     │  (Commands)     │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  CCD Dashboard  │
                        │  (React + shadcn)│
                        └─────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Monorepo | pnpm workspaces + Turborepo |
| Server | **Bun** + Hono + SQLite (Bun built-in) |
| Plugin | Shell scripts + Claude Code Hooks |
| CLI | TypeScript + Commander.js |
| Dashboard | React + Vite + shadcn/ui + TanStack Query |
| Data Path | **~/.ccd/** (global storage) |

## Key Decisions

- **Server**: Use Bun (built-in SQLite, fast startup)
- **Dashboard**: Local webserver approach (open http://localhost:3847 in browser)
- **Data storage**: Global storage in `~/.ccd/` directory

---

## Project Structure

```
claude-code-daily/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── packages/
│   ├── ccd-plugin/           # Claude Code plugin
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── commands/
│   │   │   └── bookmark.md   # /bookmark command
│   │   └── hooks/
│   │       └── scripts/      # Hook scripts
│   │
│   ├── ccd-server/           # Background server
│   │   └── src/
│   │       ├── index.ts      # Entry point
│   │       ├── db/           # SQLite schema/queries
│   │       ├── routes/       # API endpoints
│   │       └── utils/        # Timeout, parser
│   │
│   ├── ccd-dashboard/        # Web dashboard
│   │   └── src/
│   │       ├── components/
│   │       └── pages/
│   │
│   └── ccd-cli/              # CLI tool
│       └── src/
│           └── commands/
│
└── shared/
    └── types/                # Shared types
```

---

## Database Schema

```sql
-- Sessions table
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,              -- Claude Code session_id
    transcript_path TEXT NOT NULL,
    cwd TEXT NOT NULL,
    project_name TEXT,
    git_branch TEXT,
    started_at DATETIME NOT NULL,
    ended_at DATETIME,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    bookmark_note TEXT
);

-- Messages table
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL REFERENCES sessions(id),
    uuid TEXT UNIQUE,
    type TEXT NOT NULL,               -- 'user', 'assistant'
    content TEXT,
    model TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    timestamp DATETIME NOT NULL
);

-- Daily stats table
CREATE TABLE daily_stats (
    date TEXT PRIMARY KEY,            -- YYYY-MM-DD
    session_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0,
    total_input_tokens INTEGER DEFAULT 0,
    total_output_tokens INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_sessions_date ON sessions(date(started_at));
CREATE INDEX idx_sessions_bookmarked ON sessions(is_bookmarked);
CREATE INDEX idx_messages_session ON messages(session_id);
```

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
| GET | /stats/daily | Daily stats |

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
| `SessionEnd` | Handle session end |

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

## CLI Commands

| Command | Description |
|---------|-------------|
| `ccd` | Open dashboard (browser) |
| `ccd report` | Show today's stats and insights |
| `ccd list` | Today's session list (bookmarked first) |

### `ccd report` Output Example

```
📊 Claude Code Daily Report

Date: 2026-01-18
────────────────────────────────
Sessions:        5
Messages:        127
Input Tokens:    45,230
Output Tokens:   89,102
────────────────────────────────

💡 Insights:
Most active project: ccd
Peak coding hour: 14:00
```

### `ccd list` Output Example

```
📋 Today's Sessions

   Time     Project              Description                              Messages
──────────────────────────────────────────────────────────────────────────────────
★  14:30   ccd                  Plugin hook implementation                 23
★  10:15   my-app               Login bug fix                              15
   16:45   ccd                  CLI command implementation                 8
   09:00   docs                 README update                              3
```

---

## Dashboard Features

### Page Structure

1. **Main (`/`)**: Today's stats summary + recent sessions
2. **Session list (`/sessions`)**: Filterable/sortable table
3. **Session detail (`/sessions/:id`)**: Full conversation + token usage
4. **Reports (`/reports`)**: Daily/weekly stats charts

### Key Components

- `DailyStats`: Stats card grid
- `SessionList`: Session list table
- `SessionDetail`: Conversation timeline
- `BookmarkBadge`: Bookmark display/toggle

---

## Implementation Order

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
- [ ] SessionEnd hook implementation (unused - replaced by Stop hook)
- [x] `/bookmark` command implementation

### Phase 3: CLI Development ✅

- [x] Commander.js CLI basic structure
- [x] `ccd report` implementation
- [x] `ccd list` implementation
- [x] `ccd` (open dashboard) implementation

### Phase 4: Dashboard Development ✅

- [x] Vite + React + shadcn setup
- [x] API client (TanStack Query)
- [x] Main dashboard page
- [x] Session list page
- [x] Session detail page
- [ ] Statistics charts (planned for future)

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

### 3. CLI Test

```bash
ccd list    # Show session list
ccd report  # Show stats
ccd         # Open dashboard
```

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
