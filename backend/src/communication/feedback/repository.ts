import { query } from '../../db.js';
import type { FeedbackRecord } from './types.js';

export async function insertFeedback(
  name: string | null,
  email: string | null,
  product: string,
  rating: number,
  message: string,
  ip: string | null,
  userAgent: string | null
): Promise<FeedbackRecord> {
  const result = await query<FeedbackRecord>(
    `INSERT INTO feedback (name, email, product, rating, message, submitted_from_ip, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, email, product, rating, message, ip, userAgent]
  );
  return result.rows[0];
}
