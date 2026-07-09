import { API_BASE } from './config';

const REQUEST_TIMEOUT_MS = 15_000;

export interface FetchOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string>;
}

export type ApiErrorBody = {
  error: { message: string; code?: string };
  status: number;
};

/**
 * Creates a typed fetch wrapper bound to a base URL.
 * All auth/account/users API modules share this implementation.
 */
export function createApiFetch(baseUrl: string) {
  return async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T | ApiErrorBody> {
    let url = `${baseUrl}${path}`;
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
  };
}

/** Pre-configured fetch wrapper for the auth API (/api/auth). */
export const authFetch = createApiFetch(`${API_BASE}/api/auth`);

/** Pre-configured fetch wrapper for the account API (/api/account). */
export const accountFetch = createApiFetch(`${API_BASE}/api/account`);

/** Pre-configured fetch wrapper for the users API (/api/users). */
export const usersFetch = createApiFetch(`${API_BASE}/api/users`);
