import { useState } from 'react';
import { Terminal, FileText, Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';

export interface ToolResultBlockProps {
  code: string;
  toolType?: 'bash' | 'read' | 'unknown';
  className?: string;
}

export function ToolResultBlock({
  code,
  toolType = 'unknown',
  className,
}: ToolResultBlockProps) {
  const [copied, setCopied] = useState(false);

  // Determine icon based on tool type
  const Icon = toolType === 'bash' ? Terminal : FileText;
  const label = toolType === 'bash' ? 'Bash Output' : toolType === 'read' ? 'File Content' : 'Tool Output';

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className={cn('relative group not-prose rounded-xl overflow-hidden border border-blue-200/50 dark:border-blue-800/50 border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-gradient-to-br from-blue-50/30 to-blue-100/20 dark:from-blue-950/20 dark:to-blue-900/10', className)}>
      {/* Header with icon, label, and copy button */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-100/50 to-blue-50/30 dark:from-blue-900/30 dark:to-blue-950/20 backdrop-blur-sm border-b border-blue-200/30 dark:border-blue-800/30">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/10">
            {label}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg hover:bg-blue-500/10 transition-all duration-200 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:scale-110"
          title="Copy output"
          type="button"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Code content */}
      <pre className="m-0 p-6 overflow-x-auto text-sm font-mono bg-transparent text-gray-900 dark:text-gray-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
