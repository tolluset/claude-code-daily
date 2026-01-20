#!/bin/bash
# CCD OpenCode Plugin Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/tolluset/claude-code-daily/main/install-opencode.sh | bash

set -e

CCD_VERSION="0.1.1"
REPO="tolluset/claude-code-daily"
INSTALL_DIR="$HOME/.ccd-opencode-plugin"
PLUGIN_DIR="$HOME/.config/opencode/plugins"
CCD_DATA_DIR="$HOME/.ccd"

echo "🚀 Installing Claude Code Daily (CCD) v${CCD_VERSION} for OpenCode..."
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

# 2. Create temp directory
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

# 3. Clone repository
echo "→ Downloading plugin..."
git clone --depth 1 --branch "v${CCD_VERSION}" "https://github.com/$REPO.git" . 2>/dev/null || \
    git clone --depth 1 "https://github.com/$REPO.git" .
echo "  ✓ Repository cloned"

# 4. Build OpenCode plugin
echo "→ Building OpenCode plugin..."
cd "packages/ccd-plugin/.opencode-plugin"
bun install --silent
bun build src/index.ts --outdir dist --target node
echo "  ✓ Plugin built"

# 5. Copy plugin to OpenCode directory
echo "→ Installing to $PLUGIN_DIR..."
mkdir -p "$PLUGIN_DIR"
cp dist/index.js "$PLUGIN_DIR/ccd.js"
echo "  ✓ Plugin installed"

# 6. Setup CCD Server
echo "→ Setting up CCD Server..."
mkdir -p "$CCD_DATA_DIR"

# Install CCD Server globally (via bunx)
cd "$TMP_DIR/packages/ccd-server"
bun install --production
cd "$TMP_DIR"
bun link ./packages/ccd-server
echo "  ✓ CCD Server ready (bun x ccd-server)"

# 7. Start CCD Server
echo "→ Starting CCD Server..."
# Check if already running
if pgrep -f "ccd-server" > /dev/null; then
    echo "  ✓ CCD Server already running"
else
    bun x ccd-server > "${CCD_DATA_DIR}/server.log" 2>&1 &
    SERVER_PID=$!
    echo "  ✓ CCD Server started (PID: ${SERVER_PID})"
fi

# 8. Wait for server to be ready
echo "→ Waiting for CCD Server to start..."
for i in {1..10}; do
    if curl -s http://localhost:3847/health > /dev/null 2>&1; then
        echo "  ✓ CCD Server is ready"
        break
    fi
    sleep 1
done

# 9. Cleanup
cd /
rm -rf "$TMP_DIR"

echo ""
echo "✅ Installation complete!"
echo ""
echo "What was installed:"
echo "  • OpenCode Plugin: $PLUGIN_DIR/ccd.js"
echo "  • CCD Server: bun x ccd-server (auto-start)"
echo "  • Data Directory: $CCD_DATA_DIR"
echo ""
echo "Next steps:"
echo "  1. Restart OpenCode to load the plugin"
echo "  2. Access Dashboard: http://localhost:3847"
echo "  3. Start a new session to begin tracking"
echo ""
echo "Logs:"
echo "  • Server: $CCD_DATA_DIR/server.log"
echo ""
echo "For more information: https://github.com/tolluset/claude-code-daily"
