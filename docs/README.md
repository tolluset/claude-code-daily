# Documentation Index

This document provides an overview of CCD documentation structure and helps you find information quickly.

---

## Quick Navigation

### For Users
- **[README.md](../README.md)** - Installation, usage, and features
- **[CHANGELOG.md](CHANGELOG.md)** - Development history and recent changes

### For Developers
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development setup, API reference, guidelines
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System design and database schema

### For Troubleshooting
- **[development-log/](development-log/)** - Detailed technical logs and implementation details
- **[development-log/archive/](development-log/archive/)** - Historical logs (before 2026-01-20)

---

## Documentation Structure

```
ccd/
├── README.md                    # User-facing: Installation, usage, features
├── CLAUDE.md                   # AI assistant: Development tasks and workflow
└── docs/
    ├── DEVELOPMENT.md            # Developer guide: Setup, API, guidelines
    ├── ARCHITECTURE.md          # System design: Schema, data flow, architecture
    ├── CHANGELOG.md             # Changelog: Changes organized by date
    ├── development-log/         # Technical logs: Detailed implementation notes
    │   ├── README.md           # Index: Find specific technical log
    │   ├── *.md               # Recent technical logs (2026-01-20, 2026-01-19)
    │   └── archive/           # Historical logs (before 2026-01-20)
    └── * (legacy files)         # Deprecate/merge into main docs
```

---

## Document Descriptions

### README.md
**Purpose**: User-facing documentation
**Audience**: New users, end users
**Contents**:
- Installation instructions (Marketplace, source)
- Feature overview (Sessions, Analytics, Search, Insights)
- Usage guide (Dashboard, slash commands, MCP tools)
- API reference summary
- Tech stack overview
- Troubleshooting

**When to use**: First-time setup, learning features, daily usage

---

### DEVELOPMENT.md
**Purpose**: Comprehensive developer guide
**Audience**: Contributors, maintainers
**Contents**:
- Quick start for developers
- Project status and progress
- Development setup (requirements, scripts, structure)
- Architecture overview
- Complete API reference
- Development guidelines (code style, React Query, TypeScript, dark mode)
- Testing guide
- Deployment instructions
- Next steps and roadmap

**When to use**: Setting up dev environment, understanding codebase, contributing, debugging

---

### ARCHITECTURE.md
**Purpose**: Detailed system architecture
**Audience**: Developers, architects
**Contents**:
- System overview (component diagram)
- Tech stack (versions, choices)
- Project structure (directory tree)
- Database schema (tables, indexes, migrations)
- Data flow (session lifecycle, message tracking)
- Key design decisions
- OpenCode plugin architecture
- MCP tool architecture

**When to use**: Understanding system design, adding features, modifying database, debugging data flow

---

### CHANGELOG.md
**Purpose**: Consolidated development history
**Audience**: All stakeholders
**Contents**:
- Changes organized by date (YYYY-MM-DD)
- Milestone summaries (Phase 1, 2, 3, etc.)
- Version history (0.1.0, 0.1.1, etc.)
- Links to detailed logs
- Upcoming features

**When to use**: Tracking changes, understanding what's new, release notes

---

### development-log/
**Purpose**: Detailed technical implementation logs
**Audience**: Developers (for specific technical details)
**Contents**:
- Implementation logs for specific features
- Bug fix documentation
- Performance optimization details
- Design decision records
- Debugging notes

**Recent Logs (2026-01-20)**:
- N+1 query removal
- OpenCode plugin implementation
- Plugin deployment automation
- Periodic session cleanup

**Recent Logs (2026-01-19)**:
- Cache-first loading pattern
- Session delete navigation fix
- Full-text search feature

**When to use**:
- Understanding specific implementation details
- Debugging technical issues
- Learning from past solutions
- Reviewing design decisions

**Note**: For quick reference, use CHANGELOG.md. For deep technical details, use development-log/.

---

## Legacy Documentation

The following files are being consolidated into main documents:

### STATUS.md
**Status**: Merged into DEVELOPMENT.md
**Content**: Development status, file-by-file status, next steps
**Where to find**: [DEVELOPMENT.md#project-status](DEVELOPMENT.md#project-status)

### TASKS.md
**Status**: Merged into DEVELOPMENT.md
**Content**: Task list organized by phase, progress summary
**Where to find**: [DEVELOPMENT.md#project-status](DEVELOPMENT.md#project-status)

### IMPLEMENTATION.md
**Status**: Merged into DEVELOPMENT.md
**Content**: API endpoints, hook implementation, MCP tools
**Where to find**:
- API reference → [DEVELOPMENT.md#api-reference](DEVELOPMENT.md#api-reference)
- Hooks → [DEVELOPMENT.md#architecture](DEVELOPMENT.md#architecture)
- MCP tools → [DEVELOPMENT.md#api-reference](DEVELOPMENT.md#api-reference)

### DEVELOPMENT_GUIDELINES.md
**Status**: Merged into DEVELOPMENT.md
**Content**: React Query cache invalidation, testing guidelines, TypeScript best practices, dark mode support
**Where to find**: [DEVELOPMENT.md#development-guidelines](DEVELOPMENT.md#development-guidelines)

---

## Maintenance

### When to Update Documentation

1. **After Feature Completion**
   - Update [CHANGELOG.md](CHANGELOG.md) with changes
   - Update [DEVELOPMENT.md](DEVELOPMENT.md) status if needed
   - Add detailed log to [development-log/](development-log/) if technical details are important
   - Update [README.md](../README.md) for user-facing changes

2. **After Bug Fix**
   - Update [CHANGELOG.md](CHANGELOG.md) with fix details
   - Add detailed log to [development-log/](development-log/) for future reference

3. **After Major Refactoring**
   - Update [ARCHITECTURE.md](ARCHITECTURE.md) if system design changed
   - Update [DEVELOPMENT.md](DEVELOPMENT.md) guidelines if patterns changed

4. **Periodic Cleanup** (Quarterly)
   - Move old development logs (> 6 months) to [archive/](development-log/archive/)
   - Review and update deprecated references
   - Update version history in [CHANGELOG.md](CHANGELOG.md)

### Documentation Principles

1. **Single Source of Truth**: Each piece of information should live in one place
2. **Clear Hierarchy**: Overview → Detailed → Technical
3. **Consistent Updates**: Keep all documents in sync
4. **Action-Oriented**: Focus on what users need to do
5. **Minimal Maintenance**: Reduce redundancy and duplication

---

## Common Questions

### Q: Where do I start if I'm a new user?
**A**: Start with [README.md](../README.md) for installation and usage guide.

### Q: Where do I start if I want to contribute?
**A**: Start with [DEVELOPMENT.md](DEVELOPMENT.md#quick-start) for development setup.

### Q: How do I understand the system architecture?
**A**: Read [ARCHITECTURE.md](ARCHITECTURE.md) for complete system design.

### Q: What changed recently?
**A**: Check [CHANGELOG.md](CHANGELOG.md) for recent changes and milestones.

### Q: Where can I find technical implementation details?
**A**: Browse [development-log/](development-log/) and use the [README.md](development-log/README.md) index.

### Q: Why are there so many docs in development-log/?
**A**: They provide detailed technical records for debugging and learning. Use CHANGELOG.md for quick reference.

### Q: Can I delete old development logs?
**A**: Move logs older than 6 months to [archive/](development-log/archive/). Don't delete them—they're valuable for understanding historical decisions.

---

## Feedback

If you find documentation issues or have suggestions:
- Open an issue: https://github.com/tolluset/claude-code-daily/issues
- Submit a PR with improvements

---

**Last Updated**: 2026-01-20
