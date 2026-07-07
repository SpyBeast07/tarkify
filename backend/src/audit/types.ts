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
