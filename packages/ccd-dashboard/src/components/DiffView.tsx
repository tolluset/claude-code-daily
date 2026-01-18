import { useState, useEffect } from 'react';
import { preloadHighlighter, type ThemeTypes, type BundledLanguage } from '@pierre/diffs';
import { PatchDiff } from '@pierre/diffs/react';

export interface DiffViewProps {
  content: string;
  theme?: ThemeTypes;
  className?: string;
  style?: React.CSSProperties;
}

export function DiffView({ content, theme, className, style }: DiffViewProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        await preloadHighlighter({
          themes: ['github-light', 'github-dark'] as any,
          langs: ['typescript', 'javascript', 'tsx', 'jsx', 'css', 'html', 'json', 'md', 'markdown'] as BundledLanguage[]
        });

        if (mounted) {
          setIsLoaded(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load highlighter');
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
        {error}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
        Loading diff viewer...
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto rounded-lg border border-border bg-background">
      <PatchDiff
        patch={content}
        options={{
          themeType: theme || 'system',
          diffStyle: 'unified',
          disableLineNumbers: false
        }}
        className={className}
        style={style}
      />
    </div>
  );
}
