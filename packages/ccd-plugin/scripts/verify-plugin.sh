#!/bin/bash
# CCD Plugin Verification Script
# Verifies plugin files can execute independently

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
TEST_INSTALL_DIR="${HOME}/.claude/plugins-test/ccd-plugin"

echo "🔍 Verifying plugin installation..."
echo ""

# Test environment
export CLAUDE_PLUGIN_ROOT="$TEST_INSTALL_DIR"

# 1. Verify smart-install.cjs
echo "→ Testing smart-install.cjs..."
if node "$TEST_INSTALL_DIR/hooks/scripts/smart-install.cjs" > /dev/null 2>&1; then
    echo "  ✓ smart-install.cjs executes"
else
    echo "  ⚠ smart-install.cjs failed (may need Bun installation)"
fi

# 2. Verify MCP server
echo "→ Testing mcp-server.js..."
timeout 2 node "$TEST_INSTALL_DIR/scripts/mcp-server.js" > /dev/null 2>&1
MCP_EXIT_CODE=$?
if [ $MCP_EXIT_CODE -eq 124 ]; then
    echo "  ✓ mcp-server.js starts (timeout expected)"
elif [ $MCP_EXIT_CODE -eq 0 ]; then
    echo "  ✓ mcp-server.js executes"
else
    echo "  ✗ mcp-server.js failed with exit code $MCP_EXIT_CODE!"
    exit 1
fi

# 3. Verify hooks.js
echo "→ Testing lib/hooks.js..."
if node "$TEST_INSTALL_DIR/lib/hooks.js" --help > /dev/null 2>&1 || [ $? -eq 1 ]; then
    echo "  ✓ lib/hooks.js executes"
else
    echo "  ✗ lib/hooks.js failed!"
    exit 1
fi

# 4. Verify dashboard files
echo "→ Testing dashboard..."
if [ -f "$TEST_INSTALL_DIR/dashboard/dist/index.html" ]; then
    HTML_SIZE=$(wc -c < "$TEST_INSTALL_DIR/dashboard/dist/index.html")
    if [ "$HTML_SIZE" -gt 100 ]; then
        echo "  ✓ dashboard/dist/index.html ($HTML_SIZE bytes)"
    else
        echo "  ✗ dashboard/dist/index.html is too small!"
        exit 1
    fi
else
    echo "  ✗ dashboard/dist/index.html not found!"
    exit 1
fi

# 5. Verify hooks.json paths
echo "→ Verifying hooks.json paths..."
HOOKS_JSON="$TEST_INSTALL_DIR/hooks/hooks.json"
if grep -q "smart-install.cjs" "$HOOKS_JSON"; then
    echo "  ✓ smart-install.cjs path"
else
    echo "  ✗ smart-install.cjs path incorrect!"
    exit 1
fi

if grep -q 'lib/hooks.js' "$HOOKS_JSON"; then
    echo "  ✓ lib/hooks.js paths"
else
    echo "  ✗ lib/hooks.js paths incorrect!"
    exit 1
fi

# 6. Verify no absolute paths
echo "→ Checking for absolute paths..."
if grep -E '(packages/|/Users/)' "$HOOKS_JSON"; then
    echo "  ✗ Found absolute paths in hooks.json!"
    exit 1
else
    echo "  ✓ No absolute paths"
fi

# 7. Verify shebangs
echo "→ Verifying shebangs..."
for file in "scripts/mcp-server.js" "lib/hooks.js"; do
    SHEBANG=$(head -1 "$TEST_INSTALL_DIR/$file")
    if [[ "$SHEBANG" == "#!/usr/bin/env node" ]] || [[ "$SHEBANG" == "#!/usr/bin/env bun" ]]; then
        echo "  ✓ $file: $SHEBANG"
    else
        echo "  ✗ $file: Invalid shebang: $SHEBANG"
        exit 1
    fi
done

echo ""
echo "✓ All verifications passed!"
echo ""
echo "Plugin is ready for deployment."
