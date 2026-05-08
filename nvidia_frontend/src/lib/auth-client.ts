import { createAuthClient } from 'better-auth/react';

/**
 * Better Auth React client.
 *
 * Points to the Hono backend's auth handler at /api/auth/*.
 * `credentials: 'include'` is set globally so session cookies are sent
 * on every request, enabling cross-origin cookie-based sessions.
 *
 * Usage:
 *   import { authClient } from '@/lib/auth-client';
 *
 *   // In a React Server Component / action:
 *   const session = await authClient.getSession();
 *
 *   // In a Client Component:
 *   const { data: session, isPending } = authClient.useSession();
 */
export const authClient = createAuthClient({
  /** Base URL of the backend auth server — no trailing slash. */
  baseURL: 'http://localhost:3000',

  fetchOptions: {
    /**
     * Always include cookies so the HttpOnly session cookie is forwarded
     * on every auth request, regardless of cross-origin restrictions.
     */
    credentials: 'include',
  },
});

// ── Named exports for convenience ────────────────────────────────────────────
export const { signIn, signUp, signOut, useSession, getSession } = authClient;
