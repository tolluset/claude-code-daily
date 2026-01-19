#!/usr/bin/env bun
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const SERVER_PORT = 3847;
const DASHBOARD_PORT = 3848;
const SERVER_URL = `http://localhost:${SERVER_PORT}`;
const DASHBOARD_URL = `http://localhost:${DASHBOARD_PORT}`;

// Create MCP server instance
const server = new McpServer({
  name: "ccd",
  version: "0.1.0",
});

// Helper: Check if server is running
async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${SERVER_URL}/api/v1/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Helper: Check if dashboard is running
async function checkDashboardHealth(): Promise<boolean> {
  try {
    const response = await fetch(DASHBOARD_URL, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Helper: Fetch from API with server health check
async function fetchFromApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const isServerUp = await checkServerHealth();
    if (!isServerUp) {
      return {
        success: false,
        error: 'CCD server is not running. Cannot access API.'
      };
    }

    const response = await fetch(`${SERVER_URL}/api/v1${endpoint}`, options);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`
      };
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// Helper: Create text response
function createTextResponse(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

// Helper: Create error response
function createErrorResponse(error: string) {
  return createTextResponse(`❌ ${error}`);
}

// Helper: Open URL in default browser
async function openBrowser(url: string): Promise<void> {
  const cmd =
    process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "win32"
        ? `start "${url}"`
        : `xdg-open "${url}"`;

  await execAsync(cmd);
}

// Tool: open_dashboard - Opens the CCD dashboard in the default browser
server.tool(
  "open_dashboard",
  "Opens the Claude Code Daily dashboard in the default browser. Shows session statistics and usage analytics.",
  {},
  async () => {
    // Check if server is running
    const isServerUp = await checkServerHealth();
    if (!isServerUp) {
      return {
        content: [
          {
            type: "text" as const,
            text: "CCD server is not running. The server starts automatically when you begin a Claude Code session, or you can start it manually with `ccd-server`.",
          },
        ],
      };
    }

    // Check if dashboard is running
    const isDashboardUp = await checkDashboardHealth();
    if (!isDashboardUp) {
      return {
        content: [
          {
            type: "text" as const,
            text: `CCD server is running but dashboard is not available at ${DASHBOARD_URL}. You may need to start the dashboard manually with \`cd packages/ccd-dashboard && bun run dev\`.`,
          },
        ],
      };
    }

    // Open dashboard in browser
    try {
      await openBrowser(DASHBOARD_URL);
      return {
        content: [
          {
            type: "text" as const,
            text: `Dashboard opened in browser: ${DASHBOARD_URL}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Could not open browser automatically. Please open manually: ${DASHBOARD_URL}`,
          },
        ],
      };
    }
  }
);

// Tool: get_stats - Get session statistics
server.tool(
  "get_stats",
  "Get Claude Code session statistics including total sessions, messages, and token usage.",
  {
    period: z
      .enum(["today", "week", "month", "all"])
      .optional()
      .describe("Time period for statistics (default: today)"),
  },
  async ({ period = "today" }) => {
    const result = await fetchFromApi<any>(`/stats?period=${period}`);

    if (!result.success) {
      return createErrorResponse(result.error);
    }

    const text = formatStats(result.data, period);

    return createTextResponse(text);
  }
);

// Helper: Format statistics for display
function formatStats(stats: any, period: string): string {
  const lines = [
    `📊 Claude Code Statistics (${period})`,
    "─".repeat(40),
    `Sessions: ${stats.totalSessions ?? 0}`,
    `Messages: ${stats.totalMessages ?? 0}`,
    `Input tokens: ${(stats.totalInputTokens ?? 0).toLocaleString()}`,
    `Output tokens: ${(stats.totalOutputTokens ?? 0).toLocaleString()}`,
  ];

  if (stats.averageSessionDuration) {
    lines.push(`Avg session: ${Math.round(stats.averageSessionDuration / 60)} min`);
  }

  return lines.join("\n");
}

