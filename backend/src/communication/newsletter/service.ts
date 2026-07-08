import { normalizeEmail } from '../shared/sanitizers.js';
import { validateNewsletterForm, toNewsletterFormData } from './validation.js';
import { tryInsertSubscriber, archiveSubscriber } from './repository.js';
import { emailService } from '../../email/index.js';
import { config } from '../../config.js';

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

  let isNew = false;

  try {
    const subscriber = await tryInsertSubscriber(email, ip, userAgent);
    if (!subscriber) {
      return { success: true, alreadySubscribed: true };
    }
    isNew = true;
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr?.code === '23505') {
      return { success: true, alreadySubscribed: true };
    }
    throw err;
  }

  if (isNew) {
    const unsubscribeUrl = `${config.frontendUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
    emailService.sendNewsletterConfirmation({ email, unsubscribeUrl })
      .catch((err) => console.error('[newsletter] sendNewsletterConfirmation failed:', err));
  }

  return { success: true, alreadySubscribed: false };
}

export async function unsubscribeFromNewsletter(
  email: string
): Promise<{ success: boolean; wasSubscribed: boolean }> {
  const normalised = normalizeEmail(email);
  const archived = await archiveSubscriber(normalised);

  if (archived) {
    emailService.sendNewsletterUnsubscribed({ email: normalised })
      .catch((err) => console.error('[newsletter] sendNewsletterUnsubscribed failed:', err));
  }

  return { success: true, wasSubscribed: archived };
}
