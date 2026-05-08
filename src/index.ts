import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { env } from './env';
import aiRoutes from './routes/ai';

const app = new Hono();

app.use('*', cors()); // Enable for local dev
app.route('/api', aiRoutes); // Mount AI routes under /api
app.get('/health', (c) => c.text('the server is up and healthy')); // Basic health route

export default {
  port: parseInt(env.PORT),
  idleTimeout: 255,
  fetch: app.fetch,
};