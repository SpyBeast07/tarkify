import * as repo from './repository.js';
import { recordEvent } from '../../audit/service.js';
import { emailService } from '../../email/index.js';
import type {
  RecordType, CommunicationNote, CommunicationTag,
  CommunicationListParams, CommunicationListResponse,
  CommunicationDetailResponse, CommunicationFilterOptions,
  ContactMessageDetail, FeedbackDetail, NewsletterDetail, CareerDetail,
} from './types.js';
import type { CommunicationStatus } from '../../communication/shared/types.js';

function toListResponse<T>(items: T[], total: number, page: number, perPage: number): CommunicationListResponse<T> {
  return { items, total, page, perPage, totalPages: Math.ceil(total / perPage) };
}

async function recordAudit(
  userId: string, action: string, recordType: RecordType, recordId: string,
  metadata: Record<string, unknown> = {},
  ipAddress?: string | null, userAgent?: string | null,
): Promise<void> {
  await recordEvent(userId, action as any, {
    record_type: recordType,
    record_id: recordId,
    ...metadata,
  }, ipAddress, userAgent);
}

// ─── Contact ─────────────────────────────────────────────────────────────────

export async function listContacts(params: CommunicationListParams): Promise<CommunicationListResponse<import('./types.js').ContactMessageListItem>> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const { items, total } = await repo.listContactMessages({ ...params, page, perPage });
  return toListResponse(items, total, page, perPage);
}

export async function getContact(id: string, userId: string, ipAddress?: string | null, userAgent?: string | null): Promise<CommunicationDetailResponse<ContactMessageDetail> | null> {
  const record = await repo.getContactMessage(id);
  if (!record) return null;
  const [notes, tags, audit] = await Promise.all([
    repo.getNotes('contact', id),
    repo.getRecordTags('contact', id),
    repo.getAuditLog('contact', id),
  ]);
  await recordAudit(userId, 'contact_viewed', 'contact', id, {}, ipAddress, userAgent);
  return { record, notes, tags, audit };
}

export async function updateContactStatus(
  id: string, status: CommunicationStatus, userId: string,
  ipAddress?: string | null, userAgent?: string | null,
): Promise<void> {
  await repo.updateContactMessageStatus(id, status);
  await recordAudit(userId, 'contact_status_changed', 'contact', id, { new_status: status }, ipAddress, userAgent);
}

export async function archiveContact(id: string, userId: string, ipAddress?: string | null, userAgent?: string | null): Promise<void> {
  await repo.archiveContactMessage(id);
  await recordAudit(userId, 'contact_archived', 'contact', id, {}, ipAddress, userAgent);
}

export async function restoreContact(id: string, userId: string, ipAddress?: string | null, userAgent?: string | null): Promise<void> {
  await repo.restoreContactMessage(id);
  await recordAudit(userId, 'contact_restored', 'contact', id, {}, ipAddress, userAgent);
}

export async function deleteContact(id: string, userId: string, ipAddress?: string | null, userAgent?: string | null): Promise<boolean> {
  const deleted = await repo.deleteContactMessage(id);
  if (deleted) {
    await recordAudit(userId, 'contact_deleted', 'contact', id, {}, ipAddress, userAgent);
  }
  return deleted;
}

export async function replyContact(
  id: string, subject: string, message: string, adminUserId: string,
  ipAddress?: string | null, userAgent?: string | null,
): Promise<void> {
  const record = await repo.getContactMessage(id);
  if (!record) throw new Error('Contact message not found');

  await emailService.sendReplyEmail({ to: record.email, subject, message });

  await repo.updateContactMessageStatus(id, 'REPLIED');
  await recordAudit(adminUserId, 'contact_replied', 'contact', id, {
    reply_subject: subject,
  }, ipAddress, userAgent);
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export async function listFeedback(params: CommunicationListParams): Promise<CommunicationListResponse<import('./types.js').FeedbackListItem>> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const { items, total } = await repo.listFeedback({ ...params, page, perPage });
  return toListResponse(items, total, page, perPage);
}

