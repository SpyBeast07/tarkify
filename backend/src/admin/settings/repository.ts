import { query } from '../../db.js';
import type { SettingsGroup, SettingsRow } from './types.js';

export async function getRow(key: SettingsGroup): Promise<SettingsRow | null> {
  const result = await query<SettingsRow>(
    `SELECT id, key, value, updated_at, updated_by
     FROM settings WHERE key = $1`,
    [key]
  );
  return result.rows[0] ?? null;
}

export async function getValue(key: SettingsGroup): Promise<Record<string, unknown> | null> {
  const row = await getRow(key);
  return row ? row.value : null;
}

export async function getAllRows(): Promise<SettingsRow[]> {
  const result = await query<SettingsRow>(
    `SELECT id, key, value, updated_at, updated_by
     FROM settings ORDER BY key ASC`
  );
  return result.rows;
}

export async function upsertValue(
  key: SettingsGroup,
  value: Record<string, unknown>,
  updatedBy: string,
): Promise<SettingsRow> {
  const result = await query<SettingsRow>(
    `INSERT INTO settings (key, value, updated_by, updated_at)
     VALUES ($1, $2::jsonb, $3, NOW())
     ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value,
           updated_by = EXCLUDED.updated_by,
           updated_at = NOW()
     RETURNING id, key, value, updated_at, updated_by`,
    [key, JSON.stringify(value), updatedBy]
  );
  return result.rows[0];
}
