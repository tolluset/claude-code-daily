#!/bin/bash
# CCD Plugin Installation Test
# Simulates actual plugin marketplace installation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
TEST_INSTALL_DIR="${HOME}/.claude/plugins-test/ccd-plugin"

echo "🧪 Testing plugin installation..."
echo ""

# 1. Clean test directory
echo "→ Cleaning test directory..."
rm -rf "$TEST_INSTALL_DIR"
mkdir -p "$TEST_INSTALL_DIR"
echo "  ✓ $TEST_INSTALL_DIR"

# 2. Copy plugin files (simulate marketplace copy)
echo "→ Copying plugin files..."
cp -r "$PLUGIN_DIR/hooks" "$TEST_INSTALL_DIR/"
cp -r "$PLUGIN_DIR/scripts" "$TEST_INSTALL_DIR/"
cp -r "$PLUGIN_DIR/lib" "$TEST_INSTALL_DIR/"
cp -r "$PLUGIN_DIR/dashboard" "$TEST_INSTALL_DIR/"
cp "$PLUGIN_DIR/.mcp.json" "$TEST_INSTALL_DIR/"
cp "$PLUGIN_DIR/package.json" "$TEST_INSTALL_DIR/"
echo "  ✓ Plugin structure copied"

# 3. Verify structure
echo "→ Verifying plugin structure..."
REQUIRED_FILES=(
    "hooks/hooks.json"
    "hooks/scripts/smart-install.cjs"
    "scripts/server.js"
    "scripts/mcp-server.js"
    "lib/hooks.js"
    "dashboard/dist/index.html"
    ".mcp.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$TEST_INSTALL_DIR/$file" ] || [ -d "$TEST_INSTALL_DIR/$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file MISSING!"
        exit 1
    fi
done

echo ""
echo "✓ Plugin installation test passed!"
echo ""
echo "Test installation location: $TEST_INSTALL_DIR"
echo ""
echo "Next steps:"
echo "  1. Run verification: bash scripts/verify-plugin.sh"
echo "  2. Test manually: ln -sf $TEST_INSTALL_DIR ~/.claude/plugins/ccd-test"
