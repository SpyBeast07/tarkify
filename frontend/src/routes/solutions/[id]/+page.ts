import { solutionsData } from '$lib/data/solutions';

export const prerender = true;

export function entries() {
	return solutionsData.map((s) => ({ id: s.id }));
}
