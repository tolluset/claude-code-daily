# CCD Development Guide

> Last Updated: 2026-01-20
> Author: tolluset

**Table of Contents:**
- [Quick Start](#quick-start)
- [Project Status](#project-status)
- [Development Setup](#development-setup)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Development Guidelines](#development-guidelines)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Quick Start

### For Users

See [README.md](../README.md) for installation and usage instructions.

### For Developers

```bash
# Clone and install
git clone https://github.com/tolluset/claude-code-daily.git
cd claude-code-daily
pnpm install

# Development
pnpm dev              # Start all services
pnpm test             # Run tests (29 tests)

# Build
pnpm build            # Build all packages
cd packages/ccd-plugin
pnpm run build        # Build plugin for distribution
```

---

## Project Status

### Current Version

**Version**: 0.1.1
**Status**: Production-ready (Beta)

### Progress Summary

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Infrastructure | ✅ Complete | 13/13 (100%) |
| Phase 2: Plugin Development | ✅ Complete | 5/5 (100%) |
| Phase 3: MCP Development | ✅ Complete | 5/5 (100%) |
| Phase 4: Dashboard MVP | ✅ Complete | 6/6 (100%) |
| Phase 5: Enhanced Statistics | ✅ Complete | 10/10 (100%) |
| Phase 6: Enhanced Filtering | ✅ Complete | 3/3 (100%) |
| Phase 10: Full-Text Search | ✅ Complete | 7/7 (100%) |
| Phase 11: Productivity Insights | 🚧 In Progress | 14/15 (93%) |
| Phase 12: Performance Optimization | ✅ Complete | 2/2 (100%) |
| Phase 13: Layout & Navigation | ✅ Complete | 6/6 (100%) |
| Phase 14: Cache-First Loading | ✅ Complete | 3/3 (100%) |
| Phase 1.1: N+1 Query Removal | ✅ Complete | 3/3 (100%) |
| Phase 2.1: AI Insight Engine MVP | ✅ Complete | 5/5 (100%) |

**Overall**: 77/84 tasks completed (92%)

### Recent Milestones

- ✅ 2026-01-20: Phase 2.1 - AI Insight Engine MVP (Claude API integration)
- ✅ 2026-01-20: Phase 1.1 - N+1 Query Removal (10x performance improvement)
- ✅ 2026-01-20: OpenCode Plugin Support
- ✅ 2026-01-20: Plugin Deployment Automation
- ✅ 2026-01-20: Periodic Session Cleanup
- ✅ 2026-01-19: Phase 14 - Cache-First Loading Pattern
- ✅ 2026-01-19: Phase 13 - Layout & Navigation Refactoring
- ✅ 2026-01-19: Phase 12 - React Compiler Integration

### Known Issues

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| #1 | Low | Dashboard only supports Vite dev mode | Open |
| #2 | Low | No date range history view (today only) | Open |
| #3 | High | Log files grow indefinitely (32MB plugin.log) | Open |
| #4 | Medium | Empty state missing onboarding guidance | Open |
| #5 | Medium | No server status indicator in UI | Open |

---

## Development Setup

### Requirements

- Node.js 18+
- pnpm 8+
- Bun (auto-installed on first session start)

### Project Structure

```
ccd/
├── packages/
│   ├── ccd-server/      # Hono API + SQLite (port 3847)
│   ├── ccd-dashboard/   # React 19 + Vite (port 3848)
│   ├── ccd-mcp/         # MCP server tools
│   └── ccd-plugin/      # Claude Code plugin + OpenCode plugin
├── shared/
│   └── types/           # Shared TypeScript types
└── docs/
    └── development-log/  # Detailed technical logs
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services in dev mode |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests (29 tests) |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |

### Database

**Location**: `~/.ccd/ccd.db`

**Schema**:
- `sessions` - Session metadata and bookmarks
- `messages` - Message content with tokens and costs
- `daily_stats` - Aggregated statistics
- `session_insights` - AI-extracted insights
- `model_pricing` - Cost pricing for Claude models
- `*_fts` - Full-text search indices (FTS5)

**Migrations**: Located in `packages/ccd-server/src/db/migrations/`

---

## Architecture

### System Overview

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

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Monorepo** | pnpm workspaces + Turborepo |
| **Server** | Hono + SQLite (FTS5) |
| **Runtime** | Bun (auto-installed) |
| **Dashboard** | React 19 + Vite + TailwindCSS |
| **State** | TanStack Query (localStorage persistence) |
| **Charts** | Recharts |
| **Claude Code Plugin** | Bash Hooks |
| **OpenCode Plugin** | TypeScript + @opencode-ai/plugin |
| **MCP** | @modelcontextprotocol/sdk |
| **Testing** | Bun Test (29 tests) |
| **Performance** | React Compiler (automatic memoization) |

### Data Flow

**Session Creation**:
1. User starts Claude Code / OpenCode session
2. Plugin hook fires (`SessionStart` / `session.created`)
3. Server auto-starts (if not running)
4. Session registered in database
5. Empty session cleanup runs (async)

**Message Tracking**:
1. User sends prompt (`UserPromptSubmit` / `message.updated`)
2. Message saved to database with token counts
3. Cost calculated and stored immediately
4. Daily stats updated asynchronously

**Session End**:
1. User stops session (`Stop` / `session.idle`)
2. Session marked as ended (`ended_at` timestamp)
3. Transcript parsed and synced
4. Auto-extract insights triggered (if enabled)

---

## API Reference

Base URL: `http://localhost:3847/api/v1`

### Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /sessions | Register new session |
| GET | /sessions | List sessions (filters: date, project, bookmark) |
| GET | /sessions/:id | Get session detail |
| PUT | /sessions/:id | Update session |
| POST | /sessions/:id/bookmark | Toggle bookmark |
| POST | /sessions/clean-empty | Clean empty sessions |
| DELETE | /sessions/:id | Delete session (cascade messages) |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /messages | Save single message |
| POST | /messages/batch | Save multiple messages |
| GET | /sessions/:id/messages | Get session messages |

### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /stats/today | Today's statistics |
| GET | /stats/daily | Daily stats (date range or N days) |
| GET | /stats/streak | Coding streak information |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /search | Full-text search across sessions/messages (FTS5 + BM25) |

### Daily Report

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /daily-report | Comprehensive daily report (date parameter optional) |

### Insights

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /insights/:sessionId | Get session insights |
| POST | /insights | Save AI-extracted insights |
| PATCH | /insights/:sessionId/notes | Update user notes |
| DELETE | /insights/:sessionId | Delete insights |

### AI Insights

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /ai-insights/analyze/:sessionId | Analyze session with Claude API |
| GET | /ai-insights/reports | List AI-generated reports (filters: type, date) |
| POST | /ai-insights/reports/generate | Generate new AI report |
| GET | /ai-insights/reports/:id | Get AI report details |

### Sync

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /sync/transcript | Parse and sync transcript from file |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Server status check |
| POST | /shutdown | Server shutdown |

---

## Development Guidelines

### Code Style

- Use TypeScript for all code
- Follow existing patterns in codebase
- Add comments for complex logic (production comments in English)
- Run `pnpm typecheck` and `pnpm lint` before committing

### React Query Best Practices

#### Cache Invalidation Rules

**Rule 1: Session Mutations**
```typescript
// Create, update, bookmark, delete sessions
queryClient.invalidateQueries({ queryKey: ['session', id] });
queryClient.invalidateQueries({ queryKey: ['sessions'] });
queryClient.invalidateQueries({ queryKey: ['search'] });
```

**Rule 2: Message Mutations**
```typescript
// Add or update messages
queryClient.invalidateQueries({ queryKey: ['messages', sessionId] });
queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
```

**Rule 3: Insight Mutations**
```typescript
// Create, update, delete insights
queryClient.invalidateQueries({ queryKey: ['insight', sessionId] });
queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
```

#### Loading State Pattern

```typescript
// GOOD: Only show loading when truly no data
const { data, error } = useTodayStats();
if (error) return <ErrorDisplay />;
if (!data) return <Loading />;
return <Content data={data} />;  // Show cached data instantly

// BAD: Shows loading even with cache
const { data, isLoading } = useTodayStats();
if (isLoading) return <Loading />;  // User sees this on refresh
```

### TypeScript Best Practices

**1. Avoid Non-Null Assertions**
```typescript
// ❌ WRONG: Crashes if id is undefined
const { data: session } = useSession(id!);

// ✅ CORRECT: Safe null check
if (!id) return <SessionNotFound />;
const { data: session } = useSession(id);
```

**2. Explicit Generic Types**
```typescript
// ✅ GOOD: Explicit type
export function useSessionInsight(sessionId: string | undefined) {
  return useQuery<SessionInsight | null>({
    queryKey: ['insight', sessionId],
    queryFn: () => fetchInsight(sessionId),
  });
}
```

**3. Map Function Types**
```typescript
// ✅ GOOD: Explicit type
import type { Session } from '@ccd/types';
sessions.filter((s: Session) => s.is_bookmarked).length
sessions.map((s: Session) => <SessionCard key={s.id} session={s} />)
```

### Dark Mode Support

All UI elements must support both light and dark modes:

```typescript
// Text colors
text-gray-900 dark:text-gray-100   // Primary text
text-gray-500 dark:text-gray-400   // Secondary text

// Backgrounds
bg-white dark:bg-gray-800           // Cards
bg-gray-50 dark:bg-gray-900        // Page background

// Borders
border-gray-300 dark:border-gray-600 // Primary borders
```

### Performance Guidelines

**1. Use React Compiler**
- Automatic memoization enabled
- No need for manual `useMemo`/`useCallback` in most cases
- React DevTools shows "Memo ✨" badge for optimized components

**2. Cache-First Loading**
- All pages use localStorage persistence
- Page refresh shows cached data instantly
- Background refresh updates data without UI disruption

**3. Database Optimization**
- Use prepared statements (already implemented)
- Add indexes for frequently queried columns
- Avoid N+1 queries (use JOINs or batch queries)

---

## Testing

### Test Suite

**Total Tests**: 29 (passing)

**Test Categories**:
- Unit tests: Server routes (22 tests)
- Integration tests: Complete workflows (7 tests)

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
cd packages/ccd-server
bun run test

# Run tests in watch mode
bun run test --watch
```

### Test Coverage

- Health check endpoint
- Session CRUD operations
- Message creation and retrieval
- Statistics endpoints
- Search functionality
- Insights management

### Testing Plugin Installation

배포 전 플러그인 설치를 로컬에서 테스트:

```bash
cd packages/ccd-plugin

# 배포 시뮬레이션 + 검증
pnpm run test:plugin

# 또는 개별 실행
pnpm run test:install  # 배포 구조 복사
pnpm run test:verify   # 자동 검증
```

**테스트 검증 항목**:
- ✓ smart-install.cjs 실행 가능
- ✓ mcp-server.js Node.js 호환
- ✓ lib/hooks.js 실행 가능
- ✓ dashboard/dist 파일 존재
- ✓ hooks.json 경로 정확성
- ✓ 절대 경로 미포함
- ✓ Shebang 정확성

테스트 설치 위치: `~/.claude/plugins-test/ccd-plugin`

---

## Deployment

### Plugin Deployment (Marketplace)

1. Build plugin:
```bash
cd packages/ccd-plugin
pnpm run build
```

2. Publish to GitHub (already done):
```bash
git push origin main
```

3. Users install via marketplace:
```bash
/plugin marketplace add tolluset/claude-code-daily
/plugin install ccd@claude-code-daily
```

### Plugin Deployment (Local)

```bash
# Clone and build
git clone https://github.com/tolluset/claude-code-daily.git
cd claude-code-daily/packages/ccd-plugin
pnpm run build

# Install as local plugin
claude plugin add .
```

### OpenCode Plugin

**Development Location:** `packages/ccd-plugin/.opencode-plugin/`

#### Development Workflow

```bash
# 1. Edit source code
vim packages/ccd-plugin/.opencode-plugin/src/index.ts

# 2. Build and install globally (from .opencode-plugin directory)
cd packages/ccd-plugin/.opencode-plugin
bun run install-global

# 3. Restart OpenCode to apply changes
```

#### Manual Installation

```bash
# Global installation
mkdir -p ~/.config/opencode/plugins
cat > ~/.config/opencode/plugins/ccd.ts <<'EOF'
# (See README.md for full plugin code)
EOF

# Restart OpenCode
```

#### Build Commands

```bash
# Build only (creates dist/index.js)
bun run build

# Build and install globally
bun run install-global

# Development mode
bun run dev
```

**IMPORTANT:** After modifying the plugin code, you MUST run `bun run install-global` to update the global plugin at `~/.config/opencode/plugins/ccd.js`

### Database Migrations

Migrations run automatically on server startup. No manual intervention required.

---

## Next Steps

### Immediate Priorities

1. **Phase 1.2**: Remove duplicate API calls in Sessions.tsx
2. **Phase 1.3**: Apply `getSessionsWithInsights()` to other routes
3. **Phase 11**: Complete Productivity Insights (tags, heatmap)
4. **Phase 7**: Dashboard production build setup
5. **Phase 8**: Add E2E tests for hooks

### Feature Roadmap

- [ ] Data export/import functionality
- [ ] Multi-device sync with cloud storage
- [ ] AI-powered usage pattern analysis
- [ ] Peak coding hour calculation
- [ ] Session tagging system
- [ ] Cost budget alerts

---

## Related Documentation

- [README.md](../README.md) - User-facing documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - Detailed system architecture
- [CHANGELOG.md](CHANGELOG.md) - Development history
- [development-log/](development-log/) - Detailed technical logs

---

## Support

- **Issues**: https://github.com/tolluset/claude-code-daily/issues
- **Discussions**: https://github.com/tolluset/claude-code-daily/discussions
- **Email**: tolluset@github.com
