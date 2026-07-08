/**
 * Email logger.
 * Records email delivery attempts for observability.
 */

export type EmailLogLevel = 'info' | 'warn' | 'error';

export interface EmailLogEntry {
  id: string;
  to: string;
  subject: string;
  provider: string;
  level: EmailLogLevel;
  message: string;
  durationMs: number;
  timestamp: Date;
}

export class EmailLogger {
  private entries: EmailLogEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries = 1_000) {
    this.maxEntries = maxEntries;
  }

  log(
    level: EmailLogLevel,
    to: string,
    subject: string,
    provider: string,
    message: string,
    durationMs: number
  ): void {
    const entry: EmailLogEntry = {
      id: crypto.randomUUID(),
      to,
      subject,
      provider,
      level,
      message,
      durationMs,
      timestamp: new Date(),
    };

    this.entries.push(entry);

    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    const prefix = `[Email:${level.toUpperCase()}]`;
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info'](
      `${prefix} provider=${provider} to=${to} subject="${subject}" duration=${durationMs}ms message="${message}"`
    );
  }

  info(to: string, subject: string, provider: string, message: string, durationMs: number): void {
    this.log('info', to, subject, provider, message, durationMs);
  }

  warn(to: string, subject: string, provider: string, message: string, durationMs: number): void {
    this.log('warn', to, subject, provider, message, durationMs);
  }

  error(to: string, subject: string, provider: string, message: string, durationMs: number): void {
    this.log('error', to, subject, provider, message, durationMs);
  }

  getRecent(count: number): EmailLogEntry[] {
    return this.entries.slice(-count);
  }

  getAll(): EmailLogEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
  }
}

export const emailLogger = new EmailLogger();
