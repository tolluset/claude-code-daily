import { isDiffContent, isToolResult, detectToolType } from '../lib/code-block-utils';
import { DiffView } from './DiffView';
import { SyntaxHighlightedCode } from './SyntaxHighlightedCode';
import { ToolResultBlock } from './ToolResultBlock';

export interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Smart code block router that detects content type and renders appropriately:
 * - Inline code → simple <code> tag with styling
 * - Diff blocks → DiffView component (Pierre/Shiki)
 * - Tool results → ToolResultBlock component
 * - General code → SyntaxHighlightedCode component (Shiki)
 */
export function CodeBlock({ inline, className, children, ...props }: CodeBlockProps) {
  // Extract code string from children
  const code = String(children || '').replace(/\n$/, '');

  // Extract language from className (format: "language-xxx")
  const languageMatch = /language-(\w+)/.exec(className || '');
  const language = languageMatch ? languageMatch[1] : undefined;

  // Inline code: simple styling, no syntax highlighting
  if (inline) {
    return (
      <code
        className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    );
  }

  // Block code: route to appropriate renderer based on content type

  // 1. Check for diff content
  if (isDiffContent(code)) {
    return <DiffView content={code} theme="system" />;
  }

  // 2. Check for tool result (Bash/Read output)
  if (isToolResult(code, language)) {
    const toolType = detectToolType(code, language);
    return (
      <ToolResultBlock
        code={code}
        toolType={toolType as 'bash' | 'read' | 'unknown'}
      />
    );
  }

  // 3. General code with syntax highlighting
  return <SyntaxHighlightedCode code={code} language={language} />;
}
