import { query } from '../../db.js';
import type { CareerApplication } from './types.js';

export async function insertCareerApplication(
  name: string,
  email: string,
  phone: string,
  resumeUrl: string,
  portfolioUrl: string | null,
  coverLetter: string | null,
  ip: string | null,
  userAgent: string | null
): Promise<CareerApplication> {
  const result = await query<CareerApplication>(
    `INSERT INTO career_applications (name, email, phone, resume_url, portfolio_url, cover_letter, submitted_from_ip, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [name, email, phone, resumeUrl, portfolioUrl, coverLetter, ip, userAgent]
  );
  return result.rows[0];
}
