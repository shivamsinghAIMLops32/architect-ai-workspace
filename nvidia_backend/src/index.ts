import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './env';
import aiRoutes from './routes/ai';
import wsRouter, { websocket } from './routes/ws';
import projectsRouter from './routes/projects';
import canvasRouter from './routes/canvas';
import { auth } from './lib/auth';
import { requireAuth } from './middleware/auth';
import type { AuthVariables } from './middleware/auth';

// Typed app — c.get('user') and c.get('session') are fully inferred in
// any handler that runs after the requireAuth middleware.
const app = new Hono<{ Variables: AuthVariables }>();

// ── Global Middleware ──────────────────────────────────────────────────────
app.use('*', cors());

// ── Auth Routes (public) ───────────────────────────────────────────────────
// This single line exposes all Better Auth endpoints:
//   POST /api/auth/sign-up/email
//   POST /api/auth/sign-in/email
//   POST /api/auth/sign-out
//   GET  /api/auth/session
//   ...and more — all handled internally by Better Auth
app.all('/api/auth/*', (c) => auth.handler(c.req.raw));

// ── Route Protection ───────────────────────────────────────────────────────
// Apply requireAuth BEFORE mounting the routers so unauthenticated requests
// are rejected at the middleware layer, never reaching handler logic.
app.use('/api/projects/*', requireAuth);
app.use('/api/canvas/*', requireAuth);
app.use('/ws/projects/*', requireAuth); // runs during the HTTP upgrade handshake

// ── Protected HTTP Routes ──────────────────────────────────────────────────
app.route('/api', aiRoutes);                  // /api/generate (SSE)
app.route('/api/projects', projectsRouter);   // /api/projects CRUD
app.route('/api/canvas', canvasRouter);       // /api/canvas/:id + /design
app.route('/', wsRouter);                     // /ws/projects/:projectId

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Bun Server Export ──────────────────────────────────────────────────────
export default {
  port: parseInt(env.PORT),
  idleTimeout: 255,
  fetch: app.fetch,
  websocket,
};