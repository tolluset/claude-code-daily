# Claude Code Daily (CCD) - Product Requirements Document

> Last Updated: 2026-01-19
> Author: tolluset
> Version: 1.0.0

## 1. Overview

### 1.1 Product Vision
Claude Code Daily (CCD) is a tool that automatically collects, stores, and visualizes Claude Code usage data to analyze developer AI usage patterns and improve productivity.

### 1.2 Problem Statement
- Claude Code usage records are scattered, making it difficult to identify usage patterns
- Token usage tracking is inconvenient
- Important sessions are hard to find later
- No way to track daily/weekly usage trends

### 1.3 Target Users
- Developers who use Claude Code daily
- Users who want to optimize their AI coding tool usage

---

## 2. Goals & Success Metrics

### 2.1 Goals
| Goal | Description |
|------|-------------|
| Auto data collection | Auto-save sessions/messages without user intervention |
| Easy accessibility | Support both CLI and web dashboard |
| Minimal resources | Save resources with auto server start/stop |
| Bookmark system | Quick search for important sessions |

### 2.2 Success Metrics
- 100% session data collection with no data loss
- Auto shutdown within 1 hour when server is idle
- Dashboard page load < 1 second

---

## 3. Functional Requirements

### 3.1 Core Features

#### FR-001: Auto Session Registration
- Automatically save session info when Claude Code session starts
- Saved data: session_id, transcript_path, cwd, project_name, git_branch

#### FR-002: Message Storage
- Real-time user prompt storage (UserPromptSubmit Hook)
- Assistant response and token info storage (Stop Hook + Transcript parsing)

#### FR-003: Bookmark
- Toggle current session bookmark with `/bookmark` command
- Add notes to bookmarks

#### FR-004: Statistics View
- Today's session count, message count, token usage
- Viewable from both CLI (`ccd report`) and dashboard

#### FR-005: Session List
- View today's session list
- Bookmarked sessions sorted first
- Display project name, time, message count

#### FR-006: Session Detail
- View full conversation history within session
- Display token info per message

### 3.2 Non-Functional Requirements

#### NFR-001: Auto Server Management
- Auto-start server if not running when session starts
- Auto shutdown after 1 hour idle
- Prevent duplicate instances via PID file

#### NFR-002: Non-blocking Execution
- All hooks exit 0 to not block Claude
- Background data storage

#### NFR-003: Local Data Storage
- Use SQLite (`~/.ccd/ccd.db`)
- No external server dependency

---

## 4. System Architecture

### 4.1 Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         User                                     │
└──────────────────┬──────────────────┬──────────────────┬────────┘
                   │                  │                  │
                   ▼                  ▼                  ▼
┌─────────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Claude Code       │  │   CLI           │  │   Dashboard     │
│   + CCD Plugin      │  │   (ccd)         │  │   (React)       │
└──────────┬──────────┘  └────────┬────────┘  └────────┬────────┘
           │                      │                    │
           │ Hooks                │ HTTP               │ HTTP
           ▼                      ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CCD Server (Bun + Hono)                     │
│                         Port 3847                                │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SQLite (~/.ccd/ccd.db)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  sessions   │  │  messages   │  │ daily_stats │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Model

#### sessions
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Claude Code session_id |
| transcript_path | TEXT | Transcript file path |
| cwd | TEXT | Working directory |
| project_name | TEXT | Project name |
| git_branch | TEXT | Git branch name |
| started_at | DATETIME | Start time |
| ended_at | DATETIME | End time |
| is_bookmarked | BOOLEAN | Bookmark status |
| bookmark_note | TEXT | Bookmark note |

#### messages
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER (PK) | Auto increment |
| session_id | TEXT (FK) | Session ID |
| uuid | TEXT (UNIQUE) | Message UUID |
| type | TEXT | 'user' / 'assistant' |
| content | TEXT | Message content |
| model | TEXT | Model used |
| input_tokens | INTEGER | Input token count |
| output_tokens | INTEGER | Output token count |
| timestamp | DATETIME | Creation time |

### 4.3 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/health | Server status check |
| POST | /api/v1/sessions | Register session |
| GET | /api/v1/sessions | Get session list |
| GET | /api/v1/sessions/:id | Get session detail |
| POST | /api/v1/sessions/:id/bookmark | Toggle bookmark |
| POST | /api/v1/messages | Save message |
| GET | /api/v1/sessions/:id/messages | Get session messages |
| GET | /api/v1/stats/today | Today's stats |
| POST | /api/v1/sync/transcript | Transcript sync |

---

## 5. User Stories

### US-001: Auto Session Tracking
> As a developer, I want my Claude Code sessions to be automatically tracked so that I don't have to manually log my usage.

**Acceptance Criteria:**
- [ ] Session auto-created in DB on session start
- [ ] User prompts saved in real-time
- [ ] All messages saved on session end

### US-002: Today's Activity Summary
> As a developer, I want to see a summary of today's Claude Code usage so that I can track my productivity.

**Acceptance Criteria:**
- [ ] View today's session count, message count, token usage with `ccd report`
- [ ] Same info available on dashboard main page

### US-003: Important Session Bookmark
> As a developer, I want to bookmark important sessions so that I can quickly find them later.

**Acceptance Criteria:**
- [ ] Bookmark current session with `/bookmark` command
- [ ] Add notes to bookmark
- [ ] Bookmarked sessions shown first in session list

---

## 6. Future Considerations

### Phase 2 (Planned)
- [ ] Statistics charts (daily/weekly trends)
- [ ] Project-based filtering
- [ ] Date range query

### Phase 3 (Backlog)
- [ ] Data export/import
- [ ] Multi-device sync
- [ ] AI insights (usage pattern analysis)

---

## 7. Technical Stack

| Component | Technology |
|-----------|------------|
| Monorepo | pnpm workspaces + Turborepo |
| Server Runtime | Bun |
| Server Framework | Hono |
| Database | SQLite (Bun built-in) |
| Plugin | Bash scripts + Claude Code Hooks |
| CLI | TypeScript + Commander.js |
| Dashboard | React + Vite + TailwindCSS |
| State Management | TanStack Query |

---

## Appendix

### A. Glossary
- **Session**: A single conversation session in Claude Code
- **Transcript**: Session record file generated by Claude Code
- **Hook**: Script that responds to Claude Code events

### B. References
- [Claude Code Hooks Documentation](https://docs.anthropic.com/claude-code/hooks)
- [Bun SQLite](https://bun.sh/docs/api/sqlite)
- [Hono Framework](https://hono.dev/)
