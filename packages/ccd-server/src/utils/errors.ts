import type { ApiResponse } from '@ccd/types';

/**
 * Custom API error class for consistent error handling
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Predefined error instances for common scenarios
 */
export const Errors = {
  NotFound: (resource: string) => new ApiError(404, `${resource} not found`),
  BadRequest: (message: string) => new ApiError(400, message),
  ValidationError: (fields: string[]) => new ApiError(400, `Missing required fields: ${fields.join(', ')}`),
  InvalidType: (field: string, expected: string) => new ApiError(400, `${field} must be ${expected}`),
  InternalServerError: (message = 'Unknown error') => new ApiError(500, message),
  DatabaseError: (operation: string) => new ApiError(500, `Database error during ${operation}`),
} as const;

/**
 * Validates required fields and throws ApiError if missing
 */
export function validateRequired<T extends Record<string, unknown>>(
  data: T,
  requiredFields: (keyof T)[]
): void {
  const missing = requiredFields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw Errors.ValidationError(missing.map(String));
  }
}

/**
 * Validates string enum values and throws ApiError if invalid
 */
export function validateStringEnum(
  value: string,
  validValues: readonly string[],
  fieldName: string
): asserts value is string {
  if (!validValues.includes(value)) {
    throw Errors.InvalidType(fieldName, `one of: ${validValues.join(', ')}`);
  }
}

/**
 * Validates date range parameters
 */
export function validateDateRange(from?: string, to?: string): void {
  if (from && to && new Date(from) > new Date(to)) {
    throw Errors.BadRequest('from date cannot be after to date');
  }
}

/**
 * Validates date string format
 */
export function validateDateString(date: string, fieldName: string): void {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    throw Errors.InvalidType(fieldName, 'YYYY-MM-DD format');
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    throw Errors.InvalidType(fieldName, 'valid date');
  }
}

/**
 * Validates positive integer
 */
export function validatePositiveInteger(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw Errors.InvalidType(fieldName, 'positive integer');
  }
}

/**
 * Safely executes a database operation with error handling
 */
export function withDbOperation<T>(
  operation: () => T,
  operationName: string
): T {
  try {
    return operation();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw Errors.DatabaseError(operationName);
  }
}