#!/bin/bash
# CCD OpenCode Plugin Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/tolluset/claude-code-daily/main/install-opencode.sh | bash

set -e

REPO="tolluset/claude-code-daily"
INSTALL_DIR="$HOME/.ccd-opencode-plugin"
PLUGIN_DIR="$HOME/.config/opencode/plugins"

echo "🚀 Installing CCD OpenCode Plugin..."

# Check requirements
if ! command -v bun &> /dev/null; then
    echo "❌ Error: Bun is required but not installed."
    echo "Please install Bun: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Create temp directory
TMP_DIR=$(mktemp -d)
cd "$TMP_DIR"

echo "📥 Downloading plugin..."
git clone "https://github.com/$REPO.git" . 2>/dev/null || {
    echo "❌ Error: Failed to clone repository"
    rm -rf "$TMP_DIR"
    exit 1
}

echo "🔨 Building plugin..."
cd "packages/ccd-plugin/.opencode-plugin"

bun install --silent
bun build src/index.ts --outdir dist --target bun --format esm

echo "📦 Installing to $PLUGIN_DIR..."
mkdir -p "$PLUGIN_DIR"
cp dist/index.js "$PLUGIN_DIR/ccd.js"

# Cleanup
cd /
rm -rf "$TMP_DIR"

echo "✅ Installation complete!"
echo "📝 Please restart OpenCode to activate the plugin."
echo "🔍 Logs will be saved to ~/.ccd/opencode-plugin.log"
