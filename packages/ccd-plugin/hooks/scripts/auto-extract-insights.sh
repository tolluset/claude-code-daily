#!/bin/bash
# CCD Auto Extract Insights
# Automatically extracts insights from a session using Claude Code

SESSION_ID="$1"
LOG_FILE="$HOME/.ccd/auto-extract.log"

# Ensure log directory exists
mkdir -p "$HOME/.ccd"

echo "[$(date)] ========== Auto-extract insights started for $SESSION_ID ==========" >> "$LOG_FILE"

# Check if config enables auto-extraction
CONFIG_FILE="$HOME/.ccd/config.json"
if [ -f "$CONFIG_FILE" ]; then
    AUTO_EXTRACT=$(jq -r '.auto_extract_insights // false' "$CONFIG_FILE")
    if [ "$AUTO_EXTRACT" != "true" ]; then
        echo "[$(date)] Auto-extraction disabled in config, skipping" >> "$LOG_FILE"
        exit 0
    fi
fi

# Check if claude command exists
if ! command -v claude &> /dev/null; then
    echo "[$(date)] ERROR: 'claude' command not found, cannot auto-extract" >> "$LOG_FILE"
    exit 0
fi

# Prepare the prompt for Claude
PROMPT="Analyze session $SESSION_ID and extract insights. Use the get_session_content MCP tool to retrieve the session data, then analyze it and save insights using the save_session_insights MCP tool. Be concise and focus on key learnings, problems solved, and technologies used. IMPORTANT: Write all insights in the same language as the session conversation."

echo "[$(date)] Executing Claude command with prompt" >> "$LOG_FILE"

# Execute Claude command in the background
# Pass prompt via stdin to avoid interactive mode
echo "$PROMPT" | claude >> "$LOG_FILE" 2>&1 &

CLAUDE_PID=$!
echo "[$(date)] Claude process started with PID: $CLAUDE_PID" >> "$LOG_FILE"

# Wait for completion (with timeout)
TIMEOUT=30
ELAPSED=0
while kill -0 $CLAUDE_PID 2>/dev/null && [ $ELAPSED -lt $TIMEOUT ]; do
    sleep 1
    ELAPSED=$((ELAPSED + 1))
done

if kill -0 $CLAUDE_PID 2>/dev/null; then
    echo "[$(date)] WARNING: Claude process timed out after ${TIMEOUT}s, killing" >> "$LOG_FILE"
    kill $CLAUDE_PID 2>/dev/null
else
    echo "[$(date)] Claude process completed successfully" >> "$LOG_FILE"
fi

echo "[$(date)] ========== Auto-extract insights completed ==========" >> "$LOG_FILE"
exit 0
