import { z } from 'zod';
import { SEARCH_MODULES } from './types.js';

const moduleEnum = [...SEARCH_MODULES, 'all'] as unknown as [string, ...string[]];

export const searchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, 'Search query is required')
    .max(200, 'Search query is too long'),
  module: z.enum(moduleEnum).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
  sort: z.enum(['relevance', 'newest']).optional().default('relevance')
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