// Tool: search_sessions - Search sessions and messages by content
server.tool(
  "search_sessions",
  "Search Claude Code sessions and messages by content. Finds relevant past conversations, code examples, and solutions.",
  {
    query: z
      .string()
      .min(1)
      .describe("Search query - keywords or phrases to find in sessions and messages"),
    project: z
      .string()
      .optional()
      .describe("Filter by project name"),
    days: z
      .number()
      .optional()
      .describe("Limit search to last N days (default: 30)"),
  },
  async ({ query, project, days = 30 }) => {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const params = new URLSearchParams({ q: query });
    if (project) params.set('project', project);
    params.set('from', fromDate.toISOString().split('T')[0]);

    const result = await fetchFromApi<any>(`/search?${params}`);

    if (!result.success) {
      return createErrorResponse(result.error);
    }

    const results = result.data;

    if (!results || results.length === 0) {
      return createTextResponse(`No results found for "${query}"`);
    }

    const formatted = results
      .slice(0, 10)
      .map((r: any, i: number) =>
        `#${i + 1} [${r.project_name || 'Unknown'}] (${r.timestamp})
Type: ${r.type}
${r.snippet.replace(/<[^>]*>/g, '')}
→ Session: http://localhost:${DASHBOARD_PORT}/sessions/${r.session_id}`
      )
      .join('\n\n');

    return createTextResponse(`🔍 Search Results for "${query}" (${results.length} found)\n\n${formatted}`);
  }
);

// Tool: get_session_content - Get full session content for analysis
server.tool(
  "get_session_content",
  "Retrieves complete session content including all messages and metadata. Use this to analyze a session before extracting insights.",
  {
    session_id: z
      .string()
      .describe("Session ID to retrieve. Can be obtained from search or current session."),
  },
  async ({ session_id }) => {
    try {
      const isServerUp = await checkServerHealth();
      if (!isServerUp) {
        return {
          content: [
            {
              type: "text" as const,
              text: "CCD server is not running",
            },
          ],
        };
      }

      // Get session info
      const sessionRes = await fetch(
        `${SERVER_URL}/api/v1/sessions/${session_id}`
      );
      if (!sessionRes.ok) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Session not found: ${session_id}`,
            },
          ],
        };
      }

      const sessionData = await sessionRes.json();
      const session = sessionData.data;

      // Get messages
      const messagesRes = await fetch(
        `${SERVER_URL}/api/v1/sessions/${session_id}/messages`
      );
      const messagesData = await messagesRes.json();
      const messages = messagesData.data || [];

      // Format for Claude analysis
      const formatted = `
SESSION: ${session.id}
PROJECT: ${session.project_name || 'Unknown'}
STARTED: ${session.started_at}
SUMMARY: ${session.summary || 'No summary'}

MESSAGES (${messages.length} total):
${messages
  .map(
    (m: any, i: number) =>
      `
--- Message ${i + 1} (${m.type}) ---
${m.content || '(empty)'}
${m.model ? `Model: ${m.model}` : ''}
${m.input_tokens ? `Tokens: ${m.input_tokens} in, ${m.output_tokens} out` : ''}
`
  )
  .join('\n')}
`.trim();

      return {
        content: [
          {
            type: "text" as const,
            text: formatted,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to get session content: ${error}`,
          },
        ],
      };
    }
  }
);

