import { useQuery } from '@tanstack/react-query';
import {
  fetchApi,
  type TodayStatsResponse,
  type SessionListResponse,
  type Session,
  type Message,
  type ApiResponse
} from '@ccd/types';

// Dashboard uses relative path (Vite proxies to actual server)
const DASHBOARD_API_BASE = '/api/v1';

// Hooks
export function useTodayStats() {
  return useQuery({
    queryKey: ['stats', 'today'],
    queryFn: () => fetchApi<TodayStatsResponse>('/stats/today', undefined, DASHBOARD_API_BASE),
    refetchInterval: 30000
  });
}

export function useSessions(date?: string) {
  const params = new URLSearchParams();
  if (date) {
    params.set('date', date);
  } else {
    params.set('today', 'true');
  }

  return useQuery({
    queryKey: ['sessions', date || 'today'],
    queryFn: () => fetchApi<SessionListResponse>(`/sessions?${params.toString()}`, undefined, DASHBOARD_API_BASE),
    refetchInterval: 30000
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ['session', id],
    queryFn: () => fetchApi<Session>(`/sessions/${id}`, undefined, DASHBOARD_API_BASE),
    enabled: !!id
  });
}

export function useSessionMessages(id: string) {
  return useQuery({
    queryKey: ['session', id, 'messages'],
    queryFn: () => fetchApi<Message[]>(`/sessions/${id}/messages`, undefined, DASHBOARD_API_BASE),
    enabled: !!id
  });
}

// Actions
export async function toggleBookmark(id: string, note?: string): Promise<Session> {
  const response = await fetch(`${DASHBOARD_API_BASE}/sessions/${id}/bookmark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: note ? JSON.stringify({ note }) : undefined
  });

  const data = await response.json() as ApiResponse<Session>;
  if (!data.success) {
    throw new Error(data.error || 'Failed to toggle bookmark');
  }
  return data.data!;
}

export async function deleteSession(id: string): Promise<void> {
  const response = await fetch(`${DASHBOARD_API_BASE}/sessions/${id}`, {
    method: 'DELETE'
  });

  const data = await response.json() as ApiResponse<{ deleted: boolean }>;
  if (!data.success) {
    throw new Error(data.error || 'Failed to delete session');
  }
}
