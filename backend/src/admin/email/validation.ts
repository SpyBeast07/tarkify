import { z } from 'zod';

export const emailListParamsSchema = z.object({
  search: z.string().optional(),
  status: z
    .enum(['sent', 'failed', 'logged', 'skipped', 'queued', 'retrying'])
    .optional(),
  template: z.string().optional(),
  provider: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sort: z.enum(['newest', 'oldest']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const testEmailSchema = z.object({
  recipient: z.string().email(),
  template: z.string().optional(),
  message: z.string().max(5000).optional(),
});

export const resendSchema = z.object({});
