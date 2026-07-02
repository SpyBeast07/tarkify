/**
 * Checks if a string is non-empty after trimming.
 */
export function validateRequired(value: string): boolean {
	return value.trim().length > 0;
}

/**
 * Validates email format using the project's standard rules:
 * - Trims whitespace
 * - Max length of 320 characters
 * - Rejects empty inputs
 * - Rejects consecutive dots (..)
 * - Enforces an alphabetic TLD (min 2 chars)
 */
export function validateEmail(email: string): boolean {
	const trimmed = email.trim();
	if (!trimmed) return false;
	if (trimmed.length > 320) return false;
	if (trimmed.includes('..')) return false;
	return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(trimmed.toLowerCase());
}
