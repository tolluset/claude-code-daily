import { useRef, useCallback } from 'react';

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRan = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  callbackRef.current = callback;

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRan.current;

      if (timeSinceLastRun >= delay) {
        lastRan.current = now;
        callbackRef.current(...args);
      } else if (timeoutRef.current === null) {
        timeoutRef.current = setTimeout(() => {
          lastRan.current = Date.now();
          timeoutRef.current = null;
          callbackRef.current(...args);
        }, delay - timeSinceLastRun);
      }
    },
    [delay]
  );

  return throttledCallback as T;
}
