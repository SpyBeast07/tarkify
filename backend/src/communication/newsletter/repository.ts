import { query } from '../../db.js';
import type { NewsletterSubscriber } from './types.js';

export async function findActiveSubscriber(email: string): Promise<NewsletterSubscriber | null> {
  const result = await query<NewsletterSubscriber>(
    `SELECT * FROM newsletter_subscribers
     WHERE email = $1 AND archived_at IS NULL
     LIMIT 1`,
    [email]
  );
  return result.rows[0] ?? null;
}

export async function tryInsertSubscriber(
  email: string,
  ip: string | null,
  userAgent: string | null
): Promise<NewsletterSubscriber | null> {
  const result = await query<NewsletterSubscriber>(
    `INSERT INTO newsletter_subscribers (email, submitted_from_ip, user_agent)
     VALUES ($1, $2, $3)
     ON CONFLICT (email) WHERE archived_at IS NULL
     DO NOTHING
     RETURNING *`,
    [email, ip, userAgent]
  );
  return result.rows[0] ?? null;
}
