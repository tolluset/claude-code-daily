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
| Plugin (Claude Code) | Shell scripts + Claude Code Hooks | Latest |
| Plugin (OpenCode) | @opencode-ai/plugin + TypeScript | Latest |
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
    source TEXT DEFAULT 'claude',    -- 'claude' or 'opencode'
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

-- Full-Text Search tables (FTS5)
CREATE VIRTUAL TABLE messages_fts USING fts5(
    content,
    session_id UNINDEXED,
    type UNINDEXED,
    timestamp UNINDEXED,
    tokenize='porter unicode61'
);

CREATE VIRTUAL TABLE sessions_fts USING fts5(
    summary,
    bookmark_note,
    session_id UNINDEXED,
    project_name UNINDEXED,
    is_bookmarked UNINDEXED,
    started_at UNINDEXED,
    tokenize='porter unicode61'
);

-- Indexes
CREATE INDEX idx_sessions_date ON sessions(date(started_at));
CREATE INDEX idx_sessions_bookmarked ON sessions(is_bookmarked);
CREATE INDEX idx_messages_session ON messages(session_id);

-- Triggers for automatic FTS sync
CREATE TRIGGER messages_ai AFTER INSERT ON messages BEGIN
  INSERT INTO messages_fts(rowid, content, session_id, type, timestamp)
  VALUES (new.id, new.content, new.session_id, new.type, new.timestamp);
END;

CREATE TRIGGER sessions_ai AFTER INSERT ON sessions BEGIN
  INSERT INTO sessions_fts(rowid, summary, bookmark_note, session_id, project_name, is_bookmarked, started_at)
  VALUES (new.rowid, new.summary, new.bookmark_note, new.id, new.project_name, new.is_bookmarked, new.started_at);
END;

CREATE TRIGGER sessions_au AFTER UPDATE ON sessions BEGIN
  UPDATE sessions_fts
  SET summary = new.summary, bookmark_note = new.bookmark_note,
      is_bookmarked = new.is_bookmarked, project_name = new.project_name
  WHERE rowid = new.rowid;
END;
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

### OpenCode Plugin Architecture

OpenCode uses a plugin-based event system for session tracking. The plugin subscribes to real-time events and sends data to the CCD Server.

```
OpenCode Session
          │
          ├─→ session.created event → Start server (if needed) → Register session
          │
          ├─→ message.updated event → Save user/assistant messages
          │
          └─→ session.idle event → End session
                  │
                  ▼
            SQLite DB (~/.ccd/ccd.db)
                  │
          ┌───────┴───────────┬───────────┐
          ▼               ▼           ▼
      Dashboard         CCD API       OpenCode
      (React)          (Port 3847)     (Plugin)
```

#### Event Mapping

| Claude Code Hook | OpenCode Event | Purpose |
|-----------------|----------------|---------|
| SessionStart | session.created | Register session |
| UserPromptSubmit | message.updated (role='user') | Save user message |
| Stop | message.updated (role='assistant') | Save assistant message + tokens |
| (none) | session.idle | End session |

#### Plugin Location

- **File**: `packages/ccd-plugin/.opencode/plugins/ccd-tracker.ts`
- **Auto-loaded** by OpenCode from `~/.config/opencode/plugins/`
- **Dependencies**: `@opencode-ai/plugin` (provided by OpenCode)

#### Core Functions

**Session Registration**:
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

**Message Saving**:
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
- Extracts text content from message parts (TextPart only)
- Saves user/assistant messages
- Updates daily stats for token usage

**Content Extraction**:
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
- Ignores tool calls, files, and other part types

#### Data Processing

1. **Session Creation**:
   - Extract `session.id`, `session.path`, `session.directory`
   - Server health check + start if needed
   - Register with `source='opencode'`

2. **Message Tracking**:
   - User messages: Extract `TextPart` content only
   - Assistant messages: Extract `TextPart` content + tokens
   - First user message used as session summary

3. **Session End**:
   - Update `ended_at` timestamp
   - Clear message cache

#### Key Differences from Claude Code Hooks

| Aspect | Claude Code Hooks | OpenCode Plugin |
|--------|------------------|------------------|
| Trigger | Hook JSON input | Plugin event system |
| Token Data | Transcript parsing | Direct from message.tokens |
| Server Start | Shell script | Fetch-based health check |
| Content Extraction | Full transcript | TextPart only (simplified) |

#### Installation

**OpenCode Plugin Directory**:
```bash
cp -r /path/to/ccd/packages/ccd-plugin/.opencode ~/.config/opencode/
```

**Auto-Loading**:
- OpenCode loads plugins from `~/.config/opencode/plugins/` or `.opencode/plugins/`
- No manual configuration required

---

## Background Cleanup

**Empty Session Removal** (P7-004):
- Triggered on **SessionStart hook** (asynchronously, non-blocking)
- Sessions without messages are deleted
- Daily stats are decremented for affected dates
- Executes every time a new session starts
- Also available via API: POST `/api/v1/sessions/clean-empty`

**Implementation**:
```typescript
// Service layer (SessionService)
static cleanEmptySessions(): { deleted: string[]; sessions: string[] } {
  return cleanEmptySessions();
}

// API endpoint
sessions.post('/clean-empty', (c) => {
  const result = SessionService.cleanEmptySessions();
  return c.json(successResponse({
    deleted: result.deleted,
    count: result.deleted.length,
    affectedDates: result.sessions
  }));
});
```

**Hook Integration** (session-start.sh):
```bash
# 4. Clean empty sessions (async, non-blocking)
curl -s -X POST "$CCD_SERVER_URL/api/v1/sessions/clean-empty" > /dev/null 2>&1 &
```

**Benefits**:
- Automatic cleanup when users actually use Claude Code
- No dependency on dashboard access
- Background execution doesn't block session creation
- Keeps database clean without manual intervention

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
