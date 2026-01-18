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
  // Tool results need to meet stricter criteria to avoid false positives
  
  // Check for Read tool's line number pattern (e.g., "  123→")
  const lineNumberPattern = /^\s*\d+→/m;
  if (lineNumberPattern.test(code)) {
    return true;
  }

  // For bash/shell language hint, require additional evidence:
  // - Multi-line content OR
  // - Contains command prompt patterns ($ or #) AND reasonable length
  if (language && ['bash', 'shell', 'sh'].includes(language.toLowerCase())) {
    const lines = code.trim().split('\n');
    const hasMultipleLines = lines.length > 2;
    const hasCommandPrompt = /^[\$#]\s+/m.test(code);
    const hasReasonableLength = code.length > 20;
    
    // Only treat as tool result if it looks like actual command output
    return (hasMultipleLines && hasReasonableLength) || 
           (hasCommandPrompt && hasReasonableLength);
  }

  return false;
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
