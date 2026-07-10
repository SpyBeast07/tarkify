import { z } from 'zod';

export const paymentStatusSchema = z.enum(['created', 'paid', 'failed', 'refunded']);

export const paymentListParamsSchema = z.object({
  search: z.string().optional(),
  status: paymentStatusSchema.optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  customer: z.string().optional(),
  product: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'amount', 'status']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
});
