/**
 * Shared utility functions for amount/number parsing and validation
 * Used across finance, projects, and other services
 */

/**
 * Parse a value (string, number, null, undefined) to a number
 * Handles various edge cases like empty strings, dashes, N/A, etc.
 */
export function parseAmount(value: string | number | null | undefined): number {
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return 0;

  const str = String(value).trim();
  
  // Handle empty values and common placeholders
  if (
    str === "" ||
    str === "-" ||
    str === " - " ||
    str === "—" ||
    str.toLowerCase() === "n/a"
  ) {
    return 0;
  }

  // Remove non-numeric characters except dots and dashes, then remove commas
  const cleaned = str.replace(/[^\d.-]/g, "").replace(/,/g, "");
  const parsed = Number(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Safely convert a value to a number, handling both number and string types
 * Returns 0 for invalid/null/undefined values
 */
export function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return 0;
  
  const numValue = parseFloat(String(value));
  return isNaN(numValue) ? 0 : numValue;
}

/**
 * Validate and normalize amount to ensure it fits within database decimal limits
 * @param value - The value to validate
 * @param maxValue - Maximum allowed value (default: 9999999999999.99 for decimal(15,2))
 * @param precision - Number of decimal places (default: 2)
 * @returns Normalized amount clamped to valid range
 */
export function validateAndNormalizeAmount(
  value: number | string | null | undefined,
  maxValue: number = 9999999999999.99,
  precision: number = 2
): number {
  if (value === null || value === undefined) return 0;
  
  const numValue = toNumber(value);
  if (numValue === 0) return 0;
  
  const minValue = -maxValue;
  
  if (numValue > maxValue) {
    console.warn(`Amount ${numValue} exceeds maximum value ${maxValue}, capping to maximum`);
    return maxValue;
  }
  
  if (numValue < minValue) {
    console.warn(`Amount ${numValue} is below minimum value ${minValue}, capping to minimum`);
    return minValue;
  }
  
  // Round to specified decimal places
  const multiplier = Math.pow(10, precision);
  return Math.round(numValue * multiplier) / multiplier;
}

/**
 * Extract amount from a transaction object
 * Handles both number and string types safely
 */
export function extractTransactionAmount(transaction: { amount: number | string }): number {
  return toNumber(transaction.amount);
}

/**
 * Sum amounts from an array of objects with amount properties
 * @param items - Array of objects with amount property
 * @param getAmount - Optional function to extract amount (default: extractTransactionAmount)
 */
export function sumAmounts<T extends { amount: number | string }>(
  items: T[],
  getAmount: (item: T) => number = (item) => extractTransactionAmount(item)
): number {
  return items.reduce((sum, item) => {
    const amount = getAmount(item);
    return sum + amount;
  }, 0);
}

