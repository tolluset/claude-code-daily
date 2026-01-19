---
description: Generate a daily report for today or a specific date
argument-hint: [YYYY-MM-DD]
allowed-tools: Bash(curl:*)
---

Generate a comprehensive daily report summarizing your Claude Code sessions, insights, and statistics.

Usage:
- `/daily-report` - Generate report for today
- `/daily-report 2026-01-18` - Generate report for specific date

!`DATE="${ARGUMENTS:-$(date +%Y-%m-%d)}"; curl -s "http://localhost:3847/api/v1/daily-report?date=$DATE" 2>/dev/null || echo '{"error": "Server not running", "date": "'$DATE'"}'`

Based on the response:
- If successful: Parse and display the report summary in a user-friendly format
- Highlight: Total sessions, messages, tokens, cost, and coding streak
- Show session list with project names and insights
- Provide link to dashboard for full visualization: http://localhost:3848/daily-report?date={DATE}
- If error: Report "CCD server is not running. It starts automatically with your next session."
