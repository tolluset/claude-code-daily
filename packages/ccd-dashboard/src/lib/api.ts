import { useQuery } from '@tanstack/react-query';
import {
  fetchApi,
  type TodayStatsResponse,
  type SessionListResponse,
  type Session,
  type Message,
  type ApiResponse,
  type DailyStats,
  type SearchResult
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

export function useDailyStats(from?: string, to?: string, days?: number, project?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (days) params.set('days', String(days));
  if (project) params.set('project', project);

  const queryString = params.toString();
  const queryKey = ['stats', 'daily', queryString];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetchApi<ApiResponse<DailyStats[]>>(`/stats/daily${queryString ? `?${queryString}` : ''}`, undefined, DASHBOARD_API_BASE);
      return response.data || [];
    },
    refetchInterval: 30000
  });
}

export function useSessions(date?: string, from?: string, to?: string, project?: string) {
  const params = new URLSearchParams();
  if (date) {
    params.set('date', date);
  } else {
    params.set('today', 'true');
  }
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (project) params.set('project', project);

  const queryString = params.toString();

  return useQuery({
    queryKey: ['sessions', date || 'today', from, to, project],
    queryFn: () => fetchApi<SessionListResponse>(`/sessions?${queryString}`, undefined, DASHBOARD_API_BASE),
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

export function useSearchResults(
  query?: string,
  from?: string,
  to?: string,
  project?: string,
  bookmarked?: boolean,
  limit?: number
) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (project) params.set('project', project);
  if (bookmarked) params.set('bookmarked', 'true');
  if (limit) params.set('limit', String(limit));

  return useQuery({
    queryKey: ['search', query, from, to, project, bookmarked, limit],
    queryFn: async () => {
      console.log('Calling search API with URL:', `${DASHBOARD_API_BASE}/search?${params}`);
      try {
        const response = await fetchApi<ApiResponse<SearchResult[]>>(`/search?${params}`, undefined, DASHBOARD_API_BASE);
        console.log('Search API response:', response);
        console.log('Response data:', response.data);
        console.log('Response data type:', typeof response.data);
        console.log('Response data length:', response.data?.length);
        return response.data ?? [];
      } catch (error) {
        console.error('Search API error:', error);
        throw error;
      }
    },
    enabled: !!query && query.length > 0,
    retry: 1,
    staleTime: 0, // Disable caching
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });
}

// Streak stats hook
export function useStreakStats() {
  return useQuery({
    queryKey: ['streak'],
    queryFn: async () => {
      const response = await fetchApi<ApiResponse<StreakStats>>('/stats/streak', undefined, DASHBOARD_API_BASE);
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5 // 5 minutes cache
  });
}
