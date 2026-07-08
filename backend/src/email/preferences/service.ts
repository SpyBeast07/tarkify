import * as userRepository from '../../users/repository.js';
import type { TarkifyUser } from '../../users/types.js';
import type { EmailCategory, EmailPreferences } from './types.js';
import { DEFAULT_EMAIL_PREFERENCES, MANDATORY_CATEGORIES } from './types.js';

function setPref(prefs: EmailPreferences, key: EmailCategory, value: boolean): void {
  switch (key) {
    case 'marketing': prefs.marketing = value; break;
    case 'newsletter': prefs.newsletter = value; break;
    case 'product': prefs.product = value; break;
    case 'security': prefs.security = value; break;
    case 'billing': prefs.billing = value; break;
  }
}

export function extractEmailPreferences(user: TarkifyUser | null): EmailPreferences {
  const raw = user?.preferences?.email;
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_EMAIL_PREFERENCES };
  }

  const prefs = { ...DEFAULT_EMAIL_PREFERENCES };
  const rawMap = raw as Record<string, unknown>;
  for (const key of Object.keys(DEFAULT_EMAIL_PREFERENCES) as EmailCategory[]) {
    if (typeof rawMap[key] === 'boolean') {
      setPref(prefs, key, rawMap[key] as boolean);
    }
  }
  // security is always on
  for (const cat of MANDATORY_CATEGORIES) {
    setPref(prefs, cat, true);
  }
  return prefs;
}

export async function getEmailPreferences(
  userId: string,
): Promise<EmailPreferences | null> {
  const user = await userRepository.getUserById(userId);
  if (!user) return null;
  return extractEmailPreferences(user);
}

export async function updateEmailPreferences(
  userId: string,
  input: Partial<EmailPreferences>,
): Promise<EmailPreferences | null> {
  const user = await userRepository.getUserById(userId);
  if (!user) return null;

  const current = extractEmailPreferences(user);
  const merged: EmailPreferences = { ...current, ...input };

  // security is always on
  for (const cat of MANDATORY_CATEGORIES) {
    setPref(merged, cat, true);
  }

  const updated = await userRepository.updateEmailPreferences(userId, merged as unknown as Record<string, boolean>);
  if (!updated) return null;
  return extractEmailPreferences(updated);
}

export async function canSendEmail(
  email: string,
  category: EmailCategory,
): Promise<boolean> {
  // mandatory categories always send
  if ((MANDATORY_CATEGORIES as readonly string[]).includes(category)) {
    return true;
  }

  const user = await userRepository.getUserByEmail(email);
  if (!user) return true; // no user record → guest, subscriber, etc. — send

  const prefs = extractEmailPreferences(user);
  return prefs[category];
}
