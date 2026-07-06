import * as userRepository from './repository.js';
import { updateProfileSchema, preferencesSchema, validateTimezone } from './validation.js';
import type { Profile, TarkifyUser, UpdateProfileInput } from './types.js';

function toProfile(user: TarkifyUser): Profile {
  return {
    id: user.id,
    email: user.email,
    name: null,
    displayName: user.display_name,
    image: null,
    role: user.role,
    timezone: user.timezone,
    preferences: typeof user.preferences === 'object' && user.preferences !== null
      ? user.preferences as Record<string, unknown>
      : {},
    accountStatus: user.account_status,
    emailVerified: false,
    lastLoginAt: user.last_login_at,
    lastActivityAt: user.last_activity_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
}

export async function getProfile(id: string): Promise<{ profile: Profile; user: TarkifyUser } | null> {
  const user = await userRepository.getUserById(id);
  if (!user) return null;
  return { profile: toProfile(user), user };
}

export async function updateProfile(
  id: string,
  input: UpdateProfileInput
): Promise<{ profile: Profile; user: TarkifyUser } | null> {
  const parsed = updateProfileSchema.parse(input);

  if (parsed.timezone && !validateTimezone(parsed.timezone)) {
    throw new Error(`Invalid timezone: ${parsed.timezone}`);
  }

  const user = await userRepository.updateProfile(id, parsed);
  if (!user) return null;
  return { profile: toProfile(user), user };
}

export async function getPreferences(id: string): Promise<Record<string, unknown> | null> {
  const user = await userRepository.getUserById(id);
  if (!user) return null;
  const prefs = typeof user.preferences === 'object' && user.preferences !== null
    ? user.preferences as Record<string, unknown>
    : {};
  return preferencesSchema.parse(prefs);
}

export async function updatePreferences(
  id: string,
  input: Record<string, unknown>
): Promise<Record<string, unknown> | null> {
  const parsed = preferencesSchema.parse(input);
  const user = await userRepository.updatePreferences(id, parsed);
  if (!user) return null;
  const prefs = typeof user.preferences === 'object' && user.preferences !== null
    ? user.preferences as Record<string, unknown>
    : {};
  return preferencesSchema.parse(prefs);
}

export async function touchActivity(id: string): Promise<void> {
  await userRepository.updateLastActivity(id);
}

export { toProfile };
