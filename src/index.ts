import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './env';
import aiRoutes from './routes/ai';
import wsRouter, { websocket } from './routes/ws';
import projectsRouter from './routes/projects';
import canvasRouter from './routes/canvas';

const app = new Hono();

// ── Global Middleware ──────────────────────────────────────────────────────
app.use('*', cors());

// ── HTTP Routes ────────────────────────────────────────────────────────────
app.route('/api', aiRoutes);           // Existing AI routes  →  /api/generate
app.route('/api/projects', projectsRouter); // Project CRUD      →  /api/projects
app.route('/api/canvas', canvasRouter);     // Canvas state      →  /api/canvas/:id
app.route('/', wsRouter);                  // WS upgrade route  →  /ws/projects/:id

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Bun Server Export ──────────────────────────────────────────────────────
// `fetch` handles all HTTP requests (including the WS upgrade handshake).
// `websocket` is Bun's native handler for the WebSocket lifecycle after
// the upgrade — it must live here at the top-level server config.
export default {
  port: parseInt(env.PORT),
  idleTimeout: 255,
  fetch: app.fetch,
  websocket,            // Bun-native WS lifecycle (open/message/close/error)
};