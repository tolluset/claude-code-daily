import { Terminal, FileText } from 'lucide-react';
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
  // Determine icon based on tool type
  const Icon = toolType === 'bash' ? Terminal : FileText;
  const label = toolType === 'bash' ? 'Bash Output' : toolType === 'read' ? 'File Content' : 'Tool Output';

  return (
    <div
      className={cn(
        'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30 rounded-r-lg overflow-hidden',
        className
      )}
    >
      {/* Header with icon and label */}
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800">
        <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
          {label}
        </span>
      </div>

      {/* Code content */}
      <pre className="p-4 overflow-x-auto text-sm font-mono text-gray-900 dark:text-gray-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
