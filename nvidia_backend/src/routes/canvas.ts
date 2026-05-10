import { Hono } from 'hono';
import { z } from 'zod';
import { asc, eq, and } from 'drizzle-orm';
import { db } from '../db';
import { nodes, edges, chatHistory, projects } from '../db/schema';
import { designArchitecture } from '../services/ai-orchestrator';
import type { AuthVariables } from '../middleware/auth';

// ─────────────────────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────────────────────

const DesignSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty'),
});

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────

const canvasRouter = new Hono<{ Variables: AuthVariables }>();

/**
 * GET /api/canvas/:projectId
 *
 * Returns the COMPLETE initial state needed to hydrate the canvas when a
 * user first loads a project. Verifies the user owns the project.
 */
canvasRouter.get('/:projectId', async (c) => {
  const projectId = c.req.param('projectId')!;
  const user = c.get('user');

  try {
    // Verify the project exists AND belongs to the user
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
      .limit(1);

    if (!project) {
      return c.json({ error: 'Project not found or access denied' }, 404);
    }

    // Fetch all canvas data in parallel — 3 independent queries
    const [projectNodes, projectEdges, projectChat] = await Promise.all([
      db
        .select()
        .from(nodes)
        .where(eq(nodes.projectId, projectId)),

      db
        .select()
        .from(edges)
        .where(eq(edges.projectId, projectId)),

      db
        .select()
        .from(chatHistory)
        .where(eq(chatHistory.projectId, projectId))
        .orderBy(asc(chatHistory.id)), // oldest first for chronological display
    ]);

    return c.json({
      data: {
        project,
        nodes: projectNodes,
        edges: projectEdges,
        chatHistory: projectChat,
      },
    });
  } catch (err) {
    console.error(`[canvas] GET /${projectId} error:`, err);
    return c.json({ error: 'Failed to load canvas state' }, 500);
  }
});

/**
 * POST /api/canvas/:projectId/design
 *
 * REST (non-streaming) entry point for the two-agent pipeline.
 * Verifies ownership before allowing generation.
 */
canvasRouter.post('/:projectId/design', async (c) => {
  const projectId = c.req.param('projectId')!;
  const user = c.get('user');

  // Verify project exists AND belongs to user
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, user.id)))
    .limit(1);

  if (!project) {
    return c.json({ error: 'Project not found or access denied' }, 404);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Request body must be valid JSON' }, 400);
  }

  const parsed = DesignSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', issues: parsed.error.issues }, 400);
  }

  try {
    // For non-streaming REST, we wrap the prompt in the format expected by the orchestrator
    const messages: { role: 'user', content: string }[] = [{ role: 'user', content: parsed.data.prompt }];
    const result = await designArchitecture(messages, projectId);
    return c.json({ data: result }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Orchestration failed';
    console.error(`[canvas] POST /${projectId}/design error:`, message);
    return c.json({ error: message }, 500);
  }
});

export default canvasRouter;
