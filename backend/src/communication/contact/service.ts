import { sanitizeText, normalizeEmail } from '../shared/sanitizers.js';
import { Limits } from '../shared/validators.js';
import { validateContactForm, toContactFormData } from './validation.js';
import { insertContactMessage } from './repository.js';
import { emailService } from '../../email/index.js';
import type { ContactMessage } from './types.js';

export interface ContactServiceResult {
  success: boolean;
  error?: string;
  data?: ContactMessage;
}

export async function submitContact(
  body: Record<string, unknown>,
  ip: string | null,
  userAgent: string | null
): Promise<ContactServiceResult> {
  const validation = validateContactForm(body);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const raw = toContactFormData(body);

  const sanitized = {
    name: sanitizeText(raw.name, Limits.name.max),
    email: normalizeEmail(raw.email),
    company: raw.company ? sanitizeText(raw.company, Limits.company.max) : null,
    subject: sanitizeText(raw.subject, Limits.subject.max),
    message: sanitizeText(raw.message, Limits.message.max),
  };

  const record = await insertContactMessage(
    sanitized.name,
    sanitized.email,
    sanitized.company,
    sanitized.subject,
    sanitized.message,
    ip,
    userAgent
  );

  // Fire-and-forget both emails — don't block the response.
  const emailData = {
    name: sanitized.name,
    email: sanitized.email,
    subject: sanitized.subject,
    message: sanitized.message,
  };

  emailService.sendContactAcknowledgement(emailData)
    .catch((err) => console.error('[contact] sendContactAcknowledgement failed:', err));

  emailService.sendContactNotification(emailData)
    .catch((err) => console.error('[contact] sendContactNotification failed:', err));

  return { success: true, data: record };
}
