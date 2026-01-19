# CCD Changelog

> All notable changes to Claude Code Daily (CCD) documented by date.

---

## 2026-01-20

### New Feature
- **Data Export Functionality**
  - Added JSON export API: `GET /api/v1/export`
  - Export format: session-based structure with nested messages and insights
  - Dashboard "Export Data" button in sidebar
  - Quick backup guide in README: `cp ~/.ccd/ccd.db ~/.ccd/ccd.db.backup.YYYYMMDD`
  - Data access options: SQLite DB, JSON Export, Dashboard UI
  - See: [README.md - Data Backup & Export](../README.md#data-backup--export)

### New Feature
- **AI Insight Engine Phase 1**
- **AI Insight Engine Phase 1**
  - Implemented MVP for AI-powered session analysis and reports
  - Added `ai_reports` table for storing AI-generated reports
  - Created LLM Provider interface with Claude API integration
  - Session analysis API: `POST /api/v1/ai-insights/analyze/:sessionId`
  - Manual report generation API: `POST /api/v1/ai-insights/reports/generate`
  - Integrated AI Reports into `/reports` page as a tab (Daily Stats / AI Reports)
  - Session analysis extracts: summary, task type, difficulty, keywords, learnings, patterns, efficiency score
  - Efficiency scoring based on: turn count, retry count, same file edits
  - Markdown report rendering with insights, statistics, and suggestions
  - See: [2026-01-20-ai-insight-engine-phase1-implementation.md](development-log/2026-01-20-ai-insight-engine-phase1-implementation.md)

### Performance Optimization
- **Phase 1.1**: N+1 Query Removal
  - Created `getSessionsWithInsights()` with LEFT JOIN to eliminate N+1 query problem in daily-report endpoint
  - Query count: N+1 → 1 (up to 99% reduction)
  - Response time: ~100ms → ~10ms (10x faster)
  - Improved type consistency by importing SessionInsight from shared types
  - See: [2026-01-20-refactoring-phase1-n-plus-one-query-removal.md](development-log/2026-01-20-refactoring-phase1-n-plus-one-query-removal.md)

### Platform Support
- **OpenCode Plugin Integration v0.2.0**
  - Unified two plugin versions with complete feature set
  - Combined server auto-start with message tracking
  - Full metadata support: project_name, git_branch, source: "opencode"
  - Enhanced logging to `~/.ccd/opencode-plugin.log`
  - Session summary updates from first user message
  - Added `install-global` script for easy deployment
  - See: [2026-01-20-opencode-plugin-integration.md](development-log/2026-01-20-opencode-plugin-integration.md)

- **OpenCode Plugin Implementation**
  - Created TypeScript plugin at `~/.config/opencode/plugins/ccd.ts`
  - Event-driven session tracking with `session.created` event
  - Source field detection: `opencode://` virtual paths for session IDs
  - Auto-server start with `bun x ccd-server`
  - Git branch detection using Bun.spawn()
  - See: [2026-01-20-opencode-plugin-implementation.md](development-log/2026-01-20-opencode-plugin-implementation.md)

- **OpenCode Session Detection Fix**
  - Modified `session-start.sh` to detect source from transcript path
  - Added `SOURCE` variable with grep-based detection (`claude` vs `opencode`)
  - Sessions now tagged with correct source field in database
  - See: [2026-01-20-opencode-session-detection-fix.md](development-log/2026-01-20-opencode-session-detection-fix.md)

### Deployment & Automation
- **Plugin Deployment Automation**
  - Bun auto-install via `smart-install.js` on SessionStart
  - MCP server auto-registration via `.mcp.json` configuration
  - Path independence using `${CLAUDE_PLUGIN_ROOT}` environment variable
  - Build automation with `copy-artifacts.sh` script
  - User experience: 5+ steps → 1 command installation
  - See: [2026-01-20-plugin-deployment-automation.md](development-log/2026-01-20-plugin-deployment-automation.md)

### System Improvements
- **Periodic Session Cleanup**
  - Dual-mechanism cleanup: periodic (1hr) + API request-based
  - 10-minute protection window for new sessions
  - Graceful shutdown with SIGINT/SIGTERM handlers
  - Prevents session deletion before first message arrives
  - See: [2026-01-20-periodic-session-cleanup.md](development-log/2026-01-20-periodic-session-cleanup.md)

### Documentation
- README.md transformation to production-ready documentation
- Added OpenCode plugin installation guide
- Enhanced tech stack documentation with React 19 and React Compiler
- Added development log references
- Updated STATUS.md with 2026-01-20 changes
- Updated TASKS.md with new Phase 1.1 tasks
- See: [2026-01-20-readme-production-cleanup.md](development-log/2026-01-20-readme-production-cleanup.md)

### Analysis & Planning
- Claude-Mem plugin deployment strategy analysis
- Initial standalone binary distribution planning (superseded by bunx approach)
- See: [2026-01-20-claude-mem-deployment-analysis.md](development-log/2026-01-20-claude-mem-deployment-analysis.md)
- See: [2026-01-20-standalone-binary-distribution.md](development-log/2026-01-20-standalone-binary-distribution.md)

---

## 2026-01-19

### Performance & UX
- **Phase 14**: Cache-First Loading Pattern
  - Applied cache-first pattern to all dashboard pages
  - Page refresh shows cached data instantly (no loading indicator)
  - Background refresh updates data without UI disruption
  - Fixed TypeScript compilation errors across all pages
  - Established loading state best practices
  - See: [2026-01-19-caching-and-loading-patterns.md](development-log/2026-01-19-caching-and-loading-patterns.md)

- **Phase 13**: Layout & Navigation Refactoring
  - Changed from top header to left sidebar navigation (256px width, collapsible to 64px)
  - Split Reports into Daily Reports List (`/reports`) + Analytics Dashboard (`/statistics`)
  - Enhanced Daily Report page to insights/diary format with narrative timeline
  - Added collapse/expand functionality with keyboard shortcuts (Ctrl/Cmd + B, Escape)
  - Implemented active menu persistence for sub-pages
  - Fixed timezone handling (local timezone for all date operations)
  - See: [LAYOUT_NAVIGATION_CHANGES_2026-01-19.md](development-log/LAYOUT_NAVIGATION_CHANGES_2026-01-19.md)

- **Phase 12**: React Compiler Integration
  - Installed babel-plugin-react-compiler@latest
  - Configured Vite for React Compiler
  - Automatic memoization for components and values
  - React DevTools Memo ✨ badge verification

### Bug Fixes
- **Session Delete Navigation Fix**
  - Fixed event propagation in Sessions list (delete button now prevents Link navigation)
  - Fixed 404 error after deletion in SessionDetail (added query cancellation)
  - Updated useSessionActions.handleDelete to accept event parameter
  - See: [2026-01-19-session-delete-navigation-fix.md](development-log/2026-01-19-session-delete-navigation-fix.md)

- **SessionDetail Page Fixes**
  - Fixed loading states for session, messages, and insights
  - Improved error handling and edge cases

- **Cache Removal & Simplification**
  - Removed localStorage cache (replaced with TanStack Query persistence)
  - Simplified cache management logic
  - See: [2026-01-19-cache-removal.md](development-log/2026-01-19-cache-removal.md)

### Documentation
- Documentation restructuring
  - Reorganized docs/ folder structure
  - Created comprehensive task tracking system
  - Updated all documentation with latest changes
  - See: [2026-01-19-documentation-cleanup.md](development-log/2026-01-19-documentation-cleanup.md)

- **Dark Mode Implementation**
  - ThemeProvider context with localStorage persistence
  - Code block synchronization with theme switching
  - All UI elements have dark mode variants
  - See: [DARK_MODE_IMPLEMENTATION_2026-01-19.md](development-log/DARK_MODE_IMPLEMENTATION_2026-01-19.md)

### Features
- **Phase 11**: Productivity Insights
  - Cost tracking with model pricing table (Migration 006)
  - Cost Dashboard cards showing input/output costs
  - AI Session Insights via MCP tools
  - SessionInsights UI component with edit/delete
  - Coding Streak Tracker with StreakBadge component
  - /extract-insights slash command
  - Auto-extract on Stop hook (optional, config-based)

- **Phase 10**: Full-Text Search
  - FTS5 database migration (003_add_fts_search)
  - searchSessions() with BM25 ranking algorithm
  - GET /api/v1/search endpoint with filters
  - Search page UI with result highlighting
  - DiffView component for code diff visualization
  - search_sessions MCP tool
  - SearchResult and SearchOptions type definitions

- **Phase 5**: Enhanced Statistics
  - Daily stats API with date range support
  - ProjectPieChart component with 10-color palette
  - Responsive 3-column chart layout (TokenTrend, SessionBar, ProjectPie)
  - Project distribution visualization with percentage labels

- **Phase 6**: Enhanced Filtering
  - Project filter to Sessions page (dropdown select)
  - Date range to Sessions page (DateRangePicker component)
  - Project filter to Reports page (filter charts by project)

### Testing
- Added 22 unit tests for server routes
- Added 7 integration tests for complete workflows
- Total: 29 tests passing
- Fixed test infrastructure (separate test database, UUID generation, project filtering)

---

## 2026-01-18 (Earlier)

### Initial Implementation
- **Phase 1**: Infrastructure
  - pnpm monorepo setup with Turborepo
  - Shared types definition
  - SQLite schema creation (sessions, messages, daily_stats)
  - Bun + Hono server setup
  - Server auto start/stop logic (PID file + 1 hour timeout)

- **Phase 2**: Plugin Development
  - Plugin manifest creation (.claude-plugin/plugin.json)
  - SessionStart hook implementation (server start + session registration)
  - UserPromptSubmit hook implementation (real-time prompt capture)
  - Stop hook implementation (transcript parsing and sync)
  - /bookmark command implementation

- **Phase 3**: MCP Development
  - MCP server package setup (@modelcontextprotocol/sdk)
  - open_dashboard tool implementation
  - get_stats tool implementation
  - Project-level and plugin bundle MCP configuration

- **Phase 4**: Dashboard MVP
  - Vite + React + shadcn setup
  - API client with TanStack Query
  - Main dashboard page (stats cards + recent sessions)
  - Session list page with filters
  - Session detail page with conversation timeline
  - Delete session functionality (cascade delete messages)

- **Phase 7**: Infrastructure Improvements
  - Schema migration system
  - Scheduled empty session cleanup

- **Phase 8**: Quality & Testing
  - Unit tests for server routes (22 tests)
  - Integration tests for API (7 tests)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.1 | 2026-01-20 | OpenCode support, N+1 query removal, deployment automation |
| 0.1.0 | 2026-01-19 | Cache-first loading, layout refactoring, performance optimization |
| 0.0.1 | 2026-01-18 | Initial MVP release |

---

## Upcoming

See [DEVELOPMENT.md](DEVELOPMENT.md#next-steps) for planned features and roadmap.
