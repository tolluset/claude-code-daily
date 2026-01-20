# Claude Code Daily (CCD)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.1-green.svg)](https://github.com/tolluset/claude-code-daily)

A comprehensive analytics dashboard for Claude Code sessions. Track, analyze, and gain insights from your AI-assisted development workflow with automatic session capture, full-text search, and interactive statistics.

**Privacy-first** · **Zero configuration** · **Local storage only**

**New:** OpenCode support with TypeScript-based plugin system · Automated deployment with Bun auto-install

## Features

### Session Management
- **Automatic Tracking** - Captures all Claude Code sessions via plugin hooks
- **Bookmark System** - Mark and annotate important sessions for quick reference
- **Session Notes** - Add custom notes and insights to any session
- **Bulk Operations** - Clean up empty sessions, batch delete, and organize

### Analytics & Statistics
- **Interactive Dashboards** - Visualize trends with line, bar, and pie charts
  - Token usage over time
  - Sessions per day
  - Project distribution
- **Coding Streak Tracker** - Monitor daily coding consistency
- **Daily Reports** - Comprehensive end-of-day summaries with insights
- **Token Tracking** - Detailed input/output token breakdown per message

### Search & Filtering
- **Full-Text Search** - FTS5-powered search across all sessions and messages
- **BM25 Relevance Ranking** - Results ordered by relevance score
- **Advanced Filters** - Filter by date range, project, or bookmark status
- **Highlighted Results** - See matching text snippets in context

### AI-Powered Insights
- **Automatic Analysis** - AI extracts key learnings and patterns from sessions
- **Structured Data** - Summary, problems solved, code patterns, technologies used
- **Efficiency Scoring** - Quantitative assessment of session productivity (0-100)
- **Task Type Detection** - Automatic classification: bug fix, feature, refactor, learning, etc.
- **Difficulty Assessment** - easy, medium, hard categorization based on complexity
- **AI Reports** - Generated daily/weekly reports with insights and trends (integrated in Reports page)
- **Cost-Effective** - ~$1.50/month for daily use (5 sessions/day)

**Setup Required:**
```bash
# Set your Anthropic API key (required for AI features)
export ANTHROPIC_API_KEY="sk-ant-..."

# Add to your shell profile for persistence (~/.zshrc or ~/.bashrc)
echo 'export ANTHROPIC_API_KEY="sk-ant-..."' >> ~/.zshrc
```

Get your API key from: https://console.anthropic.com/settings/keys

### User Experience
- **Responsive Design** - Works seamlessly on desktop and tablet
- **Dark Mode** - System-aware theme with manual toggle
- **Keyboard Shortcuts** - Cmd/Ctrl + B to toggle sidebar, Escape to collapse
- **Sidebar Navigation** - Collapsible menu with active state persistence
- **Cache-First Loading** - Instant page loads with smart cache invalidation

### Integration
- **Dual Platform Support** - Works with both Claude Code and OpenCode
  - Claude Code: Shell script hooks via plugin marketplace
  - OpenCode: TypeScript plugin with event-driven tracking
- **MCP Tools** - Control dashboard via natural language commands
- **RESTful API** - Full API access for custom integrations
- **Slash Commands** - Quick actions within Claude Code (`/bookmark`, `/insights`, `/daily-report`)
- **Privacy-First** - All data stored locally in SQLite (`~/.ccd/ccd.db`)

## Quick Start

### Installation

**For Claude Code Users:**

```bash
# Inside Claude Code
/plugin marketplace add tolluset/claude-code-daily
/plugin install ccd@claude-code-daily
```

**For OpenCode Users:**

```bash
curl -fsSL https://raw.githubusercontent.com/tolluset/claude-code-daily/main/install-opencode.sh | bash
```

**What Gets Installed:**
- CCD Server (auto-starts on first session)
- Session & message tracking
- MCP tools for natural language control
- Auto-shutdown after 1 hour of inactivity
};

