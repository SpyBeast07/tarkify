import { query } from '../../db.js';
import type { ContactMessage } from './types.js';

export async function insertContactMessage(
  name: string,
  email: string,
  company: string | null,
  subject: string,
  message: string,
  ip: string | null,
  userAgent: string | null
): Promise<ContactMessage> {
  const result = await query<ContactMessage>(
    `INSERT INTO contact_messages (name, email, company, subject, message, submitted_from_ip, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, email, company, subject, message, ip, userAgent]
  );
  return result.rows[0];
}
