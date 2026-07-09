import { API_BASE } from './config';
import { authFetch, accountFetch, usersFetch } from './fetch';
import { getDeviceInfo } from '$lib/utils/device';

export type { ApiErrorBody, FetchOptions } from './fetch';
export type { ApiErrorBody as ApiError } from './fetch';

export function mapEmailError(err: { error: { message: string; code?: string }; status: number }, context: 'verification' | 'password_reset' | 'general' = 'general'): string {
  const { status, error } = err;
  const message = error?.message || '';
  const code = error?.code || '';

  if (status === 0) {
    if (code === 'TIMEOUT') return 'Email service timed out. Please try again.';
    if (code === 'NETWORK_ERROR') return 'Network error. Please check your connection.';
    return 'Something went wrong while sending the email.';
  }

  if (status === 429) return 'Too many email requests. Please wait before trying again.';
  if (status === 422) return 'Email service is temporarily unavailable.';
  if (status === 404) return 'Email service is temporarily unavailable.';

  if (status >= 500) {
    if (context === 'verification') return 'Unable to send verification email. Please try again in a few minutes.';
    if (context === 'password_reset') return 'Unable to send reset email. Please try again in a few minutes.';
    return 'Unable to send email. Please try again in a few minutes.';
  }

  const lower = message.toLowerCase();
  if (lower.includes('rate limit') || lower.includes('rate_limit')) return 'Too many email requests. Please wait before trying again.';
  if (lower.includes('domain is not verified') || lower.includes('validation_error')) return 'Email service is temporarily unavailable.';
  if (lower.includes('timed out') || lower.includes('timeout')) return 'Email service timed out. Please try again.';
  if (lower.includes('network') || lower.includes('fetch')) return 'Network error. Please check your connection.';

  return message || 'Something went wrong while sending the email.';
}

// ── Types ────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  role: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionData {
  user: User;
  session: Session;
}

export interface AuthResponse {
  user: User;
  session: Session;
  token: string;
}

export interface ListedSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
  deviceId?: string;
  deviceName?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  lastSeen?: string;
}

// ── Auth API ─────────────────────────────────────────────────────

export async function getSession(): Promise<SessionData | null> {
  try {
    const data = await authFetch<SessionData>("/get-session");
    if ('error' in data) return null;
    return data;
  } catch {
    return null;
  }
}

export async function signIn(email: string, password: string, rememberMe?: boolean) {
  return authFetch<AuthResponse>("/sign-in/email", {
    method: "POST",
    body: { email, password, rememberMe, ...getDeviceInfo() },
  });
}

export async function signInWithGoogle(redirectTo?: string, errorRedirectTo?: string): Promise<string> {
  const frontendOrigin = window.location.origin;
  const returnTo = redirectTo || window.location.pathname + window.location.search;
  const callbackURL = `${frontendOrigin}${returnTo.startsWith('/') ? '' : '/'}${returnTo}`;
  const errorCallbackURL = errorRedirectTo
    ? `${frontendOrigin}${errorRedirectTo.startsWith('/') ? '' : '/'}${errorRedirectTo}`
    : undefined;
  const response = await fetch(`${API_BASE}/api/auth/sign-in/social`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      provider: "google",
      callbackURL,
      ...(errorCallbackURL ? { errorCallbackURL } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || body?.message || "Failed to initiate Google sign-in");
  }

  const data = await response.json();
  return data.url;
}

export async function signUp(name: string, email: string, password: string) {
  return authFetch<AuthResponse>("/sign-up/email", {
    method: "POST",
    body: { name, email, password, ...getDeviceInfo() },
  });
}

export async function signOut() {
  return authFetch<{ success: boolean }>("/sign-out", { method: "POST" });
}

export async function sendForgotPassword(email: string) {
  return authFetch<{ success: boolean }>("/request-password-reset", {
    method: "POST",
    body: { email },
  });
}

export async function resetPassword(token: string, newPassword: string) {
  return authFetch<{ success: boolean }>("/reset-password", {
    method: "POST",
    body: { token, newPassword },
  });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return authFetch<{ success: boolean }>("/change-password", {
    method: "POST",
    body: { currentPassword, newPassword },
  });
}

export async function sendVerificationEmail(email: string) {
  return authFetch<{ success: boolean }>("/send-verification-email", {
    method: "POST",
    body: { email },
  });
}

export async function listSessions() {
  return authFetch<ListedSession[]>("/list-sessions");
}

export async function touchSession() {
  return authFetch<{ success: boolean }>("/touch-session", { method: "POST" });
}

export async function revokeSession(sessionToken: string) {
  return authFetch<{ success: boolean }>("/revoke-session", {
    method: "POST",
    body: { token: sessionToken },
  });
}

export async function revokeOtherSessions() {
  return authFetch<{ success: boolean }>("/revoke-other-sessions", { method: "POST" });
}

// ── Account API (password check/set) ────────────────────────────

export async function checkHasPassword() {
  return accountFetch<{ hasPassword: boolean }>("/has-password");
}

export async function setPassword(newPassword: string) {
  return accountFetch<{ status: boolean }>("/set-password", {
    method: "POST",
    body: { newPassword },
  });
}

// ── Users API ────────────────────────────────────────────────────

export async function deleteAccount(password: string) {
  return usersFetch<{ success: boolean }>("/delete-account", {
    method: "POST",
    body: { password },
  });
}

// ── OAuth helpers ────────────────────────────────────────────────

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  state_mismatch: "Session expired or invalid. Please try signing in again.",
  account_not_linked: "A local account with this email already exists and cannot be linked. Try email and password sign-in instead.",
  access_denied: "Google sign-in was cancelled.",
  invalid_state: "The sign-in request expired or was tampered with. Please try again.",
  oauth_error: "An error occurred during Google sign-in. Please try again.",
  invalid_grant: "The authorization code expired. Please try signing in again.",
  provider_not_found: "Google sign-in is not configured. Please contact support.",
  email_not_found: "Google did not provide an email address. Please try a different account.",
  no_code: "Authorization code was missing. Please try again.",
  invalid_code: "The authorization code was invalid or expired. Please try again.",
  unable_to_get_user_info: "Could not retrieve your profile from Google. Please try again.",
  unable_to_link_account: "Could not link your Google account. Please try a different sign-in method.",
  unable_to_create_user: "Could not create your account. Please try again or contact support.",
  unable_to_create_session: "Could not create a session. Please try again.",
  internal_server_error: "Server error. Please try again in a few minutes.",
  signup_disabled: "New account registration via Google is currently disabled.",
  email_doesn_match: "The email from Google does not match your account email.",
  account_already_linked_to_different_user: "This Google account is already linked to a different user.",
  oauth_provider_not_found: "The OAuth provider is not configured.",
};

export function getOAuthErrorMessage(code: string, fallback?: string): string {
  return OAUTH_ERROR_MESSAGES[code] || fallback || "Google sign-in failed. Please try again.";
}

export function parseOAuthErrorFromParams(params: URLSearchParams): string | null {
  const error = params.get("error");
  if (!error) return null;
  const description = params.get("error_description");
  return getOAuthErrorMessage(error, description || undefined);
}
