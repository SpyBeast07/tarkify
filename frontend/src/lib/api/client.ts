/**
 * Unified API Client for submitting forms to Tarkify endpoints.
 *
 * Sends form submissions (Contact, Feedback, Careers, Newsletter)
 * to the backend API for storage and processing.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3009';

export interface FeedbackSubmission {
	firstName: string;
	lastName: string;
	email: string;
	product: string;
	feedbackType: string;
	rating: number;
	message: string;
}

export interface ContactSubmission {
	firstName: string;
	lastName: string;
	email: string;
	company?: string;
	service?: string;
	message: string;
}

export interface CareersSubmission {
	name: string;
	email: string;
	phone: string;
	role: string;
	cvLink: string;
	linkedin: string;
	portfolio: string;
	message: string;
}

export interface NewsletterSubmission {
	email: string;
}

/**
 * General form submission helper with timeout.
 */
async function submitForm<T>(endpoint: string, data: T): Promise<{ success: boolean; message: string }> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 15_000); // 15s timeout

	try {
		const response = await fetch(`${API_BASE}/api/forms/${endpoint}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			signal: controller.signal,
		});

		const result = await response.json();

		if (!response.ok) {
			throw new Error(result.message || 'Request failed');
		}

		return result;
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') {
			throw new Error('Request timed out. Please try again.');
		}
		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
}

/**
 * Submits product feedback.
 */
export async function submitFeedback(data: FeedbackSubmission): Promise<{ success: boolean; message: string }> {
	return submitForm('feedback', data);
}

/**
 * Submits a contact inquiry.
 */
export async function submitContact(data: ContactSubmission): Promise<{ success: boolean; message: string }> {
	return submitForm('contact', data);
}

/**
 * Submits a job application.
 */
export async function submitCareers(data: CareersSubmission): Promise<{ success: boolean; message: string }> {
	return submitForm('careers', data);
}

/**
 * Submits a newsletter subscription.
 */
export async function submitNewsletter(email: string): Promise<{ success: boolean; message: string }> {
	return submitForm('newsletter', { email });
}
