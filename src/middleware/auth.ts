import { createMiddleware } from 'hono/factory';
import { auth } from '../lib/auth';
import type { AuthUser, AuthSession } from '../lib/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Context Variable Types
//
// Declare the shape of values we attach to the Hono context so any route
// handler that runs after this middleware gets full type inference on
// `c.get('user')` and `c.get('session')`.
// ─────────────────────────────────────────────────────────────────────────────

export type AuthVariables = {
  user: AuthUser;
  session: AuthSession;
};

// ─────────────────────────────────────────────────────────────────────────────
// requireAuth middleware
//
// Usage in index.ts:
//   app.use('/api/projects/*', requireAuth);
//   app.use('/api/canvas/*', requireAuth);
//   app.use('/ws/projects/*', requireAuth);
//
// Inside a protected route handler:
//   const user = c.get('user');   // AuthUser — always defined after this middleware
//   const session = c.get('session'); // AuthSession
// ─────────────────────────────────────────────────────────────────────────────

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    let sessionData: { user: AuthUser; session: AuthSession } | null = null;

    try {
      sessionData = await auth.api.getSession({
        headers: c.req.raw.headers,
      });
    } catch (err) {
      console.error('[auth] getSession error:', err);
      return c.json({ error: 'Authentication service unavailable' }, 503);
    }

    if (!sessionData) {
      return c.json(
        {
          error: 'Unauthorized',
          message: 'A valid session cookie or Bearer token is required.',
        },
        401,
      );
    }

    // Attach user and session to context for downstream handlers
    c.set('user', sessionData.user);
    c.set('session', sessionData.session);

    await next();
  },
);
