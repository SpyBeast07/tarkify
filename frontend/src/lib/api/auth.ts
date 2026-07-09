const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:3009").replace(/\/+$/, "");
const AUTH_BASE = `${API_BASE}/api/auth`;
const REQUEST_TIMEOUT_MS = 15_000;

interface FetchOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string>;
}

export type ApiErrorBody = {
  error: { message: string; code?: string };
  status: number;
};

async function authFetch<T>(path: string, opts: FetchOptions = {}): Promise<T | ApiErrorBody> {
  let url = `${AUTH_BASE}${path}`;
  if (opts.query) {
    const params = new URLSearchParams(opts.query);
    url += `?${params}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: opts.method || "GET",
      headers: {
        "Accept": "application/json",
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: "include",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: "Request failed" }));
      return { error: errorBody, status: response.status };
    }

    return response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      return { error: { message: "Request timed out", code: "TIMEOUT" }, status: 0 };
    }
    if (err instanceof TypeError) {
      return { error: { message: "Network error", code: "NETWORK_ERROR" }, status: 0 };
    }
    if (err instanceof SyntaxError) {
      return { error: { message: "Invalid server response", code: "PARSE_ERROR" }, status: 0 };
    }
    return { error: { message: "Request failed", code: "UNKNOWN" }, status: 0 };
  }
}

export type ApiError = ApiErrorBody;

export function mapEmailError(err: ApiErrorBody, context: 'verification' | 'password_reset' | 'general' = 'general'): string {
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

export async function getSession(): Promise<SessionData | null> {
  try {
    const data = await authFetch<SessionData>("/get-session");
    if ('error' in data) return null;
    return data;
  } catch {
    return null;
  }
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function withDevice(body: Record<string, unknown>): Record<string, unknown> {
  if (typeof localStorage === 'undefined') return body;
  try {
    let raw = localStorage.getItem('tarkify_device_id');
    if (!raw) {
      raw = generateId();
      localStorage.setItem('tarkify_device_id', raw);
    }
    const ua = navigator.userAgent;
    let browserName = 'Unknown', osName = 'Unknown', deviceType = 'desktop';
    if (ua.includes('Firefox')) browserName = 'Firefox';
    else if (ua.includes('Chrome')) browserName = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browserName = 'Safari';
    else if (ua.includes('Edge')) browserName = 'Edge';
    if (ua.includes('Windows')) osName = 'Windows';
    else if (ua.includes('Mac OS')) osName = 'macOS';
    else if (ua.includes('Linux') && !ua.includes('Android')) osName = 'Linux';
    else if (ua.includes('Android')) osName = 'Android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) osName = 'iOS';
    if (/Mobi|Android/i.test(ua)) deviceType = 'mobile';
    else if (/iPad|Tablet/i.test(ua)) deviceType = 'tablet';
    return {
      ...body,
      deviceId: raw,
      deviceName: `${browserName} on ${osName}`,
      deviceType,
      browser: browserName,
      os: osName,
    };
  } catch {
    return body;
  }
}

export async function signIn(email: string, password: string, rememberMe?: boolean) {
  return authFetch<{ user: User; session: Session; token: string }>("/sign-in/email", {
    method: "POST",
    body: withDevice({ email, password, rememberMe }),
  });
}

export async function signInWithGoogle(redirectTo?: string, errorRedirectTo?: string): Promise<string> {
  const frontendOrigin = window.location.origin;
  const returnTo = redirectTo || window.location.pathname + window.location.search;
  const callbackURL = `${frontendOrigin}${returnTo.startsWith('/') ? '' : '/'}${returnTo}`;
  const errorCallbackURL = errorRedirectTo
    ? `${frontendOrigin}${errorRedirectTo.startsWith('/') ? '' : '/'}${errorRedirectTo}`
    : undefined;
  const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:3009").replace(/\/+$/, "");

  const response = await fetch(`${apiBase}/api/auth/sign-in/social`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  return authFetch<{ user: User; session: Session; token: string }>("/sign-up/email", {
    method: "POST",
    body: withDevice({ name, email, password }),
  });
}

export async function signOut() {
  return authFetch<Record<string, unknown>>("/sign-out", { method: "POST" });
}

export async function sendForgotPassword(email: string) {
  return authFetch<Record<string, unknown>>("/request-password-reset", {
    method: "POST",
    body: { email },
  });
}

export async function resetPassword(token: string, newPassword: string) {
  return authFetch<Record<string, unknown>>("/reset-password", {
    method: "POST",
    body: { token, newPassword },
  });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return authFetch<Record<string, unknown>>("/change-password", {
    method: "POST",
    body: { currentPassword, newPassword },
  });
}

export async function sendVerificationEmail(email: string) {
  return authFetch<Record<string, unknown>>("/send-verification-email", {
    method: "POST",
    body: { email },
  });
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

export async function listSessions(): Promise<ListedSession[] | ApiErrorBody> {
  return authFetch<ListedSession[]>("/list-sessions");
}

export async function touchSession() {
  return authFetch<Record<string, unknown>>("/touch-session", { method: "POST" });
}

export async function revokeSession(sessionToken: string) {
  return authFetch<Record<string, unknown>>("/revoke-session", {
    method: "POST",
    body: { token: sessionToken },
  });
}

export async function revokeOtherSessions() {
  return authFetch<Record<string, unknown>>("/revoke-other-sessions", { method: "POST" });
}

const USERS_BASE = `${API_BASE}/api/users`;

async function usersFetch<T>(path: string, opts: FetchOptions = {}): Promise<T | ApiErrorBody> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${USERS_BASE}${path}`, {
      method: opts.method || "GET",
      headers: {
        "Accept": "application/json",
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      credentials: "include",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: "Request failed" }));
      return { error: errorBody, status: response.status };
    }

    return response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      return { error: { message: "Request timed out", code: "TIMEOUT" }, status: 0 };
    }
    if (err instanceof TypeError) {
      return { error: { message: "Network error", code: "NETWORK_ERROR" }, status: 0 };
    }
    if (err instanceof SyntaxError) {
      return { error: { message: "Invalid server response", code: "PARSE_ERROR" }, status: 0 };
    }
    return { error: { message: "Request failed", code: "UNKNOWN" }, status: 0 };
  }
}

export async function deleteAccount(password: string) {
  return usersFetch<Record<string, unknown>>("/delete-account", {
    method: "POST",
    body: { password },
  });
}
