import { normalizeEmail } from '../shared/sanitizers.js';
import { validateNewsletterForm, toNewsletterFormData } from './validation.js';
import { tryInsertSubscriber } from './repository.js';

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

  try {
    const subscriber = await tryInsertSubscriber(email, ip, userAgent);
    if (!subscriber) {
      return { success: true, alreadySubscribed: true };
    }
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr?.code === '23505') {
      return { success: true, alreadySubscribed: true };
    }
    throw err;
  }

  return { success: true, alreadySubscribed: false };
}
