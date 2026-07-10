import { API_BASE } from '$lib/api/config';

const REQUEST_TIMEOUT_MS = 15_000;

export class AdminApiError extends Error {
	status: number;
	code: string;

	constructor(status: number, code: string, message: string) {
		super(message);
		this.name = 'AdminApiError';
		this.status = status;
		this.code = code;
	}
}

export async function adminFetch<T>(
	path: string,
	options: RequestInit = {}
): Promise<T> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const response = await fetch(`${API_BASE}/api/admin${path}`, {
			credentials: 'include',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				...options.headers
			},
			signal: controller.signal,
			...options
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			let code = 'UNKNOWN_ERROR';
			let message = 'Request failed';
			try {
				const body = await response.json();
				code = body.error || code;
				message = body.message || message;
			} catch {
				if (response.status === 401) message = 'Authentication required';
				if (response.status === 403) message = 'Insufficient permissions';
				if (response.status === 404) message = 'Not found';
			}
			throw new AdminApiError(response.status, code, message);
		}

		return response.json();
	} catch (err) {
		clearTimeout(timeoutId);
		if (err instanceof AdminApiError) throw err;
		if (err instanceof DOMException && err.name === 'AbortError') {
			throw new AdminApiError(0, 'TIMEOUT', 'Request timed out');
		}
		throw new AdminApiError(0, 'NETWORK_ERROR', 'Network error');
	}
}
