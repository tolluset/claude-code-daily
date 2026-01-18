import { useState, useCallback } from 'react';

/**
 * Custom hook for copying text to clipboard
 * Provides a simple interface with automatic state reset
 *
 * @param duration - Duration in milliseconds to show "copied" state (default: 2000ms)
 * @returns Object with copied state and copy function
 *
 * @example
 * ```tsx
 * const { copied, copy } = useCopyToClipboard();
 *
 * <button onClick={() => copy(text)}>
 *   {copied ? 'Copied!' : 'Copy'}
 * </button>
 * ```
 */
export function useCopyToClipboard(duration: number = 2000) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = useCallback(async (text: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      const key = id || text;
      setCopiedId(key);
      setTimeout(() => setCopiedId(null), duration);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [duration]);

  const isCopied = useCallback((id?: string) => {
    if (!id) return copiedId !== null;
    return copiedId === id;
  }, [copiedId]);

  return {
    copied: copiedId,
    copy,
    isCopied
  };
}
