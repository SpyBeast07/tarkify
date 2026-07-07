const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3009";
const AUTH_BASE = `${API_BASE}/api/auth`;

interface FetchOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string>;
}

async function authFetch<T = any>(path: string, opts: FetchOptions = {}): Promise<T> {
  let url = `${AUTH_BASE}${path}`;

  if (opts.query) {
    const params = new URLSearchParams(opts.query);
    url += `?${params}`;
  }

  const response = await fetch(url, {
    method: opts.method || "GET",
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    return { error, status: response.status } as T;
  }

  return response.json();
}

export type ApiError = { error: { message: string; code?: string }; status: number };

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
    const data = await authFetch<{ user: User; session: Session } | ApiError>("/get-session");
    if ('error' in data) return null;
    return data as SessionData;
  } catch {
    return null;
  }
}

export async function signIn(email: string, password: string, rememberMe?: boolean) {
  return authFetch("/sign-in/email", {
    method: "POST",
    body: { email, password, rememberMe },
  });
}

export async function signUp(name: string, email: string, password: string) {
  return authFetch("/sign-up/email", {
    method: "POST",
    body: { name, email, password },
  });
}

export async function signOut() {
  return authFetch("/sign-out", { method: "POST" });
}

export async function sendForgotPassword(email: string) {
  return authFetch("/request-password-reset", {
    method: "POST",
    body: { email },
  });
}

export async function resetPassword(token: string, newPassword: string) {
  return authFetch("/reset-password", {
    method: "POST",
    body: { token, newPassword },
  });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return authFetch("/change-password", {
    method: "POST",
    body: { currentPassword, newPassword },
  });
}

export async function sendVerificationEmail(email: string) {
  return authFetch("/send-verification-email", {
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
}

export async function listSessions(): Promise<ListedSession[]> {
  return authFetch<ListedSession[]>("/list-sessions");
}

export async function revokeSession(sessionToken: string) {
  return authFetch("/revoke-session", {
    method: "POST",
    body: { token: sessionToken },
  });
}

export async function revokeOtherSessions() {
  return authFetch("/revoke-other-sessions", { method: "POST" });
}

const USERS_BASE = `${API_BASE}/api/users`;

async function usersFetch<T = any>(path: string, opts: FetchOptions = {}): Promise<T> {
  let url = `${USERS_BASE}${path}`;

  const response = await fetch(url, {
    method: opts.method || "GET",
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    return { error, status: response.status } as T;
  }

  return response.json();
}

export async function deleteAccount(password: string) {
  return usersFetch("/delete-account", {
    method: "POST",
    body: { password },
  });
}
