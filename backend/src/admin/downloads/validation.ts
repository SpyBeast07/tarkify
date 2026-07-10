import { z } from 'zod';

export const downloadTokenStatusSchema = z.enum(['active', 'expired', 'revoked']);

export const downloadListParamsSchema = z.object({
  search: z.string().optional(),
  status: downloadTokenStatusSchema.optional(),
  product: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'expires', 'downloads']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
});
