# Claude Code Daily (CCD)

A dashboard for tracking and visualizing your daily Claude Code usage data.

## Why CCD?

When using Claude Code daily, you might wonder:

- **"How much am I actually using Claude Code?"** - Track sessions, messages, and token usage
- **"What did I work on last week?"** - Review your coding history and patterns
- **"Where did that useful session go?"** - Bookmark important sessions for quick access
- **"Am I using AI efficiently?"** - Analyze your usage trends over time

CCD automatically captures all your Claude Code sessions in the background, providing insights into your AI-assisted development workflow.

## Features

- **Auto Session Tracking** - Automatically saves sessions and messages via Claude Code plugin
- **Bookmark System** - Mark important sessions with notes for quick reference
- **Token Usage Tracking** - Monitor input/output tokens per message
- **Web Dashboard** - React-based visualization dashboard
- **MCP Integration** - Ask Claude directly to open dashboard or show stats

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  CCD Plugin     │────▶│  CCD Server     │
│  (Hooks + MCP)  │     │  (SQLite + API + Dashboard)
└─────────────────┘     └────────┬────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          ▼                        ▼                        ▼
  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
  │  MCP Tools      │     │  HTTP API       │     │  Web Dashboard  │
  │  (LLM Access)   │     │  (Sessions,    │     │  (React UI)     │
  │                 │     │   Messages,     │     │                 │
  │  • open_dashboard│     │   Stats)       │     │  • Stats cards  │
  │  • get_stats    │     │                 │     │  • Sessions     │
  └─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Installation

### Quick Start (Recommended)

```bash
# Inside Claude Code
/plugin marketplace add tolluset/claude-code-daily
/plugin install ccd@claude-code-daily
```

That's it! The plugin will:
- Automatically start the server when you begin a Claude Code session
- Track all your sessions and messages
- Configure MCP tools for easy access

### Manual Installation

If you need to install the server manually:

```bash
npm install -g ccd-server
```

The server will be auto-started by the plugin when needed.

### From Source (Development)

```bash
# Clone repository
git clone https://github.com/tolluset/claude-code-daily.git
cd claude-code-daily

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run Claude Code with plugin
claude --plugin-dir ./packages/ccd-plugin
```

### Plugin Configuration (Development)

The plugin will be auto-detected by Claude Code when using `--plugin-dir`.

For permanent installation, add to `~/.claude/settings.json`:

```json
{
  "pluginDirectories": [
    "/path/to/claude-code-daily/packages/ccd-plugin"
  ]
}
```

---

## Usage

### Auto Tracking

Once the plugin is loaded, CCD automatically:
- Starts the server when a Claude Code session begins
- Registers each session with project info and git branch
- Saves user prompts in real-time
- Parses transcript and saves assistant responses on session stop
- Auto-shutdowns the server after 1 hour of inactivity

### Bookmark Command

```bash
# Inside Claude Code session
/bookmark              # Toggle bookmark on current session
/bookmark "note"       # Bookmark with a note
```

### MCP Tools (Ask Claude)

When the MCP server is configured, you can ask Claude directly:

| Request | MCP Tool |
|---------|----------|
| "Open the dashboard" | `open_dashboard` - Opens dashboard in browser |
| "Show my stats" | `get_stats` - Returns session statistics |
| "What did I do this week?" | `get_stats(period: "week")` - Weekly summary |

### Web Dashboard

Open http://localhost:3847 in your browser (or ask Claude to "open dashboard") to view:
- Today's stats summary
- Session list with bookmark filter
- Session details with conversation history

---

## Development

### Running Locally

```bash
# Server (Port 3847 - includes Dashboard)
cd packages/ccd-server && bun run src/index.ts

# MCP Server (for development/testing)
cd packages/ccd-mcp && bun run src/index.ts

# Dashboard dev mode (Vite with HMR)
cd packages/ccd-dashboard && pnpm dev
```

### Packaging Server for npm

```bash
# Build dashboard for production
cd packages/ccd-dashboard && pnpm build

# Build server and package for npm
cd packages/ccd-server
pnpm build
npm pack
```

### MCP Configuration

The plugin includes `.mcp.json` for auto-configuration. When installed, MCP tools are automatically available.

### Project Structure

```
ccd/
├── packages/
│   ├── ccd-server/      # Backend server (Bun + Hono + SQLite)
│   ├── ccd-dashboard/   # Web dashboard (React + Vite)
│   ├── ccd-mcp/         # MCP server for LLM tools
│   └── ccd-plugin/      # Claude Code plugin (Hooks + MCP)
└── shared/
    └── types/           # Shared TypeScript types
```

---

## Data Storage

All data is stored locally at `~/.ccd/ccd.db` (SQLite).

No external servers or cloud services are used - your data stays on your machine.

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture and tech stack |
| [IMPLEMENTATION.md](docs/IMPLEMENTATION.md) | API and implementation details |
| [STATUS.md](docs/STATUS.md) | Development progress |
| [TASKS.md](docs/TASKS.md) | Task management |

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Monorepo | pnpm workspaces + Turborepo |
| Server | Node.js + Hono + better-sqlite3 |
| Plugin | Bash scripts + Claude Code Hooks |
| MCP | @modelcontextprotocol/sdk + Zod |
| Dashboard | React + Vite + TailwindCSS + TanStack Query |

---

## Future Features

Phase 2 (In Planning):
- Daily stats API with date range
- Reports page with charts
- Project-based filtering
- Date range picker

---

## License

MIT
