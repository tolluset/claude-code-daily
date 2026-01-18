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
- **CLI Tool** - Quick stats directly from terminal

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
                        │  (React + Vite) │
                        └─────────────────┘
```

---

## Installation

### Option 1: From Marketplace (Recommended)

```bash
# Add marketplace
/plugin marketplace add tolluset/claude-code-daily

# Install plugin
/plugin install ccd@claude-code-daily
```

### Option 2: From Source

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

---

## Usage

### Plugin Features

Once the plugin is installed, CCD automatically:
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

### CLI Commands

| Command | Description |
|---------|-------------|
| `ccd` | Open web dashboard in browser |
| `ccd report` | Show today's statistics |
| `ccd list` | List today's sessions (bookmarked first) |

### CLI Output Examples

**`ccd report`**
```
📊 Claude Code Daily Report

Date: 2026-01-19
────────────────────────────────
Sessions:        5
Messages:        127
Input Tokens:    45,230
Output Tokens:   89,102
────────────────────────────────
```

**`ccd list`**
```
📋 Today's Sessions

   Time     Project              Description                    Messages
──────────────────────────────────────────────────────────────────────────
★  14:30   ccd                  Plugin hook implementation       23
★  10:15   my-app               Login bug fix                    15
   16:45   ccd                  CLI command implementation       8
   09:00   docs                 README update                    3
```

---

## Development

### Running Locally

```bash
# Server (Port 3847)
cd packages/ccd-server && bun run src/index.ts

# Dashboard (Port 3848)
cd packages/ccd-dashboard && pnpm dev

# CLI
cd packages/ccd-cli && bun run src/index.ts
```

### Project Structure

```
ccd/
├── packages/
│   ├── ccd-server/      # Backend server (Bun + Hono + SQLite)
│   ├── ccd-cli/         # CLI tool (Commander.js)
│   ├── ccd-dashboard/   # Web dashboard (React + Vite)
│   └── ccd-plugin/      # Claude Code plugin (Bash hooks)
└── shared/
    └── types/           # Shared TypeScript types
```

---

## Data Storage

All data is stored locally at `~/.ccd/ccd.db` (SQLite).

No external servers or cloud services are used - your data stays on your machine.

---

## Documentation

See `docs/` folder for detailed documentation:

| Document | Description |
|----------|-------------|
| [FEATURES.md](docs/FEATURES.md) | Implemented features list |
| [PLAN.md](docs/PLAN.md) | Implementation plan and API spec |
| [PRD.md](docs/PRD.md) | Product Requirements Document |
| [STATUS.md](docs/STATUS.md) | Development progress |

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Monorepo | pnpm workspaces + Turborepo |
| Server | Bun + Hono + SQLite |
| Plugin | Bash scripts + Claude Code Hooks |
| CLI | TypeScript + Commander.js |
| Dashboard | React + Vite + TailwindCSS + TanStack Query |

---

## License

MIT
