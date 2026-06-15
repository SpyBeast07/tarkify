import { discoverData } from '$lib/data/discover';

export const prerender = true;

export function entries() {
	return discoverData.map((a) => ({ slug: a.slug }));
}
