import { insertAuditLog } from './repository.js';
import type { AuditEvent, AuditLogEntry } from './types.js';

async function recordEvent(
  userId: string,
  event: AuditEvent,
  metadata: Record<string, unknown> = {},
  ipAddress?: string | null,
  userAgent?: string | null,
): Promise<AuditLogEntry> {
  return insertAuditLog(userId, event, metadata, ipAddress, userAgent);
}

export async function recordAccountCreated(
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
  metadata?: Record<string, unknown>,
): Promise<AuditLogEntry> {
  return recordEvent(userId, 'account_created', metadata, ipAddress, userAgent);
}

export async function recordLogin(
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
  metadata?: Record<string, unknown>,
): Promise<AuditLogEntry> {
  return recordEvent(userId, 'login', metadata, ipAddress, userAgent);
}

export async function recordLogout(
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
  metadata?: Record<string, unknown>,
): Promise<AuditLogEntry> {
  return recordEvent(userId, 'logout', metadata, ipAddress, userAgent);
}

export async function recordPasswordChanged(
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
  metadata?: Record<string, unknown>,
): Promise<AuditLogEntry> {
  return recordEvent(userId, 'password_changed', metadata, ipAddress, userAgent);
}

export async function recordPasswordReset(
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
  metadata?: Record<string, unknown>,
): Promise<AuditLogEntry> {
  return recordEvent(userId, 'password_reset', metadata, ipAddress, userAgent);
}

export async function recordEmailVerified(
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
  metadata?: Record<string, unknown>,
): Promise<AuditLogEntry> {
  return recordEvent(userId, 'email_verified', metadata, ipAddress, userAgent);
}

export async function recordSessionRevoked(
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
  metadata?: Record<string, unknown>,
): Promise<AuditLogEntry> {
  return recordEvent(userId, 'session_revoked', metadata, ipAddress, userAgent);
}

export async function recordAccountDeleted(
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
  metadata?: Record<string, unknown>,
): Promise<AuditLogEntry> {
  return recordEvent(userId, 'account_deleted', metadata, ipAddress, userAgent);
}

export async function recordAccountReactivated(
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
  metadata?: Record<string, unknown>,
): Promise<AuditLogEntry> {
  return recordEvent(userId, 'account_reactivated', metadata, ipAddress, userAgent);
}
