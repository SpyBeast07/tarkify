import { query, withTransaction } from '../../db.js';
import crypto from 'crypto';
import type { BootstrapAdminUser, AdminAccount } from './types.js';

export async function findAllAdmins(): Promise<BootstrapAdminUser[]> {
  const result = await query<BootstrapAdminUser>(
    `SELECT id, email, name, role, account_status, email_verified
     FROM users WHERE role = 'admin'`
  );
  return result.rows;
}

export async function findUserByEmail(email: string): Promise<BootstrapAdminUser | null> {
  const result = await query<BootstrapAdminUser>(
    `SELECT id, email, name, role, account_status, email_verified
     FROM users WHERE email = $1`,
    [email.toLowerCase().trim()]
  );
  return result.rows[0] ?? null;
}

export async function findCredentialAccount(userId: string): Promise<AdminAccount | null> {
  const result = await query<AdminAccount>(
    `SELECT id, user_id, provider_id, password
     FROM account WHERE user_id = $1 AND provider_id = 'credential'`,
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function createAdmin(
  email: string,
  name: string,
  hashedPassword: string,
): Promise<BootstrapAdminUser> {
  const userId = crypto.randomUUID();
  const accountId = crypto.randomUUID();

  return withTransaction(async (client) => {
    const userResult = await client.query<BootstrapAdminUser>(
      `INSERT INTO users (id, email, name, role, account_status, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, 'admin', 'ACTIVE', true, NOW(), NOW())
       RETURNING id, email, name, role, account_status, email_verified`,
      [userId, email, name]
    );

    await client.query(
      `INSERT INTO account (id, user_id, account_id, provider_id, password, created_at, updated_at)
       VALUES ($1, $2, $3, 'credential', $4, NOW(), NOW())`,
      [accountId, userId, userId, hashedPassword]
    );

    return userResult.rows[0];
  });
}

export async function updateAdminEmail(userId: string, email: string): Promise<void> {
  await query(
    `UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2`,
    [email, userId]
  );
}

export async function updateAdminName(userId: string, name: string): Promise<void> {
  await query(
    `UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2`,
    [name, userId]
  );
}

export async function updateEmailVerified(userId: string): Promise<void> {
  await query(
    `UPDATE users SET email_verified = true, updated_at = NOW() WHERE id = $2 AND email_verified = false`,
    [userId]
  );
}

export async function updateAccountStatus(userId: string): Promise<void> {
  await query(
    `UPDATE users SET account_status = 'ACTIVE', updated_at = NOW() WHERE id = $1 AND account_status != 'ACTIVE'`,
    [userId]
  );
}

export async function updateRole(userId: string, role: string): Promise<void> {
  await query(
    `UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2`,
    [role, userId]
  );
}

export async function updateAccountPassword(
  userId: string,
  hashedPassword: string,
): Promise<void> {
  await withTransaction(async (client) => {
    const existing = await client.query<AdminAccount>(
      `SELECT id FROM account WHERE user_id = $1 AND provider_id = 'credential'`,
      [userId]
    );

    if (existing.rows.length > 0) {
      await client.query(
        `UPDATE account SET password = $1, updated_at = NOW() WHERE user_id = $2 AND provider_id = 'credential'`,
        [hashedPassword, userId]
      );
    } else {
      const accountId = crypto.randomUUID();
      await client.query(
        `INSERT INTO account (id, user_id, account_id, provider_id, password, created_at, updated_at)
         VALUES ($1, $2, $3, 'credential', $4, NOW(), NOW())`,
        [accountId, userId, userId, hashedPassword]
      );
    }
  });
}

export async function revokeUserSessions(userId: string): Promise<void> {
  await query(
    `DELETE FROM session WHERE user_id = $1`,
    [userId]
  );
}
