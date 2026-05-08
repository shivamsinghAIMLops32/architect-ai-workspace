import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';
import { user, session, account, verification } from '../db/schema';
import { env } from '../env';

// ─────────────────────────────────────────────────────────────────────────────
// Better Auth instance
//
// The drizzleAdapter maps Better Auth's internal table references to our
// Drizzle schema exports. Passing the schema objects explicitly (instead of
// relying on auto-discovery) prevents mismatches on non-standard table names.
// ─────────────────────────────────────────────────────────────────────────────

export const auth = betterAuth({
  // ── Signing secret ──────────────────────────────────────────────────────
  // Used to sign session tokens and cookies. Must be ≥ 32 chars.
  // Generate a safe value with: openssl rand -base64 32
  secret: env.BETTER_AUTH_SECRET,

  // ── Base URL ─────────────────────────────────────────────────────────────
  // Used to build absolute redirect/callback URLs and set the cookie domain.
  // In production, set BETTER_AUTH_URL to your public domain.
  baseURL: env.BETTER_AUTH_URL,

  // ── Trusted origins ───────────────────────────────────────────────────────
  // Allows cross-origin cookie operations from the Next.js frontend.
  // Must match the frontend's exact origin (no trailing slash).
  trustedOrigins: ['http://localhost:3001'],

  // ── Database adapter ─────────────────────────────────────────────────────
  database: drizzleAdapter(db, {
    provider: 'pg',
    // Explicit schema mapping — required because our table exports use
    // camelCase JS names that must align with Better Auth's internal keys.
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),

  // ── Email & Password auth ─────────────────────────────────────────────────
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // No email verification step for now
    // Password hashing is handled internally by Better Auth (argon2 / bcrypt)
  },
});

// ── Type Helpers ──────────────────────────────────────────────────────────────
// Infer the session shape from the auth instance so middleware can be
// fully typed without duplicating the interface manually.
export type AuthSession = typeof auth.$Infer.Session.session;
export type AuthUser    = typeof auth.$Infer.Session.user;
