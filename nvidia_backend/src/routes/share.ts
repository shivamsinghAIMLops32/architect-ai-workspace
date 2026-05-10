import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { projects, nodes, edges } from '../db/schema';
import type { AuthVariables } from '../middleware/auth';
import { requireAuth } from '../middleware/auth';

const shareRouter = new Hono<{ Variables: AuthVariables }>();

/**
 * POST /api/share/generate/:projectId
 * 
 * Generate a share token for a project. Must be the owner.
 * This route is PROTECTED.
 */
shareRouter.post('/generate/:projectId', requireAuth, async (c) => {
  const projectId = c.req.param('projectId')!;
  const user = c.get('user');

  try {
    // 1. Verify ownership
    const [project] = await db
      .select({ id: projects.id, shareToken: projects.shareToken })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
      .limit(1);

    if (!project) {
      return c.json({ error: 'Project not found or access denied' }, 404);
    }

    // 2. Generate token if none exists, or reuse existing
    const shareToken = project.shareToken || crypto.randomUUID().replace(/-/g, '').slice(0, 21);

    // 3. Save to DB
    if (!project.shareToken) {
      await db
        .update(projects)
        .set({ shareToken })
        .where(eq(projects.id, projectId));
    }

    return c.json({ data: { shareToken } });
  } catch (err) {
    console.error(`[share] POST /generate/${projectId} error:`, err);
    return c.json({ error: 'Failed to generate share link' }, 500);
  }
});

/**
 * GET /api/share/:token
 * 
 * Fetch a shared project by its token.
 * This route is PUBLIC.
 */
shareRouter.get('/:token', async (c) => {
  const token = c.req.param('token')!;

  try {
    // 1. Find project by token
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.shareToken, token))
      .limit(1);

    if (!project) {
      return c.json({ error: 'Shared project not found' }, 404);
    }

    // 2. Fetch nodes and edges (NO chat history for public view)
    const [projectNodes, projectEdges] = await Promise.all([
      db.select().from(nodes).where(eq(nodes.projectId, project.id)),
      db.select().from(edges).where(eq(edges.projectId, project.id)),
    ]);

    return c.json({
      data: {
        project: { id: project.id, name: project.name, createdAt: project.createdAt },
        nodes: projectNodes,
        edges: projectEdges,
      },
    });
  } catch (err) {
    console.error(`[share] GET /${token} error:`, err);
    return c.json({ error: 'Failed to load shared canvas' }, 500);
  }
});

export default shareRouter;
