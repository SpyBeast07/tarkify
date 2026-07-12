import { normalizeEmail } from '../shared/sanitizers.js';
import { validateNewsletterForm, toNewsletterFormData } from './validation.js';
import { tryInsertSubscriber, archiveSubscriber } from './repository.js';
import { emailService } from '../../email/index.js';
import { notify } from '../../lib/notifications.js';
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
    // Customer confirmation — always sent (customer transactional email).
    emailService.sendNewsletterConfirmation({ email, unsubscribeUrl })
      .catch((err) => console.error('[newsletter] sendNewsletterConfirmation failed:', err));

    // Admin notification — gated by the Newsletter Notifications toggle.
    notify('newsletterAlerts', () =>
      emailService.sendAdminNotification({
        subject: 'New newsletter subscriber',
        message: `${email} has subscribed to the newsletter.`,
        metadata: { email },
      }),
    ).catch((err) => console.error('[newsletter] sendAdminNotification (signup) failed:', err));
  }

  return { success: true, alreadySubscribed: false };
}

export async function unsubscribeFromNewsletter(
  email: string
): Promise<{ success: boolean; wasSubscribed: boolean }> {
  const normalised = normalizeEmail(email);
  const archived = await archiveSubscriber(normalised);

  if (archived) {
    // Customer unsubscribe confirmation — always sent (customer transactional email).
    emailService.sendNewsletterUnsubscribed({ email: normalised })
      .catch((err) => console.error('[newsletter] sendNewsletterUnsubscribed failed:', err));
  }

  return { success: true, wasSubscribed: archived };
}
