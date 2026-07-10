import type { CommunicationStatus } from '../../communication/shared/types.js';

export type RecordType = 'contact' | 'feedback' | 'newsletter' | 'careers';

export interface CommunicationNote {
  id: string;
  record_type: RecordType;
  record_id: string;
  author_id: string;
  author_name: string | null;
  content: string;
  created_at: string;
}

export interface CommunicationTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface CommunicationRecordTag {
  record_type: RecordType;
  record_id: string;
  tag_id: string;
  tag_name: string;
  tag_color: string;
  created_at: string;
}

export interface ContactMessageListItem {
  id: string;
  name: string;
  email: string;
  company: string | null;
  subject: string;
  message: string;
  status: CommunicationStatus;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  note_count: number;
  tag_count: number;
}

export interface ContactMessageDetail {
  id: string;
  name: string;
  email: string;
  company: string | null;
  subject: string;
  message: string;
  status: CommunicationStatus;
  submitted_from_ip: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackListItem {
  id: string;
  name: string | null;
  email: string | null;
  product: string;
  rating: number;
  message: string;
  status: CommunicationStatus;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  note_count: number;
  tag_count: number;
}

export interface FeedbackDetail {
  id: string;
  name: string | null;
  email: string | null;
  product: string;
  rating: number;
  message: string;
  status: CommunicationStatus;
  submitted_from_ip: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsletterListItem {
  id: string;
  email: string;
  status: CommunicationStatus;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  note_count: number;
  tag_count: number;
}

export interface NewsletterDetail {
  id: string;
  email: string;
  status: CommunicationStatus;
  submitted_from_ip: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CareerListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  resume_url: string;
  portfolio_url: string | null;
  cover_letter: string | null;
  status: CommunicationStatus;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  note_count: number;
  tag_count: number;
}

export interface CareerDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  resume_url: string;
  portfolio_url: string | null;
  cover_letter: string | null;
  status: CommunicationStatus;
  submitted_from_ip: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunicationListParams {
  search?: string;
  status?: CommunicationStatus;
  archived?: 'true' | 'false';
  dateFrom?: string;
  dateTo?: string;
  sort?: 'newest' | 'oldest' | 'status' | 'updated';
  page?: number;
  perPage?: number;
}

export interface CommunicationListResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface CommunicationDetailResponse<T> {
  record: T;
  notes: CommunicationNote[];
  tags: CommunicationRecordTag[];
  audit: import('../../admin/downloads/types.js').DownloadAuditEntry[];
}

export type CommunicationAction =
  | 'contact_viewed'
  | 'feedback_viewed'
  | 'newsletter_viewed'
  | 'careers_viewed'
  | 'contact_replied'
  | 'feedback_replied'
  | 'newsletter_replied'
  | 'careers_replied'
  | 'contact_status_changed'
  | 'feedback_status_changed'
  | 'newsletter_status_changed'
  | 'careers_status_changed'
  | 'contact_archived'
  | 'feedback_archived'
  | 'newsletter_archived'
  | 'careers_archived'
  | 'contact_restored'
  | 'feedback_restored'
  | 'newsletter_restored'
  | 'careers_restored'
  | 'contact_deleted'
  | 'feedback_deleted'
  | 'newsletter_deleted'
  | 'careers_deleted'
  | 'note_added'
  | 'tag_added'
  | 'tag_removed';

export interface CommunicationFilterOptions {
  statuses: CommunicationStatus[];
}
