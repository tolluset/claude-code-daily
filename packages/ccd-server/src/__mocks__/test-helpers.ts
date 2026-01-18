import type { Session, Message, CreateSessionRequest, CreateMessageRequest } from '@ccd/types';

/**
 * Test utilities for creating mock data
 */
export class TestDataFactory {
  static createMockSession(overrides: Partial<Session> = {}): Session {
    return {
      id: 'test-session-1',
      transcript_path: '/tmp/test/transcript.txt',
      cwd: '/tmp/test',
      project_name: 'test-project',
      git_branch: 'main',
      started_at: '2026-01-19T10:00:00Z',
      ended_at: null,
      is_bookmarked: false,
      bookmark_note: null,
      summary: null,
      ...overrides
    };
  }

  static createMockMessage(overrides: Partial<Message> = {}): Message {
    return {
      id: 1,
      session_id: 'test-session-1',
      uuid: 'test-uuid-1',
      type: 'user',
      content: 'Test message',
      model: 'claude-3',
      input_tokens: 10,
      output_tokens: 20,
      timestamp: '2026-01-19T10:00:00Z',
      ...overrides
    };
  }

  static createCreateSessionRequest(overrides: Partial<CreateSessionRequest> = {}): CreateSessionRequest {
    return {
      session_id: 'test-session-1',
      transcript_path: '/tmp/test/transcript.txt',
      cwd: '/tmp/test',
      project_name: 'test-project',
      git_branch: 'main',
      ...overrides
    };
  }

  static createCreateMessageRequest(overrides: Partial<CreateMessageRequest> = {}): CreateMessageRequest {
    return {
      session_id: 'test-session-1',
      type: 'user',
      content: 'Test message',
      model: 'claude-3',
      input_tokens: 10,
      output_tokens: 20,
      ...overrides
    };
  }
}

/**
 * Test helpers for assertions
 */
export class TestHelpers {
  static expectApiSuccess<T>(response: { success: boolean; data?: T; error?: string }) {
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.error).toBeUndefined();
    return response.data!;
  }

  static expectApiError(response: { success: boolean; data?: any; error?: string }, expectedError?: string) {
    expect(response.success).toBe(false);
    expect(response.data).toBeUndefined();
    expect(response.error).toBeDefined();
    if (expectedError) {
      expect(response.error).toContain(expectedError);
    }
  }

  static async expectStatus(response: Response, status: number) {
    expect(response.status).toBe(status);
  }

  static async expectJsonResponse<T>(response: Response, expectedData?: Partial<T>) {
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data).toBeDefined();
    if (expectedData) {
      Object.entries(expectedData).forEach(([key, value]) => {
        expect((json.data as any)[key]).toBe(value);
      });
    }
    return json.data as T;
  }
}