# CCD Plugin

Claude Code Daily session tracking plugin

## Installation

### Method 1: Local Development (--plugin-dir)

```bash
# Build the project
cd /path/to/ccd
pnpm install
pnpm build

# Run Claude Code with the plugin
claude --plugin-dir /path/to/ccd/packages/ccd-plugin
```

### Method 2: Permanent Installation

Add the plugin path to `~/.claude/settings.json`:

```json
{
  "pluginDirectories": [
    "/path/to/ccd/packages/ccd-plugin"
  ]
}
```

## Plugin Structure

```
ccd-plugin/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata
├── commands/
│   └── bookmark.md          # /ccd:bookmark command
├── hooks/
│   ├── hooks.json           # Hook configuration
│   └── scripts/
│       ├── session-start.sh # Runs on session start
│       ├── user-prompt-submit.sh # Runs on prompt submit
│       └── stop.sh          # Runs on session end
└── README.md
```

## Hook Behavior

| Event | Action |
|-------|--------|
| `SessionStart` | Check/start server and register session |
| `UserPromptSubmit` | Increment message count |
| `Stop` | Process session end |

## Environment Variables

- `$CLAUDE_PLUGIN_ROOT`: Plugin directory path (automatically set by Claude Code)

## Dependencies

- `jq`: For JSON parsing
- `curl`: For API calls
- `bun`: For running server in development

## Testing

```bash
# Check server status
curl http://localhost:3847/api/v1/health

# Check session list
curl http://localhost:3847/api/v1/sessions

# Manual hook script test
echo '{"session_id":"test","transcript_path":"/tmp/test","cwd":"/tmp"}' | \
  bash hooks/scripts/session-start.sh
```
