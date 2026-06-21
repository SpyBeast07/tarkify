import { normalizeEmail } from '../shared/sanitizers.js';
import { validateNewsletterForm, toNewsletterFormData } from './validation.js';
import { findActiveSubscriber, insertSubscriber } from './repository.js';

export interface NewsletterServiceResult {
  success: boolean;
  alreadySubscribed: boolean;
  error?: string;
}

export async function subscribeToNewsletter(
  body: Record<string, unknown>,
  ip: string | null,
  userAgent: string | null
): Promise<NewsletterServiceResult> {
  const validation = validateNewsletterForm(body);
  if (!validation.valid) {
    return { success: false, alreadySubscribed: false, error: validation.error };
  }

  const raw = toNewsletterFormData(body);
  const email = normalizeEmail(raw.email);

  const existing = await findActiveSubscriber(email);
  if (existing) {
    return { success: true, alreadySubscribed: true };
  }

  await insertSubscriber(email, ip, userAgent);

  return { success: true, alreadySubscribed: false };
}
