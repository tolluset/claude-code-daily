# CCD Plugin

Claude Code Daily and OpenCode session tracking plugin

## Installation

### Claude Code

#### Method 1: Local Development (--plugin-dir)

```bash
# Build the project
cd /path/to/ccd
pnpm install
pnpm build

# Run Claude Code with the plugin
claude --plugin-dir /path/to/ccd/packages/ccd-plugin
```

#### Method 2: Permanent Installation

Add the plugin path to your `~/.claude/settings.json`:

```json
{
  "pluginDirectories": [
    "/path/to/ccd/packages/ccd-plugin"
  ]
}
```

### OpenCode

#### Copy to OpenCode config

Copy the OpenCode plugin directory:

```bash
cp -r /path/to/ccd/packages/ccd-plugin/.opencode ~/.config/opencode/
```

#### Or create a symlink (for development)

```bash
ln -s /path/to/ccd/packages/ccd-plugin/.opencode ~/.config/opencode/ccd-tracker
```

OpenCode will automatically load the plugin from `~/.config/opencode/plugins/` or `.opencode/plugins/`.

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
    ├── plugins/
    │   └── ccd-tracker.ts  # OpenCode plugin
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
- `bun`: For running the server in development

### OpenCode

- `@opencode-ai/plugin`: Plugin API (provided by OpenCode)

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
