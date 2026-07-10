import { z } from 'zod';
import type { AnalyticsRange, DateRange } from './types.js';

export const analyticsQuerySchema = z.object({
  range: z.enum(['today', 'week', 'month', 'year', 'custom']).optional().default('month'),
  start: z.string().optional(),
  end: z.string().optional(),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;

export interface ResolvedRange extends DateRange {
  range: AnalyticsRange;
  bucket: 'hour' | 'day' | 'month';
}

const DAY = 86_400_000;

export function resolveRange(range: AnalyticsRange, start?: string, end?: string): ResolvedRange {
  const now = new Date();

  if (range === 'custom') {
    const s = start ? new Date(start) : new Date(now.getTime() - 30 * DAY);
    const e = end ? new Date(end) : now;
    const spanDays = (e.getTime() - s.getTime()) / DAY;
    return { range, start: s, end: e, bucket: spanDays > 90 ? 'month' : 'day' };
  }

  if (range === 'today') {
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    return { range, start: s, end: now, bucket: 'hour' };
  }

  if (range === 'week') {
    const s = new Date(now.getTime() - 7 * DAY);
    return { range, start: s, end: now, bucket: 'day' };
  }

  if (range === 'year') {
    const s = new Date(now.getTime() - 365 * DAY);
    return { range, start: s, end: now, bucket: 'month' };
  }

  const s = new Date(now.getTime() - 30 * DAY);
  return { range, start: s, end: now, bucket: 'day' };
}
