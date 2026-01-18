/**
 * Validates that required fields are present in the request body
 * @param body - The request body object to validate
 * @param fields - Array of required field names
 * @returns Validation result with missing fields if invalid
 */
export function validateRequired<T extends object>(
  body: T,
  fields: (keyof T)[]
): { valid: true } | { valid: false; missing: string[] } {
  const missing = fields.filter(f => !body[f]);
  if (missing.length > 0) {
    return { valid: false, missing: missing.map(String) };
  }
  return { valid: true };
}
