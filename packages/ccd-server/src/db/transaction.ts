import { db } from './index';

/**
 * Executes a synchronous operation within a database transaction
 * @param operation - The operation to execute within the transaction
 * @param operationName - Name of the operation for logging (optional)
 * @returns The result of the operation
 * @throws Error if transaction fails
 */
export function withTransaction<T>(
  operation: () => T,
  operationName?: string
): T {
  const transaction = db.transaction(() => {
    try {
      const result = operation();
      if (operationName) {
        console.log(`[DB Transaction] ${operationName} completed successfully`);
      }
      return result;
    } catch (error) {
      console.error(`[DB Transaction] ${operationName || 'Operation'} failed:`, error);
      throw error;
    }
  });

  return transaction();
}

/**
 * Executes an asynchronous operation within a database transaction
 * @param operation - The async operation to execute within the transaction
 * @param operationName - Name of the operation for logging (optional)
 * @returns Promise resolving to the result of the operation
 * @throws Error if transaction fails
 */
export async function withAsyncTransaction<T>(
  operation: () => Promise<T>,
  operationName?: string
): Promise<T> {
  const transaction = db.transaction(async () => {
    try {
      const result = await operation();
      if (operationName) {
        console.log(`[DB Transaction] ${operationName} completed successfully`);
      }
      return result;
    } catch (error) {
      console.error(`[DB Transaction] ${operationName || 'Async operation'} failed:`, error);
      throw error;
    }
  });

  return await transaction();
}

/**
 * Safely executes a database operation with automatic transaction rollback on failure
 * @param operation - The operation to execute
 * @param operationName - Name of the operation for logging
 * @returns The result of the operation
 */
export function withDbOperation<T>(
  operation: () => T,
  operationName: string
): T {
  try {
    return operation();
  } catch (error) {
    console.error(`[DB Operation] ${operationName} failed:`, error);
    throw error;
  }
}