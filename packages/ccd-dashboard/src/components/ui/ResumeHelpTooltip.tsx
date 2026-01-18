import { HelpCircle } from 'lucide-react';
import { IconButton } from './IconButton';

export interface ResumeHelpTooltipProps {
  position?: 'left' | 'right';
}

export function ResumeHelpTooltip({ position = 'left' }: ResumeHelpTooltipProps) {
  const positionClass = position === 'left'
    ? 'left-0 -translate-x-1/2'
    : 'right-0 translate-x-1/2';

  return (
    <div className="relative group">
      <IconButton type="button" size="sm" title="Resume help" className="cursor-default">
        <HelpCircle className="h-4 w-4" />
      </IconButton>
      <div className={`
        absolute top-full mt-1 ${positionClass}
        opacity-0 invisible group-hover:opacity-100 group-hover:visible
        transition-all duration-200 z-50
      `}>
        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
          <div className="flex flex-col gap-1">
            <div className="font-medium mb-2">Resume this session:</div>
            <div className="space-y-2">
              <div>
                <span className="text-gray-400">Terminal:</span>
                <code className="ml-1 bg-muted px-1.5 py-0.5 rounded">claude --resume &lt;session_id&gt;</code>
              </div>
              <div>
                <span className="text-gray-400">Claude Code:</span>
                <code className="ml-1 bg-muted px-1.5 py-0.5 rounded">/resume &lt;session_id&gt;</code>
              </div>
            </div>
          </div>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
        </div>
      </div>
    </div>
  );
}
