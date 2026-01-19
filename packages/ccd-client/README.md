# @ccd/client

Universal CCD client for OpenCode, Claude Code, and other platforms.

## Features

- **Platform-agnostic**: Works with any platform via Event Adapters
- **Type-safe**: Full TypeScript support
- **Extensible**: Easy to add new platforms
- **Lightweight**: Minimal dependencies

## Installation

```bash
pnpm add @ccd/client
```

## Usage

### OpenCode Plugin

```typescript
import { CCDClient, OpenCodeAdapter } from '@ccd/client';

const adapter = new OpenCodeAdapter(directory, projectName, gitBranch);
const client = new CCDClient(
  { serverUrl: 'http://localhost:3847/api/v1' },
  adapter
);

// Handle OpenCode events
client.handleEvent(event);

// Handle chat messages separately
const action = adapter.parseChatMessage(input, output);
if (action) {
  await client.handleEvent(action);
}
```

### Claude Code Plugin

```typescript
import { CCDClient, ClaudeCodeAdapter } from '@ccd/client';

const adapter = new ClaudeCodeAdapter();
const client = new CCDClient(
  { serverUrl: 'http://localhost:3847/api/v1' },
  adapter
);

// Handle hook events
const hookContext = JSON.parse(stdin);
await client.handleEvent(hookContext);
```

## Architecture

```
┌─────────────────┐
│  Platform Event │  (OpenCode, Claude Code, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  EventAdapter   │  (Converts to EventAction)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   CCDClient     │  (Handles common actions)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   CCD Server    │
└─────────────────┘
```

## Adding a New Platform

1. Create an adapter:

```typescript
import type { EventAdapter, EventAction } from '@ccd/client';

export class MyPlatformAdapter implements EventAdapter {
  parseEvent(event: unknown): EventAction | null {
    // Convert platform event to EventAction
    return {
      type: 'session.create',
      data: { ... }
    };
  }
}
```

2. Use it with CCDClient:

```typescript
const adapter = new MyPlatformAdapter();
const client = new CCDClient(config, adapter);
await client.handleEvent(platformEvent);
```

## License

MIT
