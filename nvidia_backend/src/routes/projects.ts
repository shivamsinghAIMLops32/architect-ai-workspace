import { Hono } from 'hono';
import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db';
import { projects } from '../db/schema';

// ─────────────────────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────────────────────

const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer'),
});

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────

const projectsRouter = new Hono();

/**
 * GET /api/projects
 * List all projects, newest first.
 */
projectsRouter.get('/', async (c) => {
  try {
    const allProjects = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));

    return c.json({ data: allProjects });
  } catch (err) {
    console.error('[projects] GET / error:', err);
    return c.json({ error: 'Failed to fetch projects' }, 500);
  }
});

/**
 * GET /api/projects/:projectId
 * Fetch a single project by ID.
 */
projectsRouter.get('/:projectId', async (c) => {
  const projectId = c.req.param('projectId')!;

  try {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
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
 * Create a new project (new canvas board).
 * Body: { name: string }
 */
projectsRouter.post('/', async (c) => {
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
      .values({ id, name: parsed.data.name })
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
 */
projectsRouter.delete('/:projectId', async (c) => {
  const projectId = c.req.param('projectId')!;

  try {
    const deleted = await db
      .delete(projects)
      .where(eq(projects.id, projectId))
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
