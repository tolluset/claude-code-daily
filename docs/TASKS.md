# Claude Code Daily (CCD) - Task Management

> Last Updated: 2026-01-19
> Author: tolluset

---

## Overview

This document tracks all development tasks for the CCD project, organized by phase and priority.

---

## Task Legend

| Status | Description |
|--------|-------------|
| ✅ | Completed |
| 🚧 | In Progress |
| ⬜ | Todo |
| 🔄 | Blocked |
| ⚠️ | Deprecated |

| Priority | Description |
|----------|-------------|
| P0 | Critical / Must-have |
| P1 | High priority |
| P2 | Medium priority |
| P3 | Low priority |

---

## Phase 1: Infrastructure ✅

**Status**: Complete

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| P1-001 | pnpm monorepo setup | P0 | ✅ | pnpm-workspace.yaml + turbo.json |
| P1-002 | Turborepo configuration | P0 | ✅ | turbo.json + package.json scripts |
| P1-003 | Shared types definition | P0 | ✅ | shared/types package |
| P1-004 | SQLite schema creation | P0 | ✅ | sessions, messages, daily_stats tables |
| P1-005 | Bun + Hono server setup | P0 | ✅ | packages/ccd-server |
| P1-006 | Server auto start/stop logic | P0 | ✅ | PID file + 1 hour timeout |

---

## Phase 2: Plugin Development ✅

**Status**: Complete

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| P2-001 | Plugin manifest creation | P0 | ✅ | .claude-plugin/plugin.json |
| P2-002 | SessionStart hook implementation | P0 | ✅ | Server check/start + session registration |
| P2-003 | UserPromptSubmit hook implementation | P0 | ✅ | Save user prompt in real-time |
| P2-004 | Stop hook implementation | P0 | ✅ | Transcript parsing and bulk save |
| P2-005 | /bookmark command implementation | P1 | ✅ | Toggle current session bookmark |
| P2-006 | hooks.json configuration | P0 | ✅ | Hook event mappings |

---

## Phase 3: MCP Development ✅

**Status**: Complete

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| P3-001 | MCP server package setup | P0 | ✅ | packages/ccd-mcp |
| P3-002 | open_dashboard tool implementation | P1 | ✅ | Open dashboard in browser |
| P3-003 | get_stats tool implementation | P1 | ✅ | Session statistics by period |
| P3-004 | Project-level MCP configuration | P0 | ✅ | .mcp.json at root |
| P3-005 | Plugin bundle MCP configuration | P1 | ✅ | packages/ccd-plugin/.mcp.json |
| P3-006 | Plugin bundle MCP server | P1 | ✅ | packages/ccd-plugin/mcp/server.ts |

---

## Phase 4: Dashboard (MVP) ✅

**Status**: Complete

| ID | Task | Priority | Status | Notes |
|----|------|----------|--------|-------|
| P4-001 | Vite + React + shadcn setup | P0 | ✅ | packages/ccd-dashboard |
| P4-002 | API client (TanStack Query) | P0 | ✅ | src/lib/api.ts |
| P4-003 | Main dashboard page | P0 | ✅ | Stats cards + recent sessions |
| P4-004 | Session list page | P0 | ✅ | Full list + bookmark filter |
| P4-005 | Session detail page | P0 | ✅ | Conversation timeline |
| P4-006 | Delete session functionality | P1 | ✅ | Cascade delete messages |

---

## Phase 5: Enhanced Statistics 🚧

**Status**: In Progress

### API Tasks

| ID | Task | Priority | Status | Dependencies | Notes |
|----|------|----------|--------|--------------|-------|
| P5-001 | Add GET /api/v1/stats/daily endpoint | P0 | ⬜ | None | Date range query support |
| P5-002 | Add date range params to sessions API | P0 | ⬜ | P5-001 | ?from=&to= parameters |
| P5-003 | Add project filter to sessions API | P1 | ⬜ | P5-001 | ?project= parameter |
| P5-004 | Add project filter to stats API | P1 | ⬜ | P5-001 | ?project= parameter |

### Chart Components

| ID | Task | Priority | Status | Dependencies | Notes |
|----|------|----------|--------|--------------|-------|
| P5-005 | Install recharts library | P0 | ⬜ | None | pnpm add recharts -F ccd-dashboard |
| P5-006 | Create TokenTrendChart component | P0 | ⬜ | P5-005 | Line chart for daily tokens |
| P5-007 | Create SessionBarChart component | P0 | ⬜ | P5-005 | Bar chart for sessions per day |
| P5-008 | Create ProjectPieChart component | P1 | ⬜ | P5-005 | Distribution by project |

### Reports Page

| ID | Task | Priority | Status | Dependencies | Notes |
|----|------|----------|--------|--------------|-------|
| P5-009 | Create DateRangePicker component | P0 | ⬜ | P5-005 | Custom date range selection |
| P5-010 | Create Reports page | P0 | ⬜ | P5-006, P5-007, P5-008, P5-009 | /reports with charts |

### Implementation Details

**API Endpoint:**
```typescript
GET /api/v1/stats/daily?from=2026-01-01&to=2026-01-19
GET /api/v1/stats/daily?days=7
```

**Response:**
```json
{
  "data": [
    {
      "date": "2026-01-19",
      "session_count": 5,
      "message_count": 127,
      "total_input_tokens": 45230,
      "total_output_tokens": 89102
    }
  ]
}
```

**Recharts Usage:**
```tsx
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

<LineChart data={dailyStats}>
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="total_output_tokens" stroke="#8884d8" />
</LineChart>
```

---

## Phase 6: Enhanced Filtering ⬜

