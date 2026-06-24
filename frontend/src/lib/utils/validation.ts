/**
 * Checks if a string is non-empty after trimming.
 */
export function validateRequired(value: string): boolean {
	return value.trim().length > 0;
}

/**
 * Validates email format using the project's standard regex template.
 */
export function validateEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email);
}
