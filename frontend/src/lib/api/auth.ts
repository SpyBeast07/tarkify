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

export async function signIn(email: string, password: string, rememberMe?: boolean) {
  return authFetch<{ user: User; session: Session; token: string }>("/sign-in/email", {
    method: "POST",
    body: { email, password, rememberMe },
  });
}

export async function signUp(name: string, email: string, password: string) {
  return authFetch<{ user: User; session: Session; token: string }>("/sign-up/email", {
    method: "POST",
    body: { name, email, password },
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
}

export async function listSessions(): Promise<ListedSession[] | ApiErrorBody> {
  return authFetch<ListedSession[]>("/list-sessions");
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
