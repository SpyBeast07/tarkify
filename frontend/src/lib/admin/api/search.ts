import { adminFetch } from './client';
import type { SearchModule, SearchResponse, SearchOptions } from '$lib/admin/types/search';

export async function searchGlobal(
	q: string,
	module?: SearchModule | 'all',
	page?: number,
	perPage?: number,
	sort?: 'relevance' | 'newest'
): Promise<SearchResponse> {
	const params = new URLSearchParams();
	if (q) params.set('q', q);
	if (module && module !== 'all') params.set('module', module);
	if (page) params.set('page', String(page));
	if (perPage) params.set('perPage', String(perPage));
	if (sort) params.set('sort', sort);
	return adminFetch<SearchResponse>(`/search?${params}`);
}

export async function getSearchOptions(): Promise<SearchOptions> {
	return adminFetch<SearchOptions>('/search/options');
}