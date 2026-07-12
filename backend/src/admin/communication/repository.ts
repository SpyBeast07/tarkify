import { query } from '../../db.js';
import type { CommunicationStatus } from '../../communication/shared/types.js';
import type { RecordType } from './types.js';
import type {
  ContactMessageListItem, ContactMessageDetail,
  FeedbackListItem, FeedbackDetail,
  NewsletterListItem, NewsletterDetail,
  CareerListItem, CareerDetail,
  CommunicationNote, CommunicationTag, CommunicationRecordTag,
  CommunicationListParams,
} from './types.js';

function buildListWhere(params: CommunicationListParams, searchColumns: string[]): { clause: string; values: unknown[] } {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (params.search) {
    const likeConditions = searchColumns
      .map((col) => `COALESCE(r.${col}, '') ILIKE $${idx}`)
      .join('\n      OR ');
    conditions.push(`(\n      ${likeConditions}\n    )`);
    values.push(`%${params.search}%`);
    idx++;
  }

  if (params.status) {
    conditions.push(`r.status = $${idx}`);
    values.push(params.status);
    idx++;
  }

  if (params.archived === 'true') {
    conditions.push('r.archived_at IS NOT NULL');
  } else if (params.archived === 'false' || !params.archived) {
    conditions.push('r.archived_at IS NULL');
  }

  if (params.dateFrom) {
    conditions.push(`r.created_at >= $${idx}`);
    values.push(params.dateFrom);
    idx++;
  }

  if (params.dateTo) {
    conditions.push(`r.created_at <= $${idx}`);
    values.push(params.dateTo);
    idx++;
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, values };
}

function buildOrderBy(sort: string): string {
  switch (sort) {
    case 'oldest': return 'r.created_at ASC';
    case 'status': return 'r.status ASC, r.created_at DESC';
    case 'updated': return 'r.updated_at DESC';
    default: return 'r.created_at DESC';
  }
}

// ─── Contact Messages ────────────────────────────────────────────────────────

export async function listContactMessages(params: CommunicationListParams): Promise<{ items: ContactMessageListItem[]; total: number }> {
  const sort = params.sort ?? 'newest';
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const offset = (page - 1) * perPage;
  const { clause, values } = buildListWhere(params, ['name', 'email', 'company', 'subject', 'message']);

  const countResult = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM contact_messages r ${clause}`, values,
  );
  const total = countResult.rows[0].count;

  const orderBy = buildOrderBy(sort);
  const listValues = [...values, perPage, offset];

  const result = await query<ContactMessageListItem>(
    `SELECT
      r.id, r.name, r.email, r.company, r.subject, r.message,
      r.status, r.archived_at, r.created_at, r.updated_at,
      (SELECT COUNT(*)::int FROM communication_notes n WHERE n.record_type = 'contact' AND n.record_id = r.id) AS note_count,
      (SELECT COUNT(*)::int FROM communication_record_tags rt WHERE rt.record_type = 'contact' AND rt.record_id = r.id) AS tag_count
    FROM contact_messages r
    ${clause}
    ORDER BY ${orderBy}
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    listValues,
  );
  return { items: result.rows, total };
}

export async function getContactMessage(id: string): Promise<ContactMessageDetail | null> {
  const result = await query<ContactMessageDetail>(
    `SELECT * FROM contact_messages WHERE id = $1`, [id],
  );
  return result.rows[0] ?? null;
}

export async function updateContactMessageStatus(id: string, status: CommunicationStatus): Promise<void> {
  await query(
    `UPDATE contact_messages SET status = $1, updated_at = NOW() WHERE id = $2`, [status, id],
  );
}

export async function archiveContactMessage(id: string): Promise<void> {
  await query(
    `UPDATE contact_messages SET status = 'ARCHIVED', archived_at = NOW(), updated_at = NOW() WHERE id = $1`, [id],
  );
}

export async function restoreContactMessage(id: string): Promise<void> {
  await query(
    `UPDATE contact_messages SET status = 'NEW', archived_at = NULL, updated_at = NOW() WHERE id = $1`, [id],
  );
}

