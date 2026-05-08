import { headers } from 'next/headers';
import { ApiError } from './api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

/**
 * Server-only fetch wrapper.
 * Automatically extracts the `Cookie` header from the incoming Next.js request
 * and forwards it to the backend so the Better Auth session is recognized during SSR.
 */
async function serverRequest<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const reqHeaders = await headers();
  const cookie = reqHeaders.get('cookie') || '';

  const url = `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
      Cookie: cookie, // Forward the authentication cookie
    },
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const err = await response.json() as { message?: string; error?: string };
      message = err.message ?? err.error ?? message;
    } catch {
      // Ignore JSON parse errors
    }
    throw new ApiError(response.status, response.statusText, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const serverApi = {
  get: <T = unknown>(path: string, init?: RequestInit) =>
    serverRequest<T>(path, { method: 'GET', ...init }),
};
