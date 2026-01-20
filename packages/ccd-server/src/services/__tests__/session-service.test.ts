import { describe, it, expect, beforeEach, vi } from 'bun:test';
import { SessionService } from '../session-service';
import { TestDataFactory } from '../../__mocks__/test-helpers';

// Mock database
vi.mock('../db/queries', () => ({
  getSession: vi.fn(),
  createSession: vi.fn(),
  getSessions: vi.fn(),
  getTodaySessions: vi.fn(),
  endSession: vi.fn(),
  toggleBookmark: vi.fn(),
  deleteSession: vi.fn(),
  getMessages: vi.fn(),
  incrementSessionCount: vi.fn(),
  updateSessionSummary: vi.fn()
}));

describe('SessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSession', () => {
    it('should return session when found', () => {
      const mockSession = TestDataFactory.createMockSession();
      const { getSession } = require('../db/queries');
      getSession.mockReturnValue(mockSession);

      const result = SessionService.getSession('test-id');

      expect(result).toEqual(mockSession);
      expect(getSession).toHaveBeenCalledWith('test-id');
    });

    it('should throw error when session not found', () => {
      const { getSession } = require('../db/queries');
      getSession.mockReturnValue(null);

      expect(() => SessionService.getSession('test-id')).toThrow('Session not found');
    });
  });

  describe('createSession', () => {
    it('should create session with valid data', () => {
      const request = TestDataFactory.createCreateSessionRequest();
      const mockSession = TestDataFactory.createMockSession();
      const { createSession, incrementSessionCount } = require('../db/queries');

      createSession.mockReturnValue(mockSession);

      const result = SessionService.createSession(request);

      expect(result).toEqual(mockSession);
      expect(createSession).toHaveBeenCalledWith(request);
      expect(incrementSessionCount).toHaveBeenCalled();
    });

    it('should throw error for invalid data', () => {
      const invalidRequest = { session_id: 'test' }; // Missing required fields

      expect(() => SessionService.createSession(invalidRequest as any)).toThrow('Missing required fields');
    });
  });
});