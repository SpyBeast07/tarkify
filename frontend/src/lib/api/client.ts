/**
 * Unified API Client for submitting forms to Tarkify endpoints.
 *
 * NOTE: Backend communication for Contact, Feedback, Careers, and Newsletter
 * is not yet active. These handlers return a service unavailable rejection
 * to allow frontends to display appropriate loading and error states cleanly
 * until the backend endpoints are connected.
 */

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

// Configured API BASE URL (reserved for future connection)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Helper to simulate network latency and return a service unavailable rejection.
 */
async function simulateServiceUnavailable(): Promise<never> {
	// Simulate minor network latency so the user can verify loading states and spinners
	await new Promise((resolve) => setTimeout(resolve, 800));
	throw new Error('Service temporarily unavailable');
}

/**
 * Submits product feedback.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function submitFeedback(data: FeedbackSubmission): Promise<Response> {
	return simulateServiceUnavailable();
}

/**
 * Submits a contact inquiry.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function submitContact(data: ContactSubmission): Promise<Response> {
	return simulateServiceUnavailable();
}

/**
 * Submits a job application.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function submitCareers(data: CareersSubmission): Promise<Response> {
	return simulateServiceUnavailable();
}

/**
 * Submits a newsletter subscription.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function submitNewsletter(email: string): Promise<Response> {
	return simulateServiceUnavailable();
}
