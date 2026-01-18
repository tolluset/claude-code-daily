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
    const isServerUp = await checkServerHealth();
    if (!isServerUp) {
      return {
        content: [
          {
            type: "text" as const,
            text: "CCD server is not running. Cannot fetch statistics.",
          },
        ],
      };
    }

    try {
      const response = await fetch(`${SERVER_URL}/api/v1/stats?period=${period}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const stats = await response.json();
      const text = formatStats(stats, period);

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
            text: `Failed to fetch statistics: ${error}`,
          },
        ],
      };
    }
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