// Tool: save_session_insights - Save AI-extracted insights
server.tool(
  "save_session_insights",
  "Saves extracted insights for a session. After analyzing session content with get_session_content, use this to store the insights.",
  {
    session_id: z.string().describe("Session ID"),
    summary: z.string().optional().describe("One-sentence summary of the session"),
    key_learnings: z
      .array(z.string())
      .optional()
      .describe("Key learnings from this session (max 3)"),
    problems_solved: z
      .array(z.string())
      .optional()
      .describe("Problems that were solved (max 3)"),
    code_patterns: z
      .array(z.string())
      .optional()
      .describe("Code patterns or techniques used (max 3)"),
    technologies: z
      .array(z.string())
      .optional()
      .describe("Technologies mentioned or used"),
    difficulty: z
      .enum(["easy", "medium", "hard"])
      .optional()
      .describe("Difficulty level of this session"),
  },
  async (args) => {
    try {
      const isServerUp = await checkServerHealth();
      if (!isServerUp) {
        return {
          content: [
            {
              type: "text" as const,
              text: "CCD server is not running",
            },
          ],
        };
      }

      const response = await fetch(`${SERVER_URL}/api/v1/insights`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(args),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to save insights: ${error}`,
            },
          ],
        };
      }

      const data = await response.json();

      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Insights saved for session ${args.session_id}

View at: http://localhost:${DASHBOARD_PORT}/sessions/${args.session_id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to save insights: ${error}`,
          },
        ],
      };
    }
  }
);

server.tool(
  "generate_daily_report",
  "Generate a daily report summarizing sessions, insights, and statistics for a specific date.",
  {
    date: z
      .string()
      .optional()
      .describe("Date in YYYY-MM-DD format (default: today)"),
  },
  async ({ date }) => {
    const isServerUp = await checkServerHealth();
    if (!isServerUp) {
      return {
        content: [
          {
            type: "text" as const,
            text: "CCD server is not running. Cannot generate daily report.",
          },
        ],
      };
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    try {
      const response = await fetch(
        `${SERVER_URL}/api/v1/daily-report?date=${targetDate}`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      const report = result.data;

      let text = `📊 Daily Report - ${report.date}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      text += `📈 Summary\n`;
      text += `• Sessions: ${report.summary.total_sessions}`;
      if (report.summary.avg_session_duration) {
        text += ` (Avg ${report.summary.avg_session_duration}m)`;
      }
      text += `\n`;
      text += `• Messages: ${report.summary.total_messages}\n`;
      text += `• Tokens: ${report.summary.total_tokens.toLocaleString()} (In ${report.stats.total_input_tokens.toLocaleString()}, Out ${report.stats.total_output_tokens.toLocaleString()})\n`;
      text += `• Cost: $${report.summary.total_cost.toFixed(2)}\n`;
      text += `• Bookmarks: ${report.summary.bookmarked_count}/${report.summary.total_sessions}\n`;
      if (report.summary.projects.length > 0) {
        text += `• Projects: ${report.summary.projects.join(', ')}\n`;
      }

      text += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      if (report.sessions.length === 0) {
        text += `📝 No sessions on this date.\n\n`;
      } else {
        text += `📝 Session List\n\n`;

        report.sessions.forEach((session: any, idx: number) => {
          text += `${idx + 1}. `;
          if (session.is_bookmarked) text += `[⭐] `;
          text += `${session.project_name || '(No Project)'}`;
          if (session.summary) {
            text += ` - ${session.summary}`;
          }
          text += `\n`;

          const startTime = new Date(session.started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          text += `   Time: ${startTime}`;
          if (session.ended_at) {
            const endTime = new Date(session.ended_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const duration = Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000 / 60);
            text += ` - ${endTime} (${duration}m)`;
          }
          text += `\n`;

          if (session.insight) {
            const insight = session.insight;
            if (insight.key_learnings?.length > 0) {
              text += `   ✨ Learnings: ${insight.key_learnings.join(', ')}\n`;
            }
            if (insight.problems_solved?.length > 0) {
              text += `   ✅ Solved: ${insight.problems_solved.join(', ')}\n`;
            }
            if (insight.technologies?.length > 0) {
              text += `   🛠️ Tech: ${insight.technologies.join(', ')}\n`;
            }
          }

          text += `   🔗 Details: ${DASHBOARD_URL}/sessions/${session.id}\n\n`;
        });
      }

      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      text += `🔗 View Full Report: ${DASHBOARD_URL}/daily-report?date=${targetDate}\n`;

      return {
        content: [
          {
            type: "text" as const,
            text,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to generate daily report: ${error}`,
          },
        ],
      };
    }
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CCD MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
