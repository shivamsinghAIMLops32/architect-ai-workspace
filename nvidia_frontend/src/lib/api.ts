/**
 * src/lib/api.ts
 *
 * Typed fetch wrapper for all HTTP calls to the Hono backend.
 *
 * Key design decisions:
 *  - `credentials: 'include'` is set on EVERY request so the HttpOnly session
 *    cookie (managed by Better Auth) is always forwarded cross-origin.
 *  - The base URL is read from the NEXT_PUBLIC_API_URL env var so it works
 *    in both dev (http://localhost:3000/api) and production environments.
 *  - Throws a structured ApiError on non-2xx responses so callers can
 *    discriminate between auth errors (401) and other failures.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

// ── Error Type ────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Core Fetch Wrapper ────────────────────────────────────────────────────────

type RequestOptions = Omit<RequestInit, 'body'> & {
  /** JSON body — will be serialised and Content-Type set automatically. */
  data?: unknown;
  /** Raw body string (if you need to bypass JSON serialisation). */
  body?: BodyInit;
};

async function request<T = unknown>(
  path: string,
  { data, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const response = await fetch(url, {
    // ── Credentials ─────────────────────────────────────────────────────────
    // ALWAYS include cookies. Required for Better Auth's HttpOnly session
    // cookie to be forwarded on cross-origin requests.
    credentials: 'include',

    headers: {
      ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },

    body: data !== undefined ? JSON.stringify(data) : init.body,

    ...init,
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const err = (await response.json()) as { message?: string; error?: string };
      message = err.message ?? err.error ?? message;
    } catch {
      // Response body wasn't JSON — use status text as-is.
    }
    throw new ApiError(response.status, response.statusText, message);
  }

  // Return parsed JSON, or undefined for 204 No Content.
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// ── HTTP Method Shortcuts ─────────────────────────────────────────────────────

export const api = {
  /** GET /api/<path> */
  get: <T = unknown>(path: string, init?: Omit<RequestOptions, 'data'>) =>
    request<T>(path, { method: 'GET', ...init }),

  /** POST /api/<path> with JSON body */
  post: <T = unknown>(path: string, data?: unknown, init?: RequestOptions) =>
    request<T>(path, { method: 'POST', data, ...init }),

  /** PUT /api/<path> with JSON body */
  put: <T = unknown>(path: string, data?: unknown, init?: RequestOptions) =>
    request<T>(path, { method: 'PUT', data, ...init }),

  /** PATCH /api/<path> with JSON body */
  patch: <T = unknown>(path: string, data?: unknown, init?: RequestOptions) =>
    request<T>(path, { method: 'PATCH', data, ...init }),

  /** DELETE /api/<path> */
  delete: <T = unknown>(path: string, init?: RequestOptions) =>
    request<T>(path, { method: 'DELETE', ...init }),
};

export default api;
