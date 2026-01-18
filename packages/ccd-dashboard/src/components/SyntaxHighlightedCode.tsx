import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { Copy, Check } from 'lucide-react';
import { highlightCode } from '../lib/shiki-highlighter';
import { cn } from '../lib/utils';
import { useTheme } from './ThemeProvider';

export interface SyntaxHighlightedCodeProps {
  code: string;
  language?: string;
  className?: string;
}

export const SyntaxHighlightedCode = React.memo(function SyntaxHighlightedCode({
  code,
  language,
  className,
}: SyntaxHighlightedCodeProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  }, [code]);

  useEffect(() => {
    let mounted = true;

    async function highlight() {
      setIsLoading(true);
      setError(null);

      try {
        const highlighted = await highlightCode(code, language, theme);

        if (mounted) {
          setHtml(highlighted);
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to highlight code');
          setIsLoading(false);
        }
      }
    }

    highlight();

    return () => {
      mounted = false;
    };
  }, [code, language, theme]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
        {error}
      </div>
    );
  }

  if (isLoading || !html) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
        Loading syntax highlighting...
      </div>
    );
  }

  return (
    <div className={cn('relative group not-prose rounded-xl overflow-hidden border border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-200 bg-gradient-to-br from-background to-muted/20', className)}>
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-muted/30 to-muted/10 backdrop-blur-sm border-b border-border/30">
        <div className="flex items-center gap-2">
          {language && (
            <span className="text-[10px] font-bold text-primary/70 uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/5">
              {language}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="ml-auto p-1.5 rounded-lg hover:bg-primary/10 transition-all duration-200 text-muted-foreground hover:text-primary hover:scale-110"
          title="Copy code"
          type="button"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      <div
        className="overflow-x-auto [&>pre]:!m-0 [&>pre]:!rounded-none [&>pre]:!border-0 [&>pre]:!p-6 [&>pre]:!bg-transparent"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
});

