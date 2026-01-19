# CCD Plugin

Claude Code Daily and OpenCode session tracking plugin

## Installation

### Claude Code

#### Method 1: Local Development (--plugin-dir)

```bash
# Build project
cd /path/to/ccd
pnpm install
pnpm build

# Run Claude Code with plugin
claude --plugin-dir /path/to/ccd/packages/ccd-plugin
```

#### Method 2: Permanent Installation

Add plugin path to your `~/.claude/settings.json`:

```json
{
  "pluginDirectories": [
    "/path/to/ccd/packages/ccd-plugin"
  ]
}
```

### OpenCode

#### Copy to OpenCode config

The OpenCode plugin is automatically loaded from the project directory. No manual installation required!

**Plugin Location:**
- `packages/ccd-plugin/.opencode/plugin/ccd-tracker.ts`
- `packages/ccd-plugin/.opencode/package.json`

**Note:** OpenCode automatically loads plugins from `.opencode/plugin/` directories within projects.

## Plugin Structure

```
ccd-plugin/
├── .claude-plugin/         # Claude Code plugin
│   ├── plugin.json          # Plugin metadata
│   ├── commands/
│   │   └── bookmark.md      # /ccd:bookmark command
│   ├── hooks/
│   │   ├── hooks.json       # Hook configuration
│   │   └── scripts/
│   │       ├── session-start.sh
│   │       ├── user-prompt-submit.sh
│   │       └── stop.sh
│   └── README.md
└── .opencode/              # OpenCode plugin
    ├── plugin/
    │   └── ccd-tracker.ts   # OpenCode plugin
    └── package.json
```

## Behavior

### Claude Code Hooks

| Event | Action |
|-------|--------|
| `SessionStart` | Check/start server and register session |
| `UserPromptSubmit` | Save user prompt |
| `Stop` | Parse transcript and save assistant response |

### OpenCode Events

| Event | Action |
|-------|--------|
| `session.created` | Check/start server and register session |
| `message.updated` | Save user/assistant messages |
| `session.idle` | End session |

## Environment Variables

### Claude Code

- `$CLAUDE_PLUGIN_ROOT`: Plugin directory path (automatically set by Claude Code)

### OpenCode

- None (uses plugin context)

## Dependencies

### Claude Code

- `jq`: For JSON parsing
- `curl`: For API calls
- `bun`: For running the server

### OpenCode

- `@opencode-ai/plugin`: Plugin API (provided by OpenCode, must be in `~/.config/opencode/package.json`)

## Testing

```bash
# Check server status
curl http://localhost:3847/api/v1/health

# Check session list
curl http://localhost:3847/api/v1/sessions

# Manual Claude Code hook script test
echo '{"session_id":"test","transcript_path":"/tmp/test","cwd":"/tmp"}' | \
  bash hooks/scripts/session-start.sh
```

## Features

- **Claude Code**: Session tracking via hooks, transcript parsing
- **OpenCode**: Session tracking via plugin events, real-time data capture
- **Unified Dashboard**: Both session types visible in CCD dashboard
- **Token Tracking**: Input/output tokens for cost estimation
- **Bookmarking**: Mark important sessions for quick reference
- **Source Tagging**: Sessions tagged with 'claude' or 'opencode' source

## Troubleshooting

### OpenCode Plugin Not Loading

1. **Check file location**: Ensure plugin file is at `~/.config/opencode/plugin/ccd-tracker.ts`
2. **Check package.json**: Ensure `~/.config/opencode/package.json` contains `@opencode-ai/plugin` dependency
3. **Restart OpenCode**: Restart OpenCode to reload plugins
4. **Check logs**: Review OpenCode logs for plugin errors

### Server Not Starting

1. **Verify server command**: Ensure `ccd-server` is installed and in PATH
2. **Manual server start**: Try `ccd-server` command manually
3. **Check logs**: Review `~/.ccd/server.log` for errors

### Sessions Not Appearing in Dashboard

1. **Verify server running**: `curl http://localhost:3847/api/v1/health`
2. **Check database**: `sqlite3 ~/.ccd/ccd.db "SELECT * FROM sessions LIMIT 5;"`
3. **Restart session**: Start a new OpenCode session to trigger plugin
