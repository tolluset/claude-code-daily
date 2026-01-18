---
description: Toggle bookmark for current session with optional note
argument-hint: [note]
allowed-tools: Bash(curl:*)
---

Bookmark the current Claude Code session by calling the CCD server API.

Execute this command to toggle the bookmark status:

!`curl -s -X POST "http://localhost:3847/api/v1/sessions/current/bookmark" -H "Content-Type: application/json" -d '{"note": "$ARGUMENTS"}' 2>/dev/null || echo '{"error": "Server not running"}'`

Based on the response:
- If `is_bookmarked` is true: Report "Session bookmarked successfully"
- If `is_bookmarked` is false: Report "Bookmark removed"
- If error: Report "CCD server is not running. Start it with: cd packages/ccd-server && bun run src/index.ts"
