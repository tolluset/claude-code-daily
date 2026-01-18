#!/bin/bash
# CCD Stop Hook
# Syncs the transcript when Claude's response is complete.

CCD_SERVER_URL="http://localhost:3847"
LOG_FILE="$HOME/.ccd/hook.log"

# Ensure log directory exists
mkdir -p "$HOME/.ccd"

# Debug logging
echo "[$(date)] ========== Stop hook called ==========" >> "$LOG_FILE"

# Read hook context from stdin
HOOK_CONTEXT=$(cat)
echo "[$(date)] HOOK_CONTEXT: $HOOK_CONTEXT" >> "$LOG_FILE"

# Extract required values
SESSION_ID=$(echo "$HOOK_CONTEXT" | jq -r '.session_id // empty')
TRANSCRIPT_PATH=$(echo "$HOOK_CONTEXT" | jq -r '.transcript_path // empty')

echo "[$(date)] SESSION_ID: $SESSION_ID" >> "$LOG_FILE"
echo "[$(date)] TRANSCRIPT_PATH: $TRANSCRIPT_PATH" >> "$LOG_FILE"

# Validate required values
if [ -z "$SESSION_ID" ] || [ -z "$TRANSCRIPT_PATH" ]; then
    echo "[$(date)] ERROR: Missing SESSION_ID or TRANSCRIPT_PATH, exiting" >> "$LOG_FILE"
    exit 0
fi

# Request transcript sync
echo "[$(date)] Sending sync request to API" >> "$LOG_FILE"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$CCD_SERVER_URL/api/v1/sync/transcript" \
    -H "Content-Type: application/json" \
    -d "{
        \"session_id\": \"$SESSION_ID\",
        \"transcript_path\": \"$TRANSCRIPT_PATH\"
    }" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "[$(date)] API Response: HTTP $HTTP_CODE - $BODY" >> "$LOG_FILE"
echo "[$(date)] ========== Stop hook completed ==========" >> "$LOG_FILE"

exit 0
