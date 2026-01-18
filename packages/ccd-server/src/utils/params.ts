/**
 * Parses a string query parameter to an integer
 * @param value - The string value to parse (or undefined)
 * @param defaultValue - Default value if parsing fails or value is undefined
 * @returns Parsed integer or default value
 */
export function parseIntParam(value: string | undefined, defaultValue?: number): number | undefined {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parses a string query parameter to a boolean
 * @param value - The string value to parse (or undefined)
 * @returns true if value is "true", false otherwise
 */
export function parseBoolParam(value: string | undefined): boolean {
  return value === 'true';
}
