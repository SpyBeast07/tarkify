import { z } from 'zod';

export const systemQuerySchema = z.object({});

export type SystemQuery = z.infer<typeof systemQuerySchema>;
