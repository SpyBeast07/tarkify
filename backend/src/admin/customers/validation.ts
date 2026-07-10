import { z } from 'zod';

export const accountStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']);

export const customerListParamsSchema = z.object({
  search: z.string().optional(),
  status: accountStatusSchema.optional(),
  emailVerified: z.coerce.boolean().optional(),
  oauth: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'name', 'last_login', 'purchases']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
});
