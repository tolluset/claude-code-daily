#!/usr/bin/env node
import { createRequire } from "node:module";
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// ../ccd-client/dist/client.js
class CCDClient {
  config;
  adapter;
  constructor(config, adapter) {
    this.config = {
      serverUrl: config.serverUrl,
      logEnabled: config.logEnabled ?? false,
      timeout: config.timeout ?? 5000
    };
    this.adapter = adapter;
  }
  async handleEvent(event) {
    const action = this.adapter.parseEvent(event);
    if (!action || action.type === "ignore") {
      return;
    }
    this.log("Handling event action:", action);
    try {
      switch (action.type) {
        case "session.create":
          await this.createSession(action.data);
          break;
        case "session.update":
          await this.updateSessionSummary(action.sessionId, action.summary);
          break;
        case "message.create":
          await this.createMessage(action.data);
          break;
        case "transcript.sync":
          await this.syncTranscript(action.data);
          break;
        case "session.end":
          await this.endSession(action.sessionId);
          break;
      }
    } catch (error) {
      this.log("Error handling event:", error);
      throw error;
    }
  }
  async createSession(data) {
    try {
      this.log("Creating session:", data.session_id);
      const response = await fetch(`${this.config.serverUrl}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(this.config.timeout)
      });
      if (!response.ok) {
        const errorText = await response.text();
        this.log("Session creation failed:", errorText);
        return false;
      }
      const result = await response.json();
      this.log("Session created successfully:", result);
      return true;
    } catch (error) {
      this.log("Session creation error:", error);
      return false;
    }
  }
  async updateSessionSummary(sessionId, summary) {
    try {
      const response = await fetch(`${this.config.serverUrl}/sessions/${sessionId}/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary }),
        signal: AbortSignal.timeout(this.config.timeout)
      });
      if (!response.ok) {
        const errorText = await response.text();
        this.log("Failed to update session summary:", errorText);
      }
    } catch (error) {
      this.log("Update session summary error:", error);
    }
  }
  async createMessage(data) {
    try {
      const response = await fetch(`${this.config.serverUrl}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(this.config.timeout)
      });
      if (!response.ok) {
        const errorText = await response.text();
        this.log("Failed to create message:", errorText);
      }
    } catch (error) {
      this.log("Create message error:", error);
    }
  }
  async syncTranscript(data) {
    try {
      const response = await fetch(`${this.config.serverUrl}/sync/transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(this.config.timeout)
      });
      if (!response.ok) {
        const errorText = await response.text();
        this.log("Failed to sync transcript:", errorText);
      } else {
        this.log("Transcript synced successfully");
      }
    } catch (error) {
      this.log("Sync transcript error:", error);
    }
  }
  async endSession(sessionId) {
    try {
      const response = await fetch(`${this.config.serverUrl}/sessions/${sessionId}/end`, {
        method: "POST",
        signal: AbortSignal.timeout(this.config.timeout)
      });
      if (!response.ok) {
        const errorText = await response.text();
        this.log("Failed to end session:", errorText);
      }
    } catch (error) {
      this.log("End session error:", error);
    }
  }
  async healthCheck() {
    try {
      const response = await fetch(`${this.config.serverUrl}/health`, {
        signal: AbortSignal.timeout(2000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  log(message, data) {
    if (this.config.logEnabled) {
      const timestamp = new Date().toISOString();
      console.log(`[CCDClient ${timestamp}] ${message}`, data ?? "");
    }
  }
}
// ../ccd-client/dist/events/claude.js
class ClaudeCodeAdapter {
  parseEvent(event) {
    const context = event;
    switch (context.hook_event) {
      case "SessionStart":
        return this.handleSessionStart(context);
      case "UserPromptSubmit":
        return this.handleUserPrompt(context);
      case "Stop":
        return this.handleStop(context);
      default:
        return { type: "ignore" };
    }
  }
  handleSessionStart(context) {
    if (!context.session_id || !context.transcript_path || !context.cwd) {
      return null;
    }
    const data = {
      session_id: context.session_id,
      transcript_path: context.transcript_path,
      cwd: context.cwd,
      project_name: context.project_name || this.extractProjectName(context.cwd),
      git_branch: context.git_branch || "",
      source: "claude"
    };
    return {
      type: "session.create",
      data
    };
  }
  handleUserPrompt(context) {
    if (!context.session_id || !context.user_message) {
      return null;
    }
    const data = {
      session_id: context.session_id,
      type: "user",
      content: context.user_message,
      timestamp: context.timestamp || new Date().toISOString()
    };
    return {
      type: "message.create",
      data
    };
  }
  handleStop(context) {
    if (!context.session_id || !context.transcript_path) {
      return null;
    }
    const data = {
      session_id: context.session_id,
      transcript_path: context.transcript_path
    };
    return {
      type: "transcript.sync",
      data
    };
  }
  extractProjectName(cwd) {
    return cwd.split("/").pop() || "unknown";
  }
}
// src/index.ts
import { spawn } from "node:child_process";
var CCD_SERVER_URL = "http://localhost:3847/api/v1";
var LOG_FILE = `${process.env.HOME}/.ccd/hook.log`;
function log(message, data) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}${data ? ` ${JSON.stringify(data)}` : ""}
`;
  try {
    const fs = __require("node:fs");
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (error) {
    console.error("[CCD] Failed to write to log file:", error);
  }
}
async function ensureServerRunning() {
  try {
    const response = await fetch(`${CCD_SERVER_URL}/health`, {
      signal: AbortSignal.timeout(2000)
    });
    if (response.ok)
      return true;
  } catch {
    try {
      const ccdDataDir = `${process.env.HOME}/.ccd`;
      const { mkdirSync, existsSync } = __require("node:fs");
      if (!existsSync(ccdDataDir)) {
        mkdirSync(ccdDataDir, { recursive: true });
      }
      const serverPath = `${process.env.CLAUDE_PLUGIN_ROOT}/scripts/server.js`;
      spawn("bun", [serverPath], {
        detached: true,
        stdio: "ignore"
      }).unref();
      for (let i = 0;i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        try {
          const response = await fetch(`${CCD_SERVER_URL}/health`, {
            signal: AbortSignal.timeout(2000)
          });
          if (response.ok) {
            log("Server started successfully");
            return true;
          }
        } catch {}
      }
    } catch (error) {
      log("Failed to start server", error);
    }
  }
  return false;
}
async function getGitBranch(directory) {
  return new Promise((resolve) => {
    const proc = spawn("git", ["rev-parse", "--abbrev-ref", "HEAD"], {
      cwd: directory,
      stdio: ["ignore", "pipe", "ignore"]
    });
    let output = "";
    proc.stdout?.on("data", (data) => {
      output += data;
    });
    proc.on("close", () => resolve(output.trim()));
    proc.on("error", () => resolve(""));
  });
}
async function main() {
  try {
    const stdinBuffer = [];
    for await (const chunk of process.stdin) {
      stdinBuffer.push(chunk);
    }
    const hookContextStr = Buffer.concat(stdinBuffer).toString("utf-8");
    if (!hookContextStr.trim()) {
      log("No hook context provided");
      process.exit(0);
    }
    const hookContext = JSON.parse(hookContextStr);
    log("Received hook context", hookContext);
    const hookType = process.argv[2];
    if (!hookType) {
      log("No hook type specified");
      process.exit(0);
    }
    log(`Processing ${hookType} hook`);
    if (hookType === "SessionStart") {
      await ensureServerRunning();
    }
    if (hookType === "SessionStart" && hookContext.cwd) {
      if (!hookContext.git_branch) {
        hookContext.git_branch = await getGitBranch(hookContext.cwd);
      }
      if (!hookContext.project_name) {
        hookContext.project_name = hookContext.cwd.split("/").pop() || "unknown";
      }
    }
    const eventContext = {
      ...hookContext,
      hook_event: hookType
    };
    const adapter = new ClaudeCodeAdapter;
    const client = new CCDClient({ serverUrl: CCD_SERVER_URL, logEnabled: false }, adapter);
    await client.handleEvent(eventContext);
    log(`${hookType} hook completed successfully`);
    if (hookType === "Stop" && hookContext.session_id) {
      const scriptDir = `${process.env.CLAUDE_PLUGIN_ROOT}/hooks/scripts`;
      spawn("bash", [`${scriptDir}/auto-extract-insights.sh`, hookContext.session_id], {
        detached: true,
        stdio: "ignore"
      }).unref();
      log("Triggered auto-extract insights in background");
    }
    process.exit(0);
  } catch (error) {
    log("Hook handler error", error);
    process.exit(1);
  }
}
main();