export async function getFeedback(id: string, userId: string, ipAddress?: string | null, userAgent?: string | null): Promise<CommunicationDetailResponse<FeedbackDetail> | null> {
  const record = await repo.getFeedback(id);
  if (!record) return null;
  const [notes, tags, audit] = await Promise.all([
    repo.getNotes('feedback', id),
    repo.getRecordTags('feedback', id),
    repo.getAuditLog('feedback', id),
  ]);
  await recordAudit(userId, 'feedback_viewed', 'feedback', id, {}, ipAddress, userAgent);
  return { record, notes, tags, audit };
}

export async function updateFeedbackStatus(
  id: string, status: CommunicationStatus, userId: string,
  ipAddress?: string | null, userAgent?: string | null,
): Promise<void> {
  await repo.updateFeedbackStatus(id, status);
  await recordAudit(userId, 'feedback_status_changed', 'feedback', id, { new_status: status }, ipAddress, userAgent);
}

export async function archiveFeedback(id: string, userId: string, ipAddress?: string | null, userAgent?: string | null): Promise<void> {
  await repo.archiveFeedback(id);
  await recordAudit(userId, 'feedback_archived', 'feedback', id, {}, ipAddress, userAgent);
}

export async function restoreFeedback(id: string, userId: string, ipAddress?: string | null, userAgent?: string | null): Promise<void> {
  await repo.restoreFeedback(id);
  await recordAudit(userId, 'feedback_restored', 'feedback', id, {}, ipAddress, userAgent);
}

export async function deleteFeedback(id: string, userId: string, ipAddress?: string | null, userAgent?: string | null): Promise<boolean> {
  const deleted = await repo.deleteFeedback(id);
  if (deleted) {
    await recordAudit(userId, 'feedback_deleted', 'feedback', id, {}, ipAddress, userAgent);
  }
  return deleted;
}

export async function replyFeedback(
  id: string, subject: string, message: string, adminUserId: string,
  ipAddress?: string | null, userAgent?: string | null,
): Promise<void> {
  const record = await repo.getFeedback(id);
  if (!record) throw new Error('Feedback not found');
  if (!record.email) throw new Error('This feedback has no email address to reply to');

  await emailService.sendReplyEmail({ to: record.email, subject, message });

  await repo.updateFeedbackStatus(id, 'REPLIED');
  await recordAudit(adminUserId, 'feedback_replied', 'feedback', id, {
    reply_subject: subject,
  }, ipAddress, userAgent);
}

// ─── Newsletter ──────────────────────────────────────────────────────────────

export async function listNewsletter(params: CommunicationListParams): Promise<CommunicationListResponse<import('./types.js').NewsletterListItem>> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const { items, total } = await repo.listNewsletterSubscribers({ ...params, page, perPage });
  return toListResponse(items, total, page, perPage);
}

export async function getNewsletter(id: string, userId: string, ipAddress?: string | null, userAgent?: string | null): Promise<CommunicationDetailResponse<NewsletterDetail> | null> {
  const record = await repo.getNewsletterSubscriber(id);
  if (!record) return null;
  const [notes, tags, audit] = await Promise.all([
    repo.getNotes('newsletter', id),
    repo.getRecordTags('newsletter', id),
    repo.getAuditLog('newsletter', id),
  ]);
  await recordAudit(userId, 'newsletter_viewed', 'newsletter', id, {}, ipAddress, userAgent);
  return { record, notes, tags, audit };
}

export async function updateNewsletterStatus(
  id: string, status: CommunicationStatus, userId: string,
  ipAddress?: string | null, userAgent?: string | null,
): Promise<void> {
  await repo.updateNewsletterStatus(id, status);
  await recordAudit(userId, 'newsletter_status_changed', 'newsletter', id, { new_status: status }, ipAddress, userAgent);
}

export async function deleteNewsletter(id: string, userId: string, ipAddress?: string | null, userAgent?: string | null): Promise<boolean> {
  const deleted = await repo.deleteNewsletterSubscriber(id);
  if (deleted) {
    await recordAudit(userId, 'newsletter_deleted', 'newsletter', id, {}, ipAddress, userAgent);
  }
  return deleted;
}

// ─── Careers ─────────────────────────────────────────────────────────────────

