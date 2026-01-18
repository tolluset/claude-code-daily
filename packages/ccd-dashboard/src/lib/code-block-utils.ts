/**
 * Utilities for detecting and categorizing code block types
 */

/**
 * Detects if code content is a git diff
 * Checks for common diff patterns like "diff ", "@@", "---", "+++"
 */
export function isDiffContent(code: string): boolean {
  // Check for common diff markers at the start of lines
  const diffPattern = /^(diff |@@|---|\+\+\+)/m;
  return diffPattern.test(code);
}

/**
 * Detects if code content is a tool execution result (Bash/Read output)
 * Tool results typically have:
 * - Language hints: bash, shell, sh
 * - Line number patterns: "  123→" (Read tool output format)
 */
export function isToolResult(code: string, language?: string): boolean {
  // Check language hint
  if (language && ['bash', 'shell', 'sh'].includes(language.toLowerCase())) {
    return true;
  }

  // Check for line number pattern used by Read tool (e.g., "  123→")
  const lineNumberPattern = /^\s*\d+→/m;
  return lineNumberPattern.test(code);
}

/**
 * Detects the specific type of tool result
 * Returns 'bash', 'read', or 'unknown'
 */
export function detectToolType(code: string, language?: string): string {
  // Explicit language hint
  if (language) {
    const lang = language.toLowerCase();
    if (['bash', 'shell', 'sh'].includes(lang)) {
      return 'bash';
    }
  }

  // Line number pattern → Read tool
  if (/^\s*\d+→/m.test(code)) {
    return 'read';
  }

  // Shell command patterns (starts with $ or #)
  if (/^[\$#]\s+/m.test(code)) {
    return 'bash';
  }

  return 'unknown';
}
