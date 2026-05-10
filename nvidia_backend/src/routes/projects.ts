import { Hono } from 'hono';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { projects } from '../db/schema';
import type { AuthVariables } from '../middleware/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────────────────────

const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer'),
});

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────

const projectsRouter = new Hono<{ Variables: AuthVariables }>();

/**
 * GET /api/projects
 * List the current user's projects, newest first.
 * Only returns projects owned by the authenticated user.
 */
projectsRouter.get('/', async (c) => {
  const user = c.get('user');

  try {
    const allProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, user.id))
      .orderBy(desc(projects.createdAt));

    return c.json({ data: allProjects });
  } catch (err) {
    console.error('[projects] GET / error:', err);
    return c.json({ error: 'Failed to fetch projects' }, 500);
  }
});

/**
 * GET /api/projects/:projectId
 * Fetch a single project by ID — only if it belongs to the current user.
 */
projectsRouter.get('/:projectId', async (c) => {
  const projectId = c.req.param('projectId')!;
  const user = c.get('user');

  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
      .limit(1);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json({ data: project });
  } catch (err) {
    console.error(`[projects] GET /${projectId} error:`, err);
    return c.json({ error: 'Failed to fetch project' }, 500);
  }
});

/**
 * POST /api/projects
 * Create a new project (new canvas board) owned by the current user.
 * Body: { name: string }
 */
projectsRouter.post('/', async (c) => {
  const user = c.get('user');

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400);
  }

  const parsed = CreateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', issues: parsed.error.issues }, 400);
  }

  try {
    const id = crypto.randomUUID();
    const [project] = await db
      .insert(projects)
      .values({ id, name: parsed.data.name, userId: user.id })
      .returning();

    return c.json({ data: project }, 201);
  } catch (err) {
    console.error('[projects] POST / error:', err);
    return c.json({ error: 'Failed to create project' }, 500);
  }
});

/**
 * DELETE /api/projects/:projectId
 * Delete a project and all its nodes, edges, and chat history
 * (ON DELETE CASCADE handles the child rows automatically).
 * Only the owner can delete.
 */
projectsRouter.delete('/:projectId', async (c) => {
  const projectId = c.req.param('projectId')!;
  const user = c.get('user');

  try {
    const deleted = await db
      .delete(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
      .returning({ id: projects.id });

    if (deleted.length === 0) {
      return c.json({ error: 'Project not found' }, 404);
    }

    return c.json({ success: true, deleted: deleted[0] });
  } catch (err) {
    console.error(`[projects] DELETE /${projectId} error:`, err);
    return c.json({ error: 'Failed to delete project' }, 500);
  }
});

export default projectsRouter;