export async function listCareers(params: CommunicationListParams): Promise<CommunicationListResponse<import('./types.js').CareerListItem>> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.perPage ?? 20));
  const { items, total } = await repo.listCareerApplications({ ...params, page, perPage });
  return toListResponse(items, total, page, perPage);
}

export async function getCareer(id: string, userId: string, ipAddress?: string | null, userAgent?: string | null): Promise<CommunicationDetailResponse<CareerDetail> | null> {
  const record = await repo.getCareerApplication(id);
  if (!record) return null;
  const [notes, tags, audit] = await Promise.all([
    repo.getNotes('careers', id),
    repo.getRecordTags('careers', id),
    repo.getAuditLog('careers', id),
  ]);
  await recordAudit(userId, 'careers_viewed', 'careers', id, {}, ipAddress, userAgent);
  return { record, notes, tags, audit };
}

export async function updateCareerStatus(
  id: string, status: CommunicationStatus, userId: string,
  ipAddress?: string | null, userAgent?: string | null,
): Promise<void> {
  await repo.updateCareerStatus(id, status);
  await recordAudit(userId, 'careers_status_changed', 'careers', id, { new_status: status }, ipAddress, userAgent);
}

export async function archiveCareer(id: string, userId: string, ipAddress?: string | null, userAgent?: string | null): Promise<void> {
  await repo.archiveCareerApplication(id);
  await recordAudit(userId, 'careers_archived', 'careers', id, {}, ipAddress, userAgent);
}

export async function restoreCareer(id: string, userId: string, ipAddress?: string | null, userAgent?: string | null): Promise<void> {
  await repo.restoreCareerApplication(id);
  await recordAudit(userId, 'careers_restored', 'careers', id, {}, ipAddress, userAgent);
}

export async function deleteCareer(id: string, userId: string, ipAddress?: string | null, userAgent?: string | null): Promise<boolean> {
  const deleted = await repo.deleteCareerApplication(id);
  if (deleted) {
    await recordAudit(userId, 'careers_deleted', 'careers', id, {}, ipAddress, userAgent);
  }
  return deleted;
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export async function getNotes(recordType: RecordType, recordId: string): Promise<CommunicationNote[]> {
  return repo.getNotes(recordType, recordId);
}

export async function addNote(
  recordType: RecordType, recordId: string, authorId: string, content: string,
  ipAddress?: string | null, userAgent?: string | null,
): Promise<CommunicationNote> {
  const note = await repo.addNote(recordType, recordId, authorId, content);
  await recordAudit(authorId, 'note_added', recordType, recordId, {
    note_id: note.id,
  }, ipAddress, userAgent);
  return note;
}

// ─── Tags ────────────────────────────────────────────────────────────────────

export async function listTags(): Promise<CommunicationTag[]> {
  return repo.listTags();
}

export async function createTag(name: string, color: string): Promise<CommunicationTag> {
  return repo.createTag(name, color);
}

export async function updateTag(id: string, name: string, color: string): Promise<CommunicationTag | null> {
  return repo.updateTag(id, name, color);
}

export async function deleteTag(id: string): Promise<boolean> {
  return repo.deleteTag(id);
}

export async function addTagToRecord(
  recordType: RecordType, recordId: string, tagId: string, userId: string,
  ipAddress?: string | null, userAgent?: string | null,
): Promise<void> {
  await repo.addTagToRecord(recordType, recordId, tagId);
  await recordAudit(userId, 'tag_added', recordType, recordId, { tag_id: tagId }, ipAddress, userAgent);
}

export async function removeTagFromRecord(
  recordType: RecordType, recordId: string, tagId: string, userId: string,
  ipAddress?: string | null, userAgent?: string | null,
): Promise<void> {
  await repo.removeTagFromRecord(recordType, recordId, tagId);
  await recordAudit(userId, 'tag_removed', recordType, recordId, { tag_id: tagId }, ipAddress, userAgent);
}

// ─── Filter Options ─────────────────────────────────────────────────────────

export async function getFilterOptions(): Promise<CommunicationFilterOptions> {
  return { statuses: ['NEW', 'READ', 'REPLIED', 'ARCHIVED'] };
}
