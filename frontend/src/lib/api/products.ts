/**
 * Products API Client
 *
 * Fetches product data from the backend API.
 * The backend is the source of truth for pricing.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3009';

export interface ProductFromApi {
	slug: string;
	name: string;
	description: string | null;
	type: 'ONE_TIME' | 'SUBSCRIPTION';
	price: number;
	currency: string;
}

/**
 * Fetch product details (including price) from the backend API.
 * Returns null if the product is not found or inactive.
 */
export async function fetchProduct(slug: string): Promise<ProductFromApi | null> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 10_000);

	try {
		const response = await fetch(`${API_BASE}/api/products/${slug}`, {
			signal: controller.signal
		});

		if (!response.ok) {
			if (response.status === 404) return null;
			throw new Error(`Failed to fetch product: ${response.status}`);
		}

		const body: { product: ProductFromApi } & Record<string, unknown> = await response.json();

		if (!body.product) {
			throw new Error('Invalid product response format');
		}

		return body.product;
	} catch (error) {
		if (error instanceof DOMException && error.name === 'AbortError') {
			console.warn('Product fetch timed out');
			return null;
		}
		console.error('Failed to fetch product:', error);
		return null;
	} finally {
		clearTimeout(timeoutId);
	}
}
