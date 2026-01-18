import { useState, useEffect } from 'react';
import { highlightCode } from '../lib/shiki-highlighter';
import { cn } from '../lib/utils';

export interface SyntaxHighlightedCodeProps {
  code: string;
  language?: string;
  className?: string;
}

export function SyntaxHighlightedCode({
  code,
  language,
  className,
}: SyntaxHighlightedCodeProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Detect theme from system preferences
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  // Listen for theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Highlight code when code, language, or theme changes
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
    <div
      className={cn(
        'w-full overflow-auto rounded-lg border border-border bg-background',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
