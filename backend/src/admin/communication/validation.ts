import { z } from 'zod';

export const communicationStatusSchema = z.enum(['NEW', 'READ', 'REPLIED', 'ARCHIVED']);

export const recordTypeSchema = z.enum(['contact', 'feedback', 'newsletter', 'careers']);

export const communicationListParamsSchema = z.object({
  search: z.string().optional(),
  status: communicationStatusSchema.optional(),
  archived: z.enum(['true', 'false']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'status', 'updated']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const statusUpdateSchema = z.object({
  status: communicationStatusSchema,
});

export const replySchema = z.object({
  subject: z.string().min(1).max(512),
  message: z.string().min(1).max(10000),
});

export const noteCreateSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const tagCreateSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#6366f1'),
});

export const tagAssignSchema = z.object({
  tag_id: z.string().uuid(),
});
