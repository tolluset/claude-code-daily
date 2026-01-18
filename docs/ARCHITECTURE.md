# Claude Code Daily (CCD) - Architecture

> Last Updated: 2026-01-19
> Author: tolluset

---

## System Overview

A 3-component system that automatically tracks, stores, and visualizes Claude Code sessions

```
┌─────────────────┐     ┌─────────────────┐
│  CCD Plugin     │────▶│  CCD Server     │
│  (Hooks)        │     │  (SQLite + API) │
└─────────────────┘     └────────┬────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
 ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
 │  MCP Server     │     │  CCD Dashboard  │     │  External Apps  │
 │  (LLM Access)   │     │  (React + Vite) │     │  (API Clients)  │
 └─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Tech Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Monorepo | pnpm workspaces + Turborepo | Latest |
| Server Runtime | Bun | Latest |
| Server Framework | Hono | Latest |
| Database | SQLite (Bun built-in) | Latest |
| Plugin | Shell scripts + Claude Code Hooks | Latest |
| MCP | @modelcontextprotocol/sdk + Zod | Latest |
| Dashboard | React + Vite + TailwindCSS | Latest |
| State Management | TanStack Query | Latest |
| Charts | Recharts | Phase 2 |
| Data Path | `~/.ccd/` (global storage) | - |

---

## Project Structure

```
ccd/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── .mcp.json                     # MCP server config (project scope)
├── docs/                         # Documentation
├── packages/
│   ├── ccd-plugin/              # Claude Code plugin
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json
│   │   ├── .mcp.json            # MCP server config (plugin bundle)
│   │   ├── commands/
│   │   │   └── bookmark.md      # /bookmark command
│   │   ├── hooks/
│   │   │   ├── hooks.json       # Hook configuration
│   │   │   └── scripts/         # Hook scripts
│   │   │       ├── session-start.sh
│   │   │       ├── user-prompt-submit.sh
│   │   │       └── stop.sh
│   │   └── mcp/
│   │       └── server.ts        # MCP server for plugin bundle
│   │
│   ├── ccd-server/              # Background server
│   │   ├── src/
│   │   │   ├── index.ts         # Entry point
│   │   │   ├── db/              # SQLite schema/queries
│   │   │   ├── routes/          # API endpoints
│   │   │   └── utils/           # Timeout, parser, PID
│   │
│   ├── ccd-mcp/                 # MCP server (standalone)
│   │   └── src/
│   │       └── index.ts         # MCP tools
│   │
│   └── ccd-dashboard/           # Web dashboard
│       └── src/
│           ├── components/
│           └── pages/
│
└── shared/
    └── types/                   # Shared types
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
    bookmark_note TEXT,
    summary TEXT                      -- First user message as session summary
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

**Storage Location**: `~/.ccd/ccd.db`

---

## Data Flow

```
Claude Code Session Start
        │
        ├─→ SessionStart Hook → Start server (if needed) → Register session
        │
        ├─→ UserPromptSubmit Hook → Save user message
        │
        └─→ Stop Hook → Parse transcript → Save assistant response + tokens
                │
                ▼
          SQLite DB (~/.ccd/ccd.db)
                │
        ┌───────┴───────┬───────────┐
        ▼               ▼           ▼
    Dashboard         MCP       External
    (React)          (LLM)       (API)
```

---

## Component Communication

### CCD Server (Port 3847)

- **Role**: Central data storage and API server
- **Auto Management**: Starts on session, auto-shutdown after 1 hour idle
- **Duplicate Prevention**: Single instance via PID file

### CCD Plugin

- **Role**: Claude Code integration via Hooks
- **Non-blocking**: All hooks exit 0 to prevent blocking Claude

### CCD Dashboard (Port 3848)

- **Role**: Web-based visualization
- **State Management**: TanStack Query for server data

### CCD MCP

- **Role**: LLM tool access
- **Configuration**: Project-level and plugin bundle

---

## Key Design Decisions

| Decision | Reasoning |
|----------|-----------|
| Bun runtime | Built-in SQLite, fast startup |
| Global storage (`~/.ccd/`) | Single data source across projects |
| PID file + timeout | Prevent duplicate instances, auto-cleanup |
| Hooks exit 0 | Non-blocking Claude Code execution |
| Recharts for Phase 2 | React-friendly, lightweight charting |

---

## Deployment Considerations

### Development
- Dashboard: Vite dev mode (Port 3848)
- Server: Bun dev mode (Port 3847)

### Production
- Dashboard: Static build + serve via Bun
- Server: Production build (future)

---

## Security

- Local-only data storage
- No external network requests
- No secrets stored in database
- SQLite file permissions: user-only access
