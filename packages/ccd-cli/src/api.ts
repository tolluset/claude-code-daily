import {
  API_BASE,
  fetchApi,
  checkServerHealth as checkHealth,
  type TodayStatsResponse,
  type SessionListResponse,
  type HealthResponse
} from '@ccd/types';

export { checkHealth as checkServerHealth };

export async function getHealth(): Promise<HealthResponse | null> {
  try {
    return await fetchApi<HealthResponse>('/health', undefined, API_BASE);
  } catch {
    return null;
  }
}

export async function getTodayStats(): Promise<TodayStatsResponse | null> {
  try {
    return await fetchApi<TodayStatsResponse>('/stats/today', undefined, API_BASE);
  } catch {
    return null;
  }
}

export async function getTodaySessions(): Promise<SessionListResponse | null> {
  try {
    return await fetchApi<SessionListResponse>('/sessions?today=true', undefined, API_BASE);
  } catch {
    return null;
  }
}
