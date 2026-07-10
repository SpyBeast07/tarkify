import * as repo from './repository.js';
import { SEARCH_MODULES, type SearchModule, type SearchParams, type SearchResponse, type SearchResult } from './types.js';

const MODULE_LABELS: Record<SearchModule, string> = {
  products: 'Products',
  orders: 'Orders',
  customers: 'Customers',
  emails: 'Emails',
  contact: 'Contact',
  feedback: 'Feedback',
  newsletter: 'Newsletter',
  careers: 'Careers',
  audit: 'Audit'
};

export async function search(params: SearchParams): Promise<SearchResponse> {
  const modules: SearchModule[] =
    params.module && params.module !== 'all' ? [params.module] : [...SEARCH_MODULES];

  const arrays = await Promise.all(modules.map((m) => repo.MODULE_SEARCHERS[m](params.q)));
  let all: SearchResult[] = arrays.flat();

  all.sort((a, b) => {
    if (params.sort === 'newest') {
      return b.timestamp.localeCompare(a.timestamp);
    }
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;
    return b.timestamp.localeCompare(a.timestamp);
  });

  const counts = {} as Record<SearchModule, number>;
  for (const m of SEARCH_MODULES) {
    counts[m] = all.filter((r) => r.module === m).length;
  }

  const total = all.length;
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const start = (page - 1) * perPage;
  const results = all.slice(start, start + perPage);

  return {
    query: params.q,
    module: params.module ?? 'all',
    results,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
    counts
  };
}

export async function getOptions(): Promise<{ modules: { value: SearchModule; label: string }[] }> {
  return {
    modules: SEARCH_MODULES.map((m) => ({ value: m, label: MODULE_LABELS[m] }))
  };
}
