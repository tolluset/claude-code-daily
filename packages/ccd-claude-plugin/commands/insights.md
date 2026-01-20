---
name: insights
description: Extract AI-generated insights from the current session
---

You are helping extract insights from a Claude Code session. Follow these steps:

1. **Get the current session ID**:
   - The session ID is available in the environment variable: `$CLAUDE_SESSION_ID`
   - If not available, inform the user that this command must be run within an active Claude Code session

2. **Retrieve session content**:
   - Use the MCP tool `get_session_content` with the session ID
   - This will fetch all messages and metadata for analysis

3. **Analyze the session**:
   **IMPORTANT**: Detect the primary language used in the session and write insights in that same language.

   Extract the following information from the conversation:

   - **Summary**: One concise sentence (max 100 chars) describing what was accomplished
   - **Key Learnings**: Up to 3 important things learned (technical concepts, patterns, solutions)
   - **Problems Solved**: Up to 3 specific problems that were addressed
   - **Code Patterns**: Up to 3 coding patterns or techniques used (e.g., "React hooks for state", "async/await error handling")
   - **Technologies**: List of technologies used (e.g., TypeScript, React, SQLite)
   - **Difficulty**: Rate as 'easy', 'medium', or 'hard' based on complexity

4. **Save the insights**:
   - Use the MCP tool `save_session_insights` with the extracted data
   - Ensure all array fields are properly formatted as JSON arrays
   - Use only the fields that have meaningful content (omit empty ones)

5. **Provide feedback**:
   - Confirm successful extraction with a summary
   - If any step fails, explain the error clearly
   - Suggest viewing the insights at: `http://localhost:3848/sessions/{session_id}`

**Example output format**:
```
✅ Insights extracted successfully!

Summary: Implemented user authentication with JWT tokens
Key Learnings: 3 items
Problems Solved: 2 items
Technologies: React, TypeScript, JWT, Express

View details: http://localhost:3848/sessions/ses_abc123
```

**Important**:
- Focus on actionable, specific insights
- Avoid generic statements like "learned about coding"
- Be concise but descriptive
- If the session was very short or had no meaningful content, explain this to the user
- **Write insights in the same language as the session conversation**
