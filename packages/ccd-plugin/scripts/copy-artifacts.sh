#!/bin/bash

# CCD Plugin Build Artifacts Copy Script
# Copies built files from other packages to plugin directory

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
PACKAGES_DIR="$(dirname "$PLUGIN_DIR")"

echo "📦 Copying build artifacts to plugin directory..."
echo ""

# 1. Copy server
echo "→ Copying ccd-server..."
mkdir -p "$PLUGIN_DIR/scripts"
if [ -f "$PACKAGES_DIR/ccd-server/dist/index.js" ]; then
    cp "$PACKAGES_DIR/ccd-server/dist/index.js" "$PLUGIN_DIR/scripts/server.js"
    echo "  ✓ server.js"
else
    echo "  ✗ ccd-server/dist/index.js not found!"
    exit 1
fi

# 2. Copy MCP server
echo "→ Copying ccd-mcp..."
if [ -f "$PACKAGES_DIR/ccd-mcp/dist/index.js" ]; then
    cp "$PACKAGES_DIR/ccd-mcp/dist/index.js" "$PLUGIN_DIR/scripts/mcp-server.cjs"
    echo "  ✓ mcp-server.cjs"
else
    echo "  ✗ ccd-mcp/dist/index.js not found!"
    exit 1
fi

# 3. Copy dashboard
echo "→ Copying ccd-dashboard..."
if [ -d "$PACKAGES_DIR/ccd-dashboard/dist" ]; then
    mkdir -p "$PLUGIN_DIR/dashboard"
    rm -rf "$PLUGIN_DIR/dashboard/dist"
    cp -r "$PACKAGES_DIR/ccd-dashboard/dist" "$PLUGIN_DIR/dashboard/dist"
    echo "  ✓ dashboard/dist/"
else
    echo "  ✗ ccd-dashboard/dist not found!"
    exit 1
fi

echo ""
echo "✓ All artifacts copied successfully!"
