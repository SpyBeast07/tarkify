/**
 * Unified API Client for submitting forms to Tarkify endpoints.
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

/**
 * Submits product feedback to the API.
 */
export async function submitFeedback(data: FeedbackSubmission): Promise<Response> {
	return fetch('/api/feedback', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
}

/**
 * Submits a contact inquiry to the API.
 */
export async function submitContact(data: ContactSubmission): Promise<Response> {
	return fetch('/api/contact', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
}
