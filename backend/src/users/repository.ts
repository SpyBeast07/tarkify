import { query } from '../db.js';
import type { TarkifyUser, Role, AccountStatus } from './types.js';

export async function getUserById(id: string): Promise<TarkifyUser | null> {
  const result = await query<TarkifyUser>(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] ?? null;
}

export async function getUserByEmail(email: string): Promise<TarkifyUser | null> {
  const result = await query<TarkifyUser>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] ?? null;
}

export async function updateProfile(
  id: string,
  data: { displayName?: string; timezone?: string }
): Promise<TarkifyUser | null> {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (data.displayName !== undefined) {
    setClauses.push(`display_name = $${paramIndex++}`);
    params.push(data.displayName);
  }

  if (data.timezone !== undefined) {
    setClauses.push(`timezone = $${paramIndex++}`);
    params.push(data.timezone);
  }

  if (setClauses.length === 0) {
    return getUserById(id);
  }

  setClauses.push(`updated_at = NOW()`);
  params.push(id);

  const result = await query<TarkifyUser>(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    params
  );
  return result.rows[0] ?? null;
}

export async function updatePreferences(
  id: string,
  preferences: Record<string, unknown>
): Promise<TarkifyUser | null> {
  const result = await query<TarkifyUser>(
    `UPDATE users SET preferences = $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [JSON.stringify(preferences), id]
  );
  return result.rows[0] ?? null;
}

export async function updateEmailPreferences(
  id: string,
  emailPrefs: Record<string, boolean>,
): Promise<TarkifyUser | null> {
  const result = await query<TarkifyUser>(
    `UPDATE users
     SET preferences = jsonb_set(preferences, '{email}', $1::jsonb, true),
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [JSON.stringify(emailPrefs), id],
  );
  return result.rows[0] ?? null;
}

export async function updateLastActivity(id: string): Promise<void> {
  await query(
    'UPDATE users SET last_activity_at = NOW() WHERE id = $1',
    [id]
  );
}

export async function batchUpdateLastActivity(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
  await query(
    `UPDATE users SET last_activity_at = NOW() WHERE id IN (${placeholders})`,
    ids
  );
}

export async function updateLastLogin(id: string): Promise<void> {
  await query(
    'UPDATE users SET last_login_at = NOW(), last_activity_at = NOW() WHERE id = $1',
    [id]
  );
}

export async function changeRole(id: string, role: Role): Promise<TarkifyUser | null> {
  const result = await query<TarkifyUser>(
    'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [role, id]
  );
  return result.rows[0] ?? null;
}

export async function changeAccountStatus(id: string, status: AccountStatus): Promise<TarkifyUser | null> {
  const result = await query<TarkifyUser>(
    'UPDATE users SET account_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0] ?? null;
}
