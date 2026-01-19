import { useQuery } from '@tanstack/react-query';
import {
  fetchApi,
  type TodayStatsResponse,
  type SessionListResponse,
  type Session,
  type Message,
  type ApiResponse,
  type DailyStats,
  type SearchResult,
  type SessionInsight,
  type CreateInsightRequest,
  type UpdateInsightNotesRequest,
  type DailyReportData
} from '@ccd/types';

// Dashboard uses relative path (Vite proxies to actual server)
const DASHBOARD_API_BASE = '/api/v1';

// Hooks
export function useTodayStats() {
  return useQuery({
    queryKey: ['stats', 'today'],
    queryFn: () => fetchApi<TodayStatsResponse>('/stats/today', undefined, DASHBOARD_API_BASE)
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
      const response = await fetchApi<DailyStats[]>(`/stats/daily${queryString ? `?${queryString}` : ''}`, undefined, DASHBOARD_API_BASE);
      return response ?? [];
    }
  });
}

export function useSessions(date?: string, from?: string, to?: string, project?: string) {
  const params = new URLSearchParams();
  if (date) {
    params.set('date', date);
  } else if (!from && !to) {
    // Only default to today if no date range is specified
    params.set('today', 'true');
  }
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (project) params.set('project', project);

  const queryString = params.toString();
  const queryKey = ['sessions', date || 'today', from, to, project];

  return useQuery({
    queryKey,
    queryFn: () => fetchApi<SessionListResponse>(`/sessions?${queryString}`, undefined, DASHBOARD_API_BASE)
  });
}

export function useSession(id: string) {
  return useQuery<Session | null>({
    queryKey: ['session', id],
    queryFn: () => fetchApi<Session>(`/sessions/${id}`, undefined, DASHBOARD_API_BASE),
    enabled: !!id,
    select: (data) => {
      if (!data || typeof data !== 'object') {
        console.error('Invalid session data:', data);
        return null;
      }
      return data;
    }
  });
}

export function useSessionMessages(id: string) {
  return useQuery({
    queryKey: ['session', id, 'messages'],
    queryFn: () => fetchApi<Message[]>(`/sessions/${id}/messages`, undefined, DASHBOARD_API_BASE),
    enabled: !!id,
    select: (data) => {
      if (!Array.isArray(data)) {
        console.error('Invalid messages data:', data);
        return [];
      }
      return data;
    }
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
  if (!data.data) {
    throw new Error('No data returned');
  }
  return data.data;
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
      if (import.meta.env.DEV) {
        console.log('Calling search API with URL:', `${DASHBOARD_API_BASE}/search?${params}`);
      }
      try {
        const response = await fetchApi<SearchResult[]>(`/search?${params}`, undefined, DASHBOARD_API_BASE);
        if (import.meta.env.DEV) {
          console.log('Search API response:', response);
          console.log('Response data type:', typeof response);
          console.log('Response data length:', response?.length);
        }
        return response ?? [];
      } catch (error: unknown) {
        if (import.meta.env.DEV) {
          console.error('Search API error:', error);
        }
        throw error;
      }
    },
    enabled: !!query && query.length > 0
  });
}

// Session Insights hooks
export function useSessionInsight(sessionId: string | undefined) {
  return useQuery<SessionInsight | null>({
    queryKey: ['insight', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      try {
        const response = await fetchApi<SessionInsight>(`/insights/${sessionId}`, undefined, DASHBOARD_API_BASE);
        return response;
      } catch (error: unknown) {
        // Return null if insight doesn't exist (404)
        console.log('Insight fetch error:', error); // Debug logging
        if (error instanceof Error && (
          error.message?.includes('not found') ||
          error.message?.includes('404') ||
          error.message?.includes('Not Found')
        )) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!sessionId,
    retry: false
  });
}

export async function createOrUpdateInsight(data: CreateInsightRequest): Promise<SessionInsight> {
  const response = await fetch(`${DASHBOARD_API_BASE}/insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const result = await response.json() as ApiResponse<SessionInsight>;
  if (!result.success) {
    throw new Error(result.error || 'Failed to create/update insight');
  }
  if (!result.data) {
    throw new Error('No data returned');
  }
  return result.data;
}

export async function updateInsightNotes(sessionId: string, notes: string): Promise<void> {
  const response = await fetch(`${DASHBOARD_API_BASE}/insights/${sessionId}/notes`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes } as UpdateInsightNotesRequest)
  });

  const result = await response.json() as ApiResponse<void>;
  if (!result.success) {
    throw new Error(result.error || 'Failed to update notes');
  }
}

export async function deleteInsight(sessionId: string): Promise<void> {
  const response = await fetch(`${DASHBOARD_API_BASE}/insights/${sessionId}`, {
    method: 'DELETE'
  });

  const result = await response.json() as ApiResponse<void>;
  if (!result.success) {
    throw new Error(result.error || 'Failed to delete insight');
  }
}

export function useDailyReport(date?: string) {
  return useQuery({
    queryKey: ['daily-report', date],
    queryFn: async () => {
      const params = date ? `?date=${date}` : '';
      return fetchApi<DailyReportData>(`/daily-report${params}`, undefined, DASHBOARD_API_BASE);
    }
  });
}
