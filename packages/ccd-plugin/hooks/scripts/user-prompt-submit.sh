#!/bin/bash
# CCD User Prompt Submit Hook
# Saves the user prompt when submitted.

CCD_SERVER_URL="http://localhost:3847"

# Read hook context from stdin
HOOK_CONTEXT=$(cat)

# Extract required values
SESSION_ID=$(echo "$HOOK_CONTEXT" | jq -r '.session_id // empty')
PROMPT=$(echo "$HOOK_CONTEXT" | jq -r '.prompt // empty')

# Validate required values
if [ -z "$SESSION_ID" ]; then
    exit 0
fi

# Save prompt as message if present
if [ -n "$PROMPT" ]; then
    # JSON escape (newlines, quotes, etc.)
    ESCAPED_PROMPT=$(echo "$PROMPT" | jq -Rs '.')

    curl -s -X POST "$CCD_SERVER_URL/api/v1/messages" \
        -H "Content-Type: application/json" \
        -d "{
            \"session_id\": \"$SESSION_ID\",
            \"type\": \"user\",
            \"content\": $ESCAPED_PROMPT
        }" > /dev/null 2>&1
fi

exit 0
