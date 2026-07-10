export type SearchModule =
  | 'products'
  | 'orders'
  | 'customers'
  | 'emails'
  | 'contact'
  | 'feedback'
  | 'newsletter'
  | 'careers'
  | 'audit';

export const SEARCH_MODULES: SearchModule[] = [
  'products',
  'orders',
  'customers',
  'emails',
  'contact',
  'feedback',
  'newsletter',
  'careers',
  'audit'
];

export const SEARCH_MODULE_LABELS: Record<SearchModule, string> = {
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

export interface SearchResult {
  id: string;
  module: SearchModule;
  title: string;
  subtitle: string;
  description: string;
  matchedField: string;
  matchedText: string;
  relevance: number;
  timestamp: string;
  targetUrl: string;
}

export interface SearchParams {
  q: string;
  module?: SearchModule | 'all';
  page?: number;
  perPage?: number;
  sort?: 'relevance' | 'newest';
}

export interface SearchResponse {
  query: string;
  module: SearchModule | 'all';
  results: SearchResult[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  counts: Record<SearchModule, number>;
}

export interface SearchOptions {
  modules: { value: SearchModule; label: string }[];
}