export const CcdPlugin: Plugin = async ({ directory }) => {
  const cwd = directory;
  const projectName = cwd.split("/").pop();
  
  try {
    const { spawn } = await import("bun");
    const gitBranch = existsSync(`${cwd}/.git`) 
      ? spawn(["git", "branch", "--show-current"], { cwd })
          .stdout.toString().trim()
      : null;

    await startServer();

    return {
      event: async ({ event }) => {
        if (event.type === "session.created") {
          const { info } = event.properties;
          fetch("http://localhost:3847/api/v1/sessions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: info.id,
              transcript_path: `opencode://${directory}/${info.id}`,
              cwd,
              project_name: projectName,
              git_branch: gitBranch,
              source: "opencode",
            }),
          }).catch(() => {});
        }
      },
    };
  } catch (e) {
    console.log("[CCD] Plugin initialization error:", e);
    return { event: async () => {} };
  }
};
EOF

# Restart OpenCode to load plugin
```

### First Steps

1. **Access Dashboard**: Open [http://localhost:3847](http://localhost:3847)
2. **Try Commands**: Use `/bookmark` or `/daily-report` in Claude Code
3. **Ask Claude**: "Show me my coding stats" or "Open dashboard"

That's it! The plugin handles the rest.

## Usage

### Dashboard Pages

Access at [http://localhost:3847](http://localhost:3847)

| Page | Description |
|------|-------------|
| **Dashboard** | Today's summary with recent sessions |
| **Sessions** | Full session history with filtering |
| **Search** | Full-text search across all content |
| **Statistics** | Interactive charts and trends |
| **Reports** | Daily report archive |
| **Session Detail** | Complete conversation with token breakdown |

### Slash Commands

```bash
/bookmark                   # Bookmark current session
/bookmark "fix: auth bug"   # Bookmark with note
/insights                   # Extract AI insights
/daily-report               # Generate today's report
/daily-report 2026-01-18    # Report for specific date
```

### Natural Language (MCP)

Ask Claude directly when MCP is configured:

- "Open my dashboard"
- "Show me this week's coding stats"
- "Search for API authentication"
- "Generate my daily report"
- "What did I work on yesterday?"

### Keyboard Shortcuts

- `Cmd/Ctrl + B` - Toggle sidebar
- `Escape` - Collapse sidebar

### API Reference

 RESTful API available at `http://localhost:3847/api/v1`

**Core Resources**
```
GET    /sessions               # List sessions (with filters)
GET    /sessions/:id           # Session details
DELETE /sessions/:id           # Delete session
POST   /sessions/:id/bookmark  # Toggle bookmark

GET    /search                 # Full-text search
GET    /stats/today            # Today's statistics
GET    /stats/daily            # Daily stats (date range)
GET    /stats/streak           # Coding streak

GET    /insights/:sessionId    # Session insights
POST   /insights               # Save insights
PATCH  /insights/:sessionId/notes  # Update notes

GET    /daily-report           # Daily report (date param)
GET    /export                 # Export all data as JSON
GET    /health                 # Server status
```

