#!/bin/bash
# CCD User Prompt Submit Hook
# Saves the user prompt when submitted.

CCD_SERVER_URL="http://localhost:3847"
LOG_FILE="$HOME/.ccd/hook.log"

# Ensure log directory exists
mkdir -p "$HOME/.ccd"

# Debug logging
echo "[$(date)] ========== UserPromptSubmit hook called ==========" >> "$LOG_FILE"

# Read hook context from stdin
HOOK_CONTEXT=$(cat)
echo "[$(date)] HOOK_CONTEXT: $HOOK_CONTEXT" >> "$LOG_FILE"

# Extract required values
SESSION_ID=$(echo "$HOOK_CONTEXT" | jq -r '.session_id // empty')
PROMPT=$(echo "$HOOK_CONTEXT" | jq -r '.prompt // empty')

# Log extracted values
echo "[$(date)] SESSION_ID: $SESSION_ID" >> "$LOG_FILE"
echo "[$(date)] PROMPT: $PROMPT" >> "$LOG_FILE"

# Validate required values
if [ -z "$SESSION_ID" ]; then
    echo "[$(date)] ERROR: SESSION_ID is empty, exiting" >> "$LOG_FILE"
    exit 0
fi

# Save prompt as message if present
if [ -n "$PROMPT" ]; then
    # JSON escape (newlines, quotes, etc.)
    ESCAPED_PROMPT=$(echo "$PROMPT" | jq -Rs '.')

    echo "[$(date)] Sending to API: session_id=$SESSION_ID, content=$ESCAPED_PROMPT" >> "$LOG_FILE"

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$CCD_SERVER_URL/api/v1/messages" \
        -H "Content-Type: application/json" \
        -d "{
            \"session_id\": \"$SESSION_ID\",
            \"type\": \"user\",
            \"content\": $ESCAPED_PROMPT
        }" 2>&1)

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    echo "[$(date)] API Response: HTTP $HTTP_CODE - $BODY" >> "$LOG_FILE"
else
    echo "[$(date)] PROMPT is empty, skipping API call" >> "$LOG_FILE"
fi

echo "[$(date)] ========== Hook completed ==========" >> "$LOG_FILE"
exit 0
