# @ccd/opencode-plugin

OpenCode plugin for Claude Code Daily (CCD) - Automatically track sessions, messages, and usage statistics.

## Installation

### Option 1: From npm (Recommended)

Add to your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["@ccd/opencode-plugin"]
}
```

### Option 2: Local Development

1. Copy the built plugin to your project:

```bash
cp packages/opencode-plugin/dist/index.js .opencode/plugins/ccd-plugin.js
```

2. Restart opencode

## How It Works

This plugin automatically:

1. **Starts CCD server** on session creation if not running
2. **Tracks sessions** - records session start/end
3. **Captures messages** - saves user and assistant messages
4. **Logs tool output** - captures bash command results

## Requirements

- CCD server (`ccd-server`) must be available in PATH
- CCD server runs on `http://localhost:3847`
- Data stored in `~/.ccd/ccd.db`

## Development

```bash
cd packages/opencode-plugin
bun run build
```

## License

MIT
