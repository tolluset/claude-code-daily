import type { ApiResponse } from './index';

/**
 * Default API base URL for server connections
 * CLI uses full URL, Dashboard uses relative path (proxied by Vite)
 */
export const API_BASE = 'http://localhost:3847/api/v1';

/**
 * Fetches data from the API with standardized error handling
 * @param endpoint - API endpoint path (e.g., '/sessions')
 * @param options - Fetch options
 * @param baseUrl - Optional base URL override (defaults to API_BASE)
 * @returns Parsed response data
 * @throws Error if request fails or API returns error
 */
/**
 * Fetches data from the API with standardized error handling.
 *
 * IMPORTANT: This function unwraps ApiResponse<T> and returns only the data (T).
 *
 * @example
 * // Correct: fetchApi<ActualDataType>()
 * const sessions = await fetchApi<Session[]>('/sessions');
 *
 * // Incorrect: fetchApi<ApiResponse<ActualDataType>>()
 * const response = await fetchApi<ApiResponse<Session[]>>('/sessions');
 * // This will cause type mismatch! response is already Session[], not ApiResponse<Session[]>
 *
 * @template T - The type of the data field in the API response
 * @param endpoint - API endpoint path (e.g., '/sessions')
 * @param options - Optional fetch RequestInit options
 * @param baseUrl - Base URL for the API (defaults to API_BASE)
 * @returns Promise resolving to the unwrapped data (T), not ApiResponse<T>
 */

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
  baseUrl: string = API_BASE
): Promise<T> {
  const response = await fetch(`${baseUrl}${endpoint}`, options);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  const data = await response.json() as ApiResponse<T>;
  if (!data.success) {
    throw new Error(data.error || 'Unknown error');
  }
  return data.data!;
}

/**
 * Checks if the API server is reachable
 * @param baseUrl - Optional base URL override (defaults to API_BASE)
 * @param timeoutMs - Timeout in milliseconds (default: 2000)
 * @returns true if server responds, false otherwise
 */
export async function checkServerHealth(
  baseUrl: string = API_BASE,
  timeoutMs: number = 2000
): Promise<boolean> {
  try {
    await fetch(`${baseUrl}/health`, {
      signal: AbortSignal.timeout(timeoutMs)
    });
    return true;
  } catch {
    return false;
  }
}
