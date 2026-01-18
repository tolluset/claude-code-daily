#!/bin/bash
# CCD Stop Hook
# Syncs the transcript when Claude's response is complete.

CCD_SERVER_URL="http://localhost:3847"

# Read hook context from stdin
HOOK_CONTEXT=$(cat)

# Extract required values
SESSION_ID=$(echo "$HOOK_CONTEXT" | jq -r '.session_id // empty')
TRANSCRIPT_PATH=$(echo "$HOOK_CONTEXT" | jq -r '.transcript_path // empty')

# Validate required values
if [ -z "$SESSION_ID" ] || [ -z "$TRANSCRIPT_PATH" ]; then
    exit 0
fi

# Request transcript sync
curl -s -X POST "$CCD_SERVER_URL/api/v1/sync/transcript" \
    -H "Content-Type: application/json" \
    -d "{
        \"session_id\": \"$SESSION_ID\",
        \"transcript_path\": \"$TRANSCRIPT_PATH\"
    }" > /dev/null 2>&1

exit 0
