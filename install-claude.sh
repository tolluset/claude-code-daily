#!/bin/bash
# CCD Claude Code Plugin Installer
# One-command installation for Claude Code users

set -e

CCD_VERSION="0.1.1"
CLAUDE_PLUGIN_DIR="${HOME}/.claude/plugins"
CCD_DATA_DIR="${HOME}/.ccd"

echo "🚀 Installing Claude Code Daily (CCD) v${CCD_VERSION} for Claude Code..."
echo ""

# 1. Check/Install Bun
if ! command -v bun &> /dev/null; then
    echo "→ Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    # Source bun shell setup
    [[ -f "${HOME}/.bun/install/global-bun" ]] && source "${HOME}/.bun/install/global-bun"
    echo "  ✓ Bun installed"
else
    echo "  ✓ Bun already installed"
fi

# 2. Create plugin directory
echo "→ Creating Claude Code plugin directory..."
mkdir -p "${CLAUDE_PLUGIN_DIR}/ccd"
echo "  ✓ ${CLAUDE_PLUGIN_DIR}/ccd"

# 3. Create CCD data directory
echo "→ Creating CCD data directory..."
mkdir -p "${CCD_DATA_DIR}"
echo "  ✓ ${CCD_DATA_DIR}"

# 4. Determine installation location
if [ -n "$CCD_INSTALL_DIR" ]; then
    INSTALL_DIR="$CCD_INSTALL_DIR"
else
    INSTALL_DIR="${HOME}/.ccd/src"
fi

# 5. Clone or update repository
if [ -d "${INSTALL_DIR}" ] && [ -d "${INSTALL_DIR}/.git" ]; then
    echo "→ Updating existing repository..."
    cd "${INSTALL_DIR}"
    git fetch --tags
    git checkout "v${CCD_VERSION}" || git checkout main
    git pull
else
    echo "→ Cloning repository..."
    git clone --branch "v${CCD_VERSION}" https://github.com/tolluset/claude-code-daily.git "${INSTALL_DIR}" 2>/dev/null || \
        git clone https://github.com/tolluset/claude-code-daily.git "${INSTALL_DIR}"
    cd "${INSTALL_DIR}"
fi
echo "  ✓ Repository ready at ${INSTALL_DIR}"

# 6. Build all packages
echo "→ Building CCD packages..."
cd "${INSTALL_DIR}/packages/ccd-plugin"
pnpm run build
echo "  ✓ All packages built"

# 7. Copy plugin files to Claude Code directory
echo "→ Copying plugin to Claude Code..."
cp -r "${INSTALL_DIR}/packages/ccd-plugin/hooks" "${CLAUDE_PLUGIN_DIR}/ccd/"
cp -r "${INSTALL_DIR}/packages/ccd-plugin/scripts" "${CLAUDE_PLUGIN_DIR}/ccd/"
cp -r "${INSTALL_DIR}/packages/ccd-plugin/dashboard" "${CLAUDE_PLUGIN_DIR}/ccd/"
cp -r "${INSTALL_DIR}/packages/ccd-plugin/lib" "${CLAUDE_PLUGIN_DIR}/ccd/"
cp "${INSTALL_DIR}/packages/ccd-plugin/.mcp.json" "${CLAUDE_PLUGIN_DIR}/ccd/"
cp "${INSTALL_DIR}/packages/ccd-plugin/package.json" "${CLAUDE_PLUGIN_DIR}/ccd/"
echo "  ✓ Plugin installed"

# 8. Install CCD Server globally (via bunx)
echo "→ Setting up CCD Server..."
bun pm ls -g | grep -q "ccd-server" || bun install -g "${INSTALL_DIR}/packages/ccd-server"
echo "  ✓ CCD Server ready (bun x ccd-server)"

# 9. Register MCP server
echo "→ Registering MCP server..."
CLAUDE_MCP_FILE="${HOME}/.claude/mcp.json"
if [ -f "${CLAUDE_MCP_FILE}" ]; then
    # Add CCD MCP server if not already present
    if ! grep -q '"ccd-mcp"' "${CLAUDE_MCP_FILE}"; then
        # Backup existing mcp.json
        cp "${CLAUDE_MCP_FILE}" "${CLAUDE_MCP_FILE}.backup"
        # Merge using jq if available, otherwise append
        if command -v jq &> /dev/null; then
            jq -s '.[0] * .[1]' "${CLAUDE_MCP_FILE}" "${INSTALL_DIR}/packages/ccd-plugin/.mcp.json" > "${CLAUDE_MCP_FILE}.tmp" && mv "${CLAUDE_MCP_FILE}.tmp" "${CLAUDE_MCP_FILE}"
        else
            echo "  ⚠ jq not found, skipping MCP server auto-registration"
            echo "    Manually add CCD MCP server to ${CLAUDE_MCP_FILE}"
        fi
    fi
else
    cp "${INSTALL_DIR}/packages/ccd-plugin/.mcp.json" "${CLAUDE_MCP_FILE}"
fi
echo "  ✓ MCP server registered"

# 10. Start CCD Server
echo "→ Starting CCD Server..."
# Check if already running
if pgrep -f "ccd-server" > /dev/null; then
    echo "  ✓ CCD Server already running"
else
    bun x ccd-server > "${CCD_DATA_DIR}/server.log" 2>&1 &
    SERVER_PID=$!
    echo "  ✓ CCD Server started (PID: ${SERVER_PID})"
fi

# 11. Wait for server to be ready
echo "→ Waiting for CCD Server to start..."
for i in {1..10}; do
    if curl -s http://localhost:3847/health > /dev/null 2>&1; then
        echo "  ✓ CCD Server is ready"
        break
    fi
    sleep 1
done

echo ""
echo "✅ Installation complete!"
echo ""
echo "What was installed:"
echo "  • Claude Code Plugin: ${CLAUDE_PLUGIN_DIR}/ccd/"
echo "  • CCD Server: bun x ccd-server (auto-start)"
echo "  • MCP Server: ${CLAUDE_MCP_FILE}"
echo "  • Data Directory: ${CCD_DATA_DIR}"
echo ""
echo "Next steps:"
echo "  1. Restart Claude Code to load the plugin"
echo "  2. Access Dashboard: http://localhost:3847"
echo "  3. Try commands: /bookmark, /insights, /daily-report"
echo ""
echo "Logs:"
echo "  • Server: ${CCD_DATA_DIR}/server.log"
echo "  • Plugin: ${CCD_DATA_DIR}/hook.log"
echo ""
echo "For more information: https://github.com/tolluset/claude-code-daily"
