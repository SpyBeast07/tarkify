/**
 * Unified API Client for the Communication Module.
 *
 * Sends form submissions to the new backend endpoints.
 * Handles all error types: 400, 409, 413, 429, 500, network failures, timeouts.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3009';
const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Parsed API error with both a machine-readable code and a user-friendly message.
 */
export interface ApiError {
	code: string;
	message: string;
}

/**
 * Thrown when the backend returns a non-2xx status.
 */
export class ApiResponseError extends Error {
	code: string;
	status: number;

	constructor(code: string, message: string, status: number) {
		super(message);
		this.name = 'ApiResponseError';
		this.code = code;
		this.status = status;
	}
}

/**
 * Thrown when the request is aborted due to timeout.
 */
export class TimeoutError extends Error {
	constructor() {
		super('Request timed out. Please try again.');
		this.name = 'TimeoutError';
	}
}

/**
 * Thrown when a network error prevents the request from completing.
 */
export class NetworkError extends Error {
	constructor() {
		super('Connection failed. Please check your internet connection and try again.');
		this.name = 'NetworkError';
	}
}

/**
 * Maps HTTP status codes to user-friendly messages when the backend
 * response cannot be parsed.
 */
function fallbackMessage(status: number): string {
	if (status === 413) return 'Message too long. Please shorten your message.';
	if (status === 429) return 'Too many requests. Please wait a moment before trying again.';
	if (status >= 500) return 'Something went wrong. Please try again later.';
	return 'Request failed. Please try again.';
}

/**
 * General form submission helper with timeout and comprehensive error handling.
 */
async function submitForm<T>(
	endpoint: string,
	data: T
): Promise<{ success: true; message: string }> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		let response: Response;
		try {
			response = await fetch(`${API_BASE}/api/${endpoint}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
				signal: controller.signal
			});
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') {
				throw new TimeoutError();
			}
			throw new NetworkError();
		}

		let body: Record<string, unknown>;
		try {
			body = await response.json();
		} catch {
			throw new ApiResponseError('PARSE_ERROR', fallbackMessage(response.status), response.status);
		}

		if (!response.ok) {
			const code = typeof body.error === 'string' ? body.error : 'UNKNOWN_ERROR';
			const message =
				typeof body.message === 'string' ? body.message : fallbackMessage(response.status);
			throw new ApiResponseError(code, message, response.status);
		}

		return { success: true, message: typeof body.message === 'string' ? body.message : 'Success' };
	} finally {
		clearTimeout(timeoutId);
	}
}

// ── Contact ──────────────────────────────────────────────────────

export interface ContactSubmission {
	name: string;
	email: string;
	company?: string;
	subject: string;
	message: string;
}

export async function submitContact(
	data: ContactSubmission
): Promise<{ success: true; message: string }> {
	return submitForm('contact', data);
}

// ── Feedback ──────────────────────────────────────────────────────

export interface FeedbackSubmission {
	name?: string;
	email?: string;
	product: string;
	rating: number;
	message: string;
}

export async function submitFeedback(
	data: FeedbackSubmission
): Promise<{ success: true; message: string }> {
	return submitForm('feedback', data);
}

// ── Newsletter ────────────────────────────────────────────────────

export interface NewsletterSubmission {
	email: string;
}

export async function submitNewsletter(email: string): Promise<{ success: true; message: string }> {
	return submitForm('newsletter', { email });
}

// ── Careers ───────────────────────────────────────────────────────

export interface CareersSubmission {
	name: string;
	email: string;
	phone: string;
	resume_url: string;
	portfolio_url?: string;
	cover_letter?: string;
}

export async function submitCareers(
	data: CareersSubmission
): Promise<{ success: true; message: string }> {
	return submitForm('careers', data);
}
