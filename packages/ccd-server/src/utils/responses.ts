import { Context } from 'hono';
import type { ApiResponse } from '@ccd/types';
import { ApiError } from './errors';

/**
 * Creates a successful API response
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data
  };
}

/**
 * Creates an error API response
 */
export function errorResponse(message: string): ApiResponse<null> {
  return {
    success: false,
    error: message
  };
}

/**
 * Creates a not found response
 */
export function notFoundResponse(resource = 'Resource'): ApiResponse<null> {
  return errorResponse(`${resource} not found`);
}

/**
 * Hono middleware for consistent API error handling
 */
export function apiErrorHandler() {
  return async (c: Context, next: () => Promise<void>) => {
    try {
      await next();
    } catch (error) {
      if (error instanceof ApiError) {
        const statusCode = error.statusCode === 400 ? 400 :
                          error.statusCode === 404 ? 404 :
                          error.statusCode === 500 ? 500 : 500;
        return c.json(errorResponse(error.message), statusCode);
      }

      console.error('[API Error]', error);
      return c.json(errorResponse('Internal server error'), 500);
    }
  };
}