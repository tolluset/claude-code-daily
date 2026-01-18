import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toggleBookmark, deleteSession } from '../lib/api';
import type { Session } from '@ccd/types';

/**
 * Custom hook for session actions (bookmark, copy, delete)
 * Provides consistent behavior and query invalidation across components
 *
 * @returns Object with action handlers and state
 *
 * @example
 * ```tsx
 * const { handleBookmark, handleCopyId, handleDelete, copiedId } = useSessionActions();
 *
 * // Use in component
 * <button onClick={() => handleBookmark(session)}>Bookmark</button>
 * <button onClick={() => handleCopyId(session.id)}>Copy ID</button>
 * <button onClick={() => handleDelete(session)}>Delete</button>
 * ```
 */
export function useSessionActions() {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleBookmark = async (session: Session, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    await toggleBookmark(session.id);

    queryClient.invalidateQueries({ queryKey: ['sessions'] });
    queryClient.invalidateQueries({ queryKey: ['search'] });
    queryClient.invalidateQueries({ queryKey: ['streak'] });
  };

  const handleCopyId = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    navigator.clipboard.writeText(`/resume ${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (session: Session) => {
    const confirmed = window.confirm(
      `Delete session "${session.project_name || session.id.slice(0, 8)}"?\nThis will also delete all messages in this session.`
    );

    if (confirmed) {
      await deleteSession(session.id);
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    }
  };

  return {
    handleBookmark,
    handleCopyId,
    handleDelete,
    copiedId
  };
}