**Status**: Planned

| ID | Task | Priority | Status | Dependencies | Notes |
|----|------|----------|--------|--------------|-------|
| P6-001 | Add project filter to Sessions page | P1 | ⬜ | P5-003 | Dropdown select |
| P6-002 | Add date range to Sessions page | P1 | ⬜ | P5-002, P5-009 | Update query params |
| P6-003 | Add project filter to Reports page | P2 | ⬜ | P5-004 | Filter charts by project |

---

## Phase 7: Infrastructure Improvements ⬜

**Status**: Planned

| ID | Task | Priority | Status | Dependencies | Notes |
|----|------|----------|--------|--------------|-------|
| P7-001 | Dashboard production build setup | P2 | ⬜ | None | Build script + deployment config |
| P7-002 | Schema migration system | P1 | ⬜ | None | Handle DB schema changes |
| P7-003 | Add *bun-build to .gitignore | P3 | ⬜ | None | Cleanup |

---

## Phase 8: Quality & Testing ⬜

**Status**: Planned

| ID | Task | Priority | Status | Dependencies | Notes |
|----|------|----------|--------|--------------|-------|
| P8-001 | Add unit tests for server routes | P1 | ⬜ | None | Jest/Bun test framework |
| P8-002 | Add E2E tests for hooks | P1 | ⬜ | None | Hook automation testing |
| P8-003 | Add integration tests for API | P1 | ⬜ | None | API endpoint testing |

---

## Phase 9: Advanced Features ⬜

**Status**: Backlog

| ID | Task | Priority | Status | Dependencies | Notes |
|----|------|----------|--------|--------------|-------|
| P9-001 | Data export/import functionality | P2 | ⬜ | None | JSON/CSV export |
| P9-002 | Multi-device sync | P2 | ⬜ | P7-001 | Cloud storage integration |
| P9-003 | AI insights (usage pattern analysis) | P3 | ⬜ | P8-001 | Statistical analysis |
| P9-004 | Peak coding hour calculation | P3 | ⬜ | P8-001 | CLI enhancement |
| P9-005 | get_sessions MCP tool | P2 | ⬜ | P6-001 | List sessions with filters |
| P9-006 | search_sessions MCP tool | P2 | ⬜ | P8-001 | Search by content |

---

## Cleanup Tasks ⬜

**Status**: Immediate

| ID | Task | Priority | Status | Dependencies | Notes |
|----|------|----------|--------|--------------|-------|
| C-001 | Commit pending changes (v0.1.0) | P0 | ⬜ | None | Prepare release |
| C-002 | Update README with latest features | P1 | ⬜ | C-001 | Documentation sync |

---

## Progress Summary

### By Phase

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Infrastructure | ✅ Complete | 6/6 (100%) |
| Phase 2: Plugin Development | ✅ Complete | 6/6 (100%) |
| Phase 3: MCP Development | ✅ Complete | 6/6 (100%) |
| Phase 4: Dashboard (MVP) | ✅ Complete | 6/6 (100%) |
| Phase 5: Enhanced Statistics | 🚧 In Progress | 0/10 (0%) |
| Phase 6: Enhanced Filtering | ⬜ Planned | 0/3 (0%) |
| Phase 7: Infrastructure Improvements | ⬜ Planned | 0/3 (0%) |
| Phase 8: Quality & Testing | ⬜ Planned | 0/3 (0%) |
| Phase 9: Advanced Features | ⬜ Backlog | 0/6 (0%) |

### By Priority

| Priority | Total | Completed | In Progress | Todo |
|----------|-------|-----------|-------------|------|
| P0 (Critical) | 18 | 12 | 0 | 6 |
| P1 (High) | 13 | 9 | 0 | 4 |
| P2 (Medium) | 8 | 0 | 0 | 8 |
| P3 (Low) | 4 | 0 | 0 | 4 |
| **Total** | **43** | **21** | **0** | **22** |

---

## Dependency Graph

```
Phase 5 (Enhanced Statistics)
├─ P5-001 (stats/daily API) → P5-002, P5-003, P5-004
├─ P5-005 (install recharts) → P5-006, P5-007, P5-008, P5-009
└─ P5-010 (Reports page) → P5-006, P5-007, P5-008, P5-009

Phase 6 (Enhanced Filtering)
├─ P6-001 (Sessions project filter) → P5-003
├─ P6-002 (Sessions date range) → P5-002, P5-009
└─ P6-003 (Reports project filter) → P5-004

Phase 7 (Infrastructure)
└─ Independent tasks

Phase 8 (Quality & Testing)
└─ Independent tasks

Phase 9 (Advanced Features)
├─ P9-002 (multi-device sync) → P7-001
├─ P9-003 (AI insights) → P8-001
├─ P9-004 (peak coding hour) → P8-001
├─ P9-005 (get_sessions MCP) → P6-001
└─ P9-006 (search_sessions MCP) → P8-001

Cleanup
├─ C-002 (update README) → C-001
```

---

## Next Immediate Actions

1. **[C-001]** Commit pending changes (v0.1.0)
2. **[P5-001]** Add GET /api/v1/stats/daily endpoint
3. **[P5-005]** Install recharts library
4. **[P5-006]** Create TokenTrendChart component

---

## Milestones

| Milestone | Target | Status |
|-----------|--------|--------|
| MVP Release (v0.1.0) | 2026-01-19 | 🚧 Ready |
| Phase 5 (Enhanced Statistics) | TBD | 🚧 In Progress |
| Phase 6 (Enhanced Filtering) | TBD | ⬜ Planned |
| Production Ready | TBD | ⬜ Planned |
