import { sanitizeText, normalizeEmail } from '../shared/sanitizers.js';
import { Limits } from '../shared/validators.js';
import { validateFeedbackForm, toFeedbackFormData } from './validation.js';
import { insertFeedback } from './repository.js';
import { emailService } from '../../email/index.js';
import type { FeedbackRecord } from './types.js';

export interface FeedbackServiceResult {
  success: boolean;
  error?: string;
  data?: FeedbackRecord;
}

export async function submitFeedback(
  body: Record<string, unknown>,
  ip: string | null,
  userAgent: string | null
): Promise<FeedbackServiceResult> {
  const validation = validateFeedbackForm(body);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const raw = toFeedbackFormData(body);

  const sanitized = {
    name: raw.name ? sanitizeText(raw.name, Limits.name.max) : null,
    email: raw.email ? normalizeEmail(raw.email) : null,
    product: sanitizeText(raw.product, Limits.product.max),
    rating: raw.rating,
    message: sanitizeText(raw.message, Limits.message.max),
  };

  const record = await insertFeedback(
    sanitized.name,
    sanitized.email,
    sanitized.product,
    sanitized.rating,
    sanitized.message,
    ip,
    userAgent
  );

  // Fire-and-forget both emails — don't block the response.
  const emailData = {
    name: sanitized.name ?? 'Anonymous',
    email: sanitized.email,
    product: sanitized.product,
    rating: sanitized.rating,
    message: sanitized.message,
  };

  emailService.sendFeedbackNotification(emailData)
    .catch((err) => console.error('[feedback] sendFeedbackNotification failed:', err));

  if (sanitized.email) {
    emailService.sendFeedbackAcknowledgement(emailData)
      .catch((err) => console.error('[feedback] sendFeedbackAcknowledgement failed:', err));
  }

  return { success: true, data: record };
}
