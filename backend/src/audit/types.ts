export const AUDIT_EVENTS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  ACCOUNT_CREATED: 'account_created',
  PASSWORD_CHANGED: 'password_changed',
  PASSWORD_RESET: 'password_reset',
  EMAIL_VERIFIED: 'email_verified',
  SESSION_REVOKED: 'session_revoked',
  ACCOUNT_DELETED: 'account_deleted',
  ACCOUNT_REACTIVATED: 'account_reactivated',
  ACCOUNT_SUSPENDED: 'account_suspended',

  PRODUCT_CREATED: 'product_created',
  PRODUCT_UPDATED: 'product_updated',
  PRODUCT_PUBLISHED: 'product_published',
  PRODUCT_UNPUBLISHED: 'product_unpublished',
  PRODUCT_ARCHIVED: 'product_archived',
  PRODUCT_RESTORED: 'product_restored',

  ORDER_VIEWED: 'order_viewed',
  PAYMENT_VIEWED: 'payment_viewed',
  RECEIPT_VIEWED: 'receipt_viewed',

  CUSTOMER_VIEWED: 'customer_viewed',
  CUSTOMER_SUSPENDED: 'customer_suspended',
  CUSTOMER_REACTIVATED: 'customer_reactivated',
  CUSTOMER_DELETED: 'customer_deleted',
  VERIFICATION_RESENT: 'verification_resent',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  CUSTOMER_SESSIONS_REVOKED: 'customer_sessions_revoked',

  DOWNLOAD_VIEWED: 'download_viewed',
  TOKEN_REVOKED: 'token_revoked',
  TOKEN_REGENERATED: 'token_regenerated',

  CONTACT_VIEWED: 'contact_viewed',
  FEEDBACK_VIEWED: 'feedback_viewed',
  NEWSLETTER_VIEWED: 'newsletter_viewed',
  CAREERS_VIEWED: 'careers_viewed',
  CONTACT_REPLIED: 'contact_replied',
  FEEDBACK_REPLIED: 'feedback_replied',
  CONTACT_STATUS_CHANGED: 'contact_status_changed',
  FEEDBACK_STATUS_CHANGED: 'feedback_status_changed',
  NEWSLETTER_STATUS_CHANGED: 'newsletter_status_changed',
  CAREERS_STATUS_CHANGED: 'careers_status_changed',
  CONTACT_ARCHIVED: 'contact_archived',
  FEEDBACK_ARCHIVED: 'feedback_archived',
  CAREERS_ARCHIVED: 'careers_archived',
  CONTACT_RESTORED: 'contact_restored',
  FEEDBACK_RESTORED: 'feedback_restored',
  CAREERS_RESTORED: 'careers_restored',
  CONTACT_DELETED: 'contact_deleted',
  FEEDBACK_DELETED: 'feedback_deleted',
  NEWSLETTER_DELETED: 'newsletter_deleted',
  CAREERS_DELETED: 'careers_deleted',
  NOTE_ADDED: 'note_added',
  TAG_ADDED: 'tag_added',
  TAG_REMOVED: 'tag_removed',
} as const;

export type AuditEvent = (typeof AUDIT_EVENTS)[keyof typeof AUDIT_EVENTS];

export interface AuditLogEntry {
  id: string;
  user_id: string;
  event: AuditEvent;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
