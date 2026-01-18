import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import DOMPurify from 'dompurify';
import { cn } from '../lib/utils';
import { CodeBlock } from './CodeBlock';

export interface MessageContentProps {
  content: string;
  className?: string;
}

export function MessageContent({ content, className }: MessageContentProps) {
  const sanitizedContent = DOMPurify.sanitize(content);

  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          script: () => null,
          iframe: () => null,
          code: CodeBlock,
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}

