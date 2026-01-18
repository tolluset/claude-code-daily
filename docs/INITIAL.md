# Claude Code Daily (CCD) - Initial Planning

Dashboard for tracking daily Claude Code usage data


## 1. Claude Code Daily Plugin

- Auto-register sessions when plugin is installed
- Registration starts on session start, Claude responses and user prompts are saved
    - Review storage logic
    - SQLite for DB since it's local only
    - Server starts behind session start, when to stop? Other plugins have bugs with multiple instances or not shutting down. For example: on session start, curl to local, if exists send data, if not start server. Timeout setting to auto-shutdown after no requests (1 hour?)
- /bookmark to bookmark current session

## 2. Claude Code Daily Dashboard

- Web-based React + shadcn
- Opens when typing `ccd`

## 3. Claude Code Daily CLI

Run with `ccd` (claude code daily)

- ccd report
    - Display today's statistics and insights
- ccd list
    - Today's session list, unlike /resume shows description under title
    - Bookmarked sessions shown at top