See [API Documentation](docs/IMPLEMENTATION.md#api-endpoints) for full details.

## Architecture

```
┌──────────────────┐
│  Claude Code     │
│  + CCD Plugin    │  ← Session hooks capture data
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  CCD Server      │  ← Hono API + SQLite
│  localhost:3847  │
└────────┬─────────┘
         │
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
┌────────┐ ┌──────┐ ┌─────────┐
│MCP     │ │Web   │ │External │
│Tools   │ │UI    │ │Clients  │
└────────┘ └──────┘ └─────────┘
```

**Database**: SQLite with FTS5 at `~/.ccd/ccd.db`
- `sessions` - Session metadata and bookmarks
- `messages` - Message content with tokens
- `daily_stats` - Aggregated statistics
- `*_fts` - Full-text search indices

See [Architecture Docs](docs/ARCHITECTURE.md) for details.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | pnpm workspaces + Turborepo |
| **Server** | Hono + SQLite (FTS5) |
| **Runtime** | Bun (auto-installed) |
| **Dashboard** | React 19 + Vite + TailwindCSS |
| **State** | TanStack Query |
| **Charts** | Recharts |
| **Claude Code Plugin** | Bash Hooks |
| **OpenCode Plugin** | TypeScript + @opencode-ai/plugin |
| **MCP** | @modelcontextprotocol/sdk |
| **Testing** | Bun Test (29 tests) |
| **Performance** | React Compiler (automatic memoization) |

## Project Structure

```
packages/
├── ccd-server/          # Backend API (Hono + SQLite)
├── ccd-dashboard/       # Web UI (React + Vite)
├── ccd-mcp/             # MCP server tools
└── ccd-plugin/          # Claude Code plugin
shared/
└── types/               # Shared TypeScript types
```

See [docs/](docs/) for detailed documentation.

## Configuration

Optional settings via `~/.ccd/config.json`:

```json
{
  "auto_extract_insights": false
}
```

| Option | Default | Description |
|--------|---------|-------------|
| `auto_extract_insights` | `false` | Auto-generate AI insights when sessions end |

**Enable auto-insights**:
```bash
echo '{"auto_extract_insights": true}' > ~/.ccd/config.json
```

 Insights run asynchronously and don't block session shutdown.

## Data Backup & Export

### Quick Backup (Recommended)

All your data is stored locally in SQLite:

```bash
# Backup entire CCD data
cp -r ~/.ccd ~/.ccd.backup.$(date +%Y%m%d)

# Or just the database
cp ~/.ccd/ccd.db ~/.ccd/ccd.db.backup.$(date +%Y%m%d)
```

**Location**: `~/.ccd/ccd.db` (SQLite database)

### JSON Export

Export all data as JSON via API or Dashboard:

```bash
# Export to file
curl http://localhost:3847/api/v1/export > ccd-backup-$(date +%Y%m%d).json
```

**Export format** (session-based structure):
```json
{
  "exported_at": "2026-01-20T12:34:56Z",
  "version": "0.1.1",
  "sessions": [
    {
      "id": "...",
      "project_name": "ccd",
      "git_branch": "main",
      "source": "claude-code",
      "created_at": "...",
      "messages": [...],
      "insights": {...}
    }
  ],
  "daily_stats": [...],
  "model_pricing": [...]
}
```

### Data Access Options

| Method | Use Case | Tools |
|--------|----------|-------|
| **SQLite DB** | Direct access, full backup | sqlite3, DB Browser, DBeaver |
| **JSON Export** | API integration, parsing | Any JSON-capable tool |
| **Dashboard UI** | Manual export | Click "Export" button |

**Privacy**: All data remains local - no cloud sync.

## Documentation

Comprehensive documentation available in [`docs/`](docs/):

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design and database schema
- **[IMPLEMENTATION.md](docs/IMPLEMENTATION.md)** - API, hooks, and MCP tools
- **[DEVELOPMENT_GUIDELINES.md](docs/DEVELOPMENT_GUIDELINES.md)** - Best practices
- **[TASKS.md](docs/TASKS.md)** - Development roadmap and task tracking
- **[STATUS.md](docs/STATUS.md)** - Development status and known issues

### Development Logs

Recent development activity in [`docs/development-log/`](docs/development-log/):

- **2026-01-20**: OpenCode plugin implementation, deployment automation, periodic session cleanup
- **2026-01-19**: Layout refactoring, cache-first loading, performance optimization

## Contributing

Contributions welcome! Before submitting a PR:

1. Check [TASKS.md](docs/TASKS.md) for planned work
2. Review [ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design
3. Run `pnpm test` to ensure all tests pass
4. Follow existing code style and patterns

For bugs or feature requests, please open an issue.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built by [tolluset](https://github.com/tolluset) · Powered by Claude Sonnet 4.5**