export async function deleteContactMessage(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM contact_messages WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export async function listFeedback(params: CommunicationListParams): Promise<{ items: FeedbackListItem[]; total: number }> {
  const sort = params.sort ?? 'newest';
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const offset = (page - 1) * perPage;
  const { clause, values } = buildListWhere(params, ['name', 'email', 'product', 'message']);

  const countResult = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM feedback r ${clause}`, values,
  );
  const total = countResult.rows[0].count;

  const orderBy = buildOrderBy(sort);
  const listValues = [...values, perPage, offset];

  const result = await query<FeedbackListItem>(
    `SELECT
      r.id, r.name, r.email, r.product, r.rating, r.message,
      r.status, r.archived_at, r.created_at, r.updated_at,
      (SELECT COUNT(*)::int FROM communication_notes n WHERE n.record_type = 'feedback' AND n.record_id = r.id) AS note_count,
      (SELECT COUNT(*)::int FROM communication_record_tags rt WHERE rt.record_type = 'feedback' AND rt.record_id = r.id) AS tag_count
    FROM feedback r
    ${clause}
    ORDER BY ${orderBy}
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    listValues,
  );
  return { items: result.rows, total };
}

export async function getFeedback(id: string): Promise<FeedbackDetail | null> {
  const result = await query<FeedbackDetail>(
    `SELECT * FROM feedback WHERE id = $1`, [id],
  );
  return result.rows[0] ?? null;
}

export async function updateFeedbackStatus(id: string, status: CommunicationStatus): Promise<void> {
  await query(
    `UPDATE feedback SET status = $1, updated_at = NOW() WHERE id = $2`, [status, id],
  );
}

export async function archiveFeedback(id: string): Promise<void> {
  await query(
    `UPDATE feedback SET status = 'ARCHIVED', archived_at = NOW(), updated_at = NOW() WHERE id = $1`, [id],
  );
}

export async function restoreFeedback(id: string): Promise<void> {
  await query(
    `UPDATE feedback SET status = 'NEW', archived_at = NULL, updated_at = NOW() WHERE id = $1`, [id],
  );
}

export async function deleteFeedback(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM feedback WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

// ─── Newsletter ──────────────────────────────────────────────────────────────

export async function listNewsletterSubscribers(params: CommunicationListParams): Promise<{ items: NewsletterListItem[]; total: number }> {
  const sort = params.sort ?? 'newest';
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const offset = (page - 1) * perPage;
  const { clause, values } = buildListWhere(params, ['email']);

  const countResult = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM newsletter_subscribers r ${clause}`, values,
  );
  const total = countResult.rows[0].count;

  const orderBy = buildOrderBy(sort);
  const listValues = [...values, perPage, offset];

  const result = await query<NewsletterListItem>(
    `SELECT
      r.id, r.email, r.status, r.archived_at, r.created_at, r.updated_at,
      (SELECT COUNT(*)::int FROM communication_notes n WHERE n.record_type = 'newsletter' AND n.record_id = r.id) AS note_count,
      (SELECT COUNT(*)::int FROM communication_record_tags rt WHERE rt.record_type = 'newsletter' AND rt.record_id = r.id) AS tag_count
    FROM newsletter_subscribers r
    ${clause}
    ORDER BY ${orderBy}
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    listValues,
  );
  return { items: result.rows, total };
}

export async function getNewsletterSubscriber(id: string): Promise<NewsletterDetail | null> {
  const result = await query<NewsletterDetail>(
    `SELECT * FROM newsletter_subscribers WHERE id = $1`, [id],
  );
  return result.rows[0] ?? null;
}

export async function updateNewsletterStatus(id: string, status: CommunicationStatus): Promise<void> {
  await query(
    `UPDATE newsletter_subscribers SET status = $1, updated_at = NOW() WHERE id = $2`, [status, id],
  );
}

export async function deleteNewsletterSubscriber(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM newsletter_subscribers WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

// ─── Careers ─────────────────────────────────────────────────────────────────

export async function listCareerApplications(params: CommunicationListParams): Promise<{ items: CareerListItem[]; total: number }> {
  const sort = params.sort ?? 'newest';
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const offset = (page - 1) * perPage;
  const { clause, values } = buildListWhere(params, ['name', 'email', 'phone', 'cover_letter']);

  const countResult = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM career_applications r ${clause}`, values,
  );
  const total = countResult.rows[0].count;

  const orderBy = buildOrderBy(sort);
  const listValues = [...values, perPage, offset];

  const result = await query<CareerListItem>(
    `SELECT
      r.id, r.name, r.email, r.phone, r.resume_url, r.portfolio_url, r.cover_letter,
      r.status, r.archived_at, r.created_at, r.updated_at,
      (SELECT COUNT(*)::int FROM communication_notes n WHERE n.record_type = 'careers' AND n.record_id = r.id) AS note_count,
      (SELECT COUNT(*)::int FROM communication_record_tags rt WHERE rt.record_type = 'careers' AND rt.record_id = r.id) AS tag_count
    FROM career_applications r
    ${clause}
    ORDER BY ${orderBy}
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    listValues,
  );
  return { items: result.rows, total };
}

