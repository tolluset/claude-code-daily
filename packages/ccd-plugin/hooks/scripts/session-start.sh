#!/bin/bash
# CCD Session Start Hook
# Checks/starts the server and registers the session when a session starts.

CCD_SERVER_URL="http://localhost:3847"
CCD_DATA_DIR="$HOME/.ccd"

# Read hook context from stdin
HOOK_CONTEXT=$(cat)

# Extract session_id and transcript_path
SESSION_ID=$(echo "$HOOK_CONTEXT" | jq -r '.session_id // empty')
TRANSCRIPT_PATH=$(echo "$HOOK_CONTEXT" | jq -r '.transcript_path // empty')
CWD=$(echo "$HOOK_CONTEXT" | jq -r '.cwd // empty')

# Validate required values
if [ -z "$SESSION_ID" ] || [ -z "$TRANSCRIPT_PATH" ] || [ -z "$CWD" ]; then
    exit 0
fi

# Extract project name (last directory of cwd)
PROJECT_NAME=$(basename "$CWD")

# Extract git branch (if available)
GIT_BRANCH=""
if [ -d "$CWD/.git" ]; then
    GIT_BRANCH=$(cd "$CWD" && git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
fi

# 1. Check server status
SERVER_RUNNING=false
if curl -s --connect-timeout 2 "$CCD_SERVER_URL/api/v1/health" > /dev/null 2>&1; then
    SERVER_RUNNING=true
fi

# 2. Start server with bun if not running
if [ "$SERVER_RUNNING" = false ]; then
    mkdir -p "$CCD_DATA_DIR"
    nohup bun run /Users/bh/workspaces/ccd/packages/ccd-server/src/index.ts > "$CCD_DATA_DIR/server.log" 2>&1 &
    sleep 2
fi

# 3. Register session
curl -s -X POST "$CCD_SERVER_URL/api/v1/sessions" \
    -H "Content-Type: application/json" \
    -d "{
        \"session_id\": \"$SESSION_ID\",
        \"transcript_path\": \"$TRANSCRIPT_PATH\",
        \"cwd\": \"$CWD\",
        \"project_name\": \"$PROJECT_NAME\",
        \"git_branch\": \"$GIT_BRANCH\"
    }" > /dev/null 2>&1

# 4. Clean empty sessions (async, non-blocking)
curl -s -X POST "$CCD_SERVER_URL/api/v1/sessions/clean-empty" > /dev/null 2>&1 &

exit 0
