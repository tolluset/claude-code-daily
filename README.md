# Claude Code Daily (CCD)

> **v0.1.0** - A comprehensive dashboard for tracking and analyzing your Claude Code usage with advanced statistics, filtering, and full-text search.

A powerful, privacy-first dashboard that automatically captures all your Claude Code sessions, providing deep insights into your AI-assisted development workflow.

## ✨ Key Features

### 📊 Enhanced Statistics (Phase 5)
- **Daily Stats API** - Track sessions, messages, and tokens with date range support
- **Interactive Charts** - Visualize trends with Recharts:
  - Token Usage Trend (line chart)
  - Sessions per Day (bar chart)
  - Project Distribution (pie chart)
- **Reports Page** - Comprehensive analytics with customizable date ranges

### 🔍 Full-Text Search (Phase 10)
- **FTS5-Powered Search** - Lightning-fast search across all sessions and messages
- **BM25 Ranking** - Relevance-based result ordering
- **Advanced Filters** - Date range, project, and bookmarked status
- **Highlighted Results** - See matching text snippets in context

### 🎯 Smart Filtering (Phase 6)
- **Project Filter** - Focus on specific projects across all pages
- **Date Range** - Analyze any time period
- **Bookmark Filter** - Quickly find important sessions

### ✅ Quality Assurance (Phase 8)
- **29 Test Suite** - Comprehensive unit and integration tests
- **Test Coverage** - All critical paths validated
- **Reliable Operation** - Automated empty session cleanup

### 🧠 AI Session Insights (Phase 11 - New!)
- **Smart Analysis** - Claude analyzes your sessions to extract meaningful insights
- **Structured Extraction** - Summary, key learnings, problems solved, code patterns, technologies
- **Easy Access** - Use `/extract-insights` command or enable auto-extraction
- **Editable Notes** - Add your own notes to AI-generated insights
- **Zero Config** - Uses Claude Code's built-in AI, no API keys needed

### 🔧 Core Features
- **Auto Session Tracking** - Automatic capture via Claude Code hooks
- **Coding Streak Tracker** - Track your daily coding habits with fire emoji 🔥
- **Dark Mode** - Toggle between light and dark themes with persistent preference
- **Bookmark System** - Mark and annotate important sessions
- **Token Tracking** - Monitor input/output tokens per message
- **MCP Integration** - Control via natural language (open dashboard, search, stats)
- **Privacy-First** - All data stored locally in SQLite (`~/.ccd/ccd.db`)

## 🚀 Quick Start

### Installation (Recommended)

```bash
# Inside Claude Code
/plugin marketplace add tolluset/claude-code-daily
/plugin install ccd@claude-code-daily
```

The plugin automatically:
- Starts the server when you begin a session
- Tracks all sessions and messages
- Configures MCP tools for easy access
- Auto-shutdowns after 1 hour of inactivity

### From Source (Development)

```bash
# Clone and install
git clone https://github.com/tolluset/claude-code-daily.git
cd claude-code-daily
pnpm install
pnpm build

# Run with plugin
claude --plugin-dir ./packages/ccd-plugin
```

## 📖 Usage

### Web Dashboard

Open http://localhost:3847 to access:

| Page | Description |
|------|-------------|
| **Dashboard** | Today's stats summary + recent sessions |
| **Sessions** | Full session list with project/date filters |
| **Reports** | Analytics with 3 interactive charts |
| **Search** | Full-text search across all content |
| **Session Detail** | Complete conversation history with token breakdown |

### MCP Tools (Ask Claude)

With MCP configured, ask Claude directly:

| Request | Tool | Description |
|---------|------|-------------|
| "Open the dashboard" | `open_dashboard` | Opens dashboard in browser |
| "Show my stats" | `get_stats` | Returns session statistics |
| "What did I do this week?" | `get_stats(period: "week")` | Weekly summary |
| "Search for API authentication" | `search_sessions` | Full-text search with filters |

### Slash Commands

```bash
# Inside Claude Code
/bookmark              # Toggle bookmark on current session
/bookmark "fix: auth"  # Bookmark with a note
/insights              # Extract AI insights from current session
```

**New: AI Session Insights** 🧠
- Use `/insights` to automatically analyze the current session
- Extracts: Summary, key learnings, problems solved, code patterns, technologies
- View insights on the Session Detail page
- Optional: Enable auto-extraction on session end (see Configuration below)

### API Endpoints

The server exposes a RESTful API at `http://localhost:3847/api/v1`:

**Sessions**
- `GET /sessions` - List sessions (supports `?from=`, `?to=`, `?project=`)
- `GET /sessions/:id` - Session details
- `POST /sessions/:id/bookmark` - Toggle bookmark
- `DELETE /sessions/:id` - Delete session

**Statistics**
- `GET /stats/today` - Today's stats
- `GET /stats/daily` - Daily stats with date range

**Search**
- `GET /search` - Full-text search (supports `?q=`, `?project=`, `?bookmarked=`)

