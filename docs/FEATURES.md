# Implemented Features

## Project Structure

```
ccd/
├── packages/
│   ├── ccd-server/      # Backend server (Bun + Hono + SQLite)
│   ├── ccd-cli/         # CLI tool (Commander.js)
│   ├── ccd-dashboard/   # Web dashboard (React + Vite + shadcn)
│   └── ccd-plugin/      # Claude Code plugin (Bash hooks)
└── shared/
    └── types/           # Shared TypeScript types
```

---

## Implemented Features

### 1. CCD Server (Port 3847)

| Feature | Status | Description |
|---------|--------|-------------|
| Session CRUD | ✅ | POST/GET /api/v1/sessions |
| Message CRUD | ✅ | POST/GET /api/v1/messages |
| Bookmark toggle | ✅ | POST /api/v1/sessions/:id/bookmark |
| Today's stats | ✅ | GET /api/v1/stats/today |
| Transcript sync | ✅ | POST /api/v1/sync/transcript |
| Auto start/stop | ✅ | PID file based + 1 hour idle timeout |

### 2. CCD Plugin (Claude Code Integration)

| Hook | Status | Action |
|------|--------|--------|
| SessionStart | ✅ | Server check/start + session registration |
| UserPromptSubmit | ✅ | Save user prompt |
| Stop | ✅ | Transcript parsing + bulk save |
| /bookmark command | ✅ | Toggle current session bookmark |

### 3. CCD CLI

| Command | Status | Function |
|---------|--------|----------|
| ccd | ✅ | Open web dashboard |
| ccd report | ✅ | Today's stats (sessions/messages/tokens) |
| ccd list | ✅ | Today's session list (bookmarked first) |

### 4. CCD Dashboard (Port 3848)

| Page | Status | Function |
|------|--------|----------|
| / (main) | ✅ | Stats cards + recent 5 sessions |
| /sessions | ✅ | Full session list + bookmark filter |
| /sessions/:id | ✅ | Session detail + conversation history |

---

## Database Schema (SQLite)

```
sessions      -- Session metadata (id, cwd, project_name, git_branch, bookmark, etc.)
messages      -- Messages (session_id, type, content, model, tokens, timestamp)
daily_stats   -- Daily statistics (session_count, message_count, total_tokens)

Storage: ~/.ccd/ccd.db
```

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
       ┌───────┴───────┐
       ▼               ▼
   CLI (ccd)      Dashboard (React)
```

---

## Key Features

1. **Auto server management**: Auto-start on session, auto-shutdown after 1 hour idle
2. **Duplicate prevention**: Single server instance via PID file
3. **Non-blocking**: All hooks exit 0 to not block Claude
4. **Bookmark system**: Bookmark important sessions with notes
5. **Token tracking**: Track input/output tokens per message

---

## Future Considerations

- Dashboard production build (currently Vite dev mode only)
- Statistics charts (daily/weekly trends)
- Data export/import functionality
- Schema migration system
- Date range history view (currently today only)
- Project-based filtering
