import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Session } from '@ccd/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDateForApi(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Extract unique project names from sessions
 * Returns sorted array of project names, filtering out null/undefined values
 *
 * @param sessions - Array of sessions
 * @returns Sorted array of unique project names
 *
 * @example
 * ```tsx
 * const projectList = extractProjectList(allSessions);
 * // => ['project-a', 'project-b', 'project-c']
 * ```
 */
export function extractProjectList(sessions: Session[]): string[] {
  return Array.from(
    new Set(
      sessions
        .map((s) => s.project_name)
        .filter((p): p is string => Boolean(p))
    )
  ).sort();
}