**Health**
- `GET /health` - Server status

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  CCD Plugin     │────▶│  CCD Server     │
│  (Hooks + MCP)  │     │  (SQLite + API) │
└─────────────────┘     └────────┬────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
 ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
 │  MCP Tools      │     │  Web Dashboard  │     │  External Apps  │
 │  • open_dashboard│     │  • React + Vite │     │  • API Clients  │
 │  • get_stats    │     │  • Recharts     │     │  • CLI Tools    │
 │  • search_sessions│    │  • TanStack Query│    │                 │
 └─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Database Schema

**Tables**:
- `sessions` - Session metadata (project, branch, bookmarks, summary)
- `messages` - Individual messages with token counts
- `daily_stats` - Aggregated daily statistics
- `messages_fts` - FTS5 virtual table for message search
- `sessions_fts` - FTS5 virtual table for session search

**Storage**: `~/.ccd/ccd.db` (SQLite, local-only)

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Monorepo | pnpm workspaces + Turborepo |
| Server Runtime | Bun (dev) / Node.js (prod) |
| Server Framework | Hono |
| Database | SQLite with FTS5 (full-text search) |
| Plugin | Bash scripts + Claude Code Hooks |
| MCP | @modelcontextprotocol/sdk + Zod |
| Dashboard | React + Vite + TailwindCSS |
| State Management | TanStack Query |
| Charts | Recharts |
| Testing | Bun Test (29 tests) |

## 📂 Project Structure

```
ccd/
├── packages/
│   ├── ccd-server/      # Backend server (Bun + Hono + SQLite)
│   │   ├── src/routes/  # API endpoints
│   │   ├── src/db/      # Database queries + migrations
│   │   └── __tests__/   # Unit & integration tests
│   ├── ccd-dashboard/   # Web dashboard (React + Vite)
│   │   ├── src/pages/   # Dashboard, Sessions, Reports, Search
│   │   └── src/components/  # Charts, UI components
│   ├── ccd-mcp/         # MCP server for LLM tools
│   └── ccd-plugin/      # Claude Code plugin
│       ├── hooks/       # SessionStart, UserPromptSubmit, Stop
│       └── commands/    # /bookmark command
└── shared/
    └── types/           # Shared TypeScript types
```

## 📊 Current Status

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Infrastructure | ✅ Complete | 6/6 (100%) |
| Phase 2: Plugin Development | ✅ Complete | 6/6 (100%) |
| Phase 3: MCP Development | ✅ Complete | 6/6 (100%) |
| Phase 4: Dashboard (MVP) | ✅ Complete | 6/6 (100%) |
| **Phase 5: Enhanced Statistics** | ✅ Complete | 10/10 (100%) |
| **Phase 6: Enhanced Filtering** | ✅ Complete | 3/3 (100%) |
| Phase 7: Infrastructure | 🚧 In Progress | 2/4 (50%) |
| **Phase 8: Quality & Testing** | 🚧 In Progress | 2/3 (67%) |
| Phase 9: Advanced Features | ⬜ Backlog | 0/5 (0%) |
| **Phase 10: Full-Text Search** | ✅ Complete | 7/7 (100%) |

**Overall**: 31/50 tasks completed (62%)

## 🔮 Roadmap

### Next Steps
- **Production Build** - Optimize dashboard for deployment
- **E2E Testing** - Automated hook testing
- **Data Export** - JSON/CSV export functionality

### Future Enhancements
- Multi-device sync via cloud storage
- AI-powered usage insights
- Peak coding hour analysis
- Advanced search operators (AND, OR, NOT)

## ⚙️ Configuration

CCD supports optional configuration via `~/.ccd/config.json`:

```json
{
  "auto_extract_insights": false
}
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `auto_extract_insights` | boolean | `false` | Automatically extract AI insights when a session ends. Requires `claude` CLI to be available. |

**To enable auto-extraction**:

1. Create `~/.ccd/config.json`:
   ```bash
   echo '{"auto_extract_insights": true}' > ~/.ccd/config.json
   ```

2. Insights will be automatically generated in the background when you end a Claude Code session

3. View extracted insights on the Session Detail page

**Note**: Auto-extraction runs asynchronously and does not block session shutdown.

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, database schema, design decisions |
| [IMPLEMENTATION.md](docs/IMPLEMENTATION.md) | API endpoints, hook implementation, MCP tools |
| [TASKS.md](docs/TASKS.md) | Complete task management and progress tracking |
| [STATUS.md](docs/STATUS.md) | Development status and recent achievements |
| [SEARCH_IMPLEMENTATION.md](docs/SEARCH_IMPLEMENTATION.md) | Full-text search feature documentation |
| [DARK_MODE_IMPLEMENTATION.md](docs/DARK_MODE_IMPLEMENTATION_2026-01-19.md) | Dark mode feature implementation details |

## 🤝 Contributing

Contributions are welcome! Please check:
- [TASKS.md](docs/TASKS.md) for open tasks
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design
- Run `pnpm test` before submitting PRs

## 📄 License

MIT

---

**Made with ❤️ by tolluset**

**Powered by Claude Sonnet 4.5**