export async function getCareerApplication(id: string): Promise<CareerDetail | null> {
  const result = await query<CareerDetail>(
    `SELECT * FROM career_applications WHERE id = $1`, [id],
  );
  return result.rows[0] ?? null;
}

export async function updateCareerStatus(id: string, status: CommunicationStatus): Promise<void> {
  await query(
    `UPDATE career_applications SET status = $1, updated_at = NOW() WHERE id = $2`, [status, id],
  );
}

export async function archiveCareerApplication(id: string): Promise<void> {
  await query(
    `UPDATE career_applications SET status = 'ARCHIVED', archived_at = NOW(), updated_at = NOW() WHERE id = $1`, [id],
  );
}

export async function restoreCareerApplication(id: string): Promise<void> {
  await query(
    `UPDATE career_applications SET status = 'NEW', archived_at = NULL, updated_at = NOW() WHERE id = $1`, [id],
  );
}

export async function deleteCareerApplication(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM career_applications WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export async function getNotes(recordType: RecordType, recordId: string): Promise<CommunicationNote[]> {
  const result = await query<CommunicationNote>(
    `SELECT n.id, n.record_type, n.record_id, n.author_id, u.name AS author_name, n.content, n.created_at
     FROM communication_notes n
     LEFT JOIN users u ON u.id = n.author_id
     WHERE n.record_type = $1 AND n.record_id = $2
     ORDER BY n.created_at DESC`,
    [recordType, recordId],
  );
  return result.rows;
}

export async function addNote(recordType: RecordType, recordId: string, authorId: string, content: string): Promise<CommunicationNote> {
  const result = await query<CommunicationNote>(
    `INSERT INTO communication_notes (record_type, record_id, author_id, content)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [recordType, recordId, authorId, content],
  );
  return result.rows[0];
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

export async function listTags(): Promise<CommunicationTag[]> {
  const result = await query<CommunicationTag>(
    `SELECT * FROM communication_tags ORDER BY name ASC`,
  );
  return result.rows;
}

export async function createTag(name: string, color: string): Promise<CommunicationTag> {
  const result = await query<CommunicationTag>(
    `INSERT INTO communication_tags (name, color) VALUES ($1, $2) RETURNING *`,
    [name, color],
  );
  return result.rows[0];
}

export async function updateTag(id: string, name: string, color: string): Promise<CommunicationTag | null> {
  const result = await query<CommunicationTag>(
    `UPDATE communication_tags SET name = $1, color = $2 WHERE id = $3 RETURNING *`,
    [name, color, id],
  );
  return result.rows[0] ?? null;
}

export async function deleteTag(id: string): Promise<boolean> {
  const result = await query(`DELETE FROM communication_tags WHERE id = $1`, [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function getRecordTags(recordType: RecordType, recordId: string): Promise<CommunicationRecordTag[]> {
  const result = await query<CommunicationRecordTag>(
    `SELECT rt.record_type, rt.record_id, rt.tag_id, t.name AS tag_name, t.color AS tag_color, rt.created_at
     FROM communication_record_tags rt
     JOIN communication_tags t ON t.id = rt.tag_id
     WHERE rt.record_type = $1 AND rt.record_id = $2
     ORDER BY t.name ASC`,
    [recordType, recordId],
  );
  return result.rows;
}

export async function addTagToRecord(recordType: RecordType, recordId: string, tagId: string): Promise<void> {
  await query(
    `INSERT INTO communication_record_tags (record_type, record_id, tag_id)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING`,
    [recordType, recordId, tagId],
  );
}

export async function removeTagFromRecord(recordType: RecordType, recordId: string, tagId: string): Promise<void> {
  await query(
    `DELETE FROM communication_record_tags
     WHERE record_type = $1 AND record_id = $2 AND tag_id = $3`,
    [recordType, recordId, tagId],
  );
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export async function getAuditLog(entityType: string, entityId: string): Promise<any[]> {
  const result = await query(
    `SELECT a.id, a.event, a.user_id, u.name AS user_name, a.metadata, a.created_at
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     WHERE a.metadata->>'record_type' = $1 AND a.metadata->>'record_id' = $2
        OR (a.metadata->>'entity_type' = $1 AND a.metadata->>'entity_id' = $2)
     ORDER BY a.created_at DESC
     LIMIT 100`,
    [entityType, entityId],
  );
  return result.rows;
}
