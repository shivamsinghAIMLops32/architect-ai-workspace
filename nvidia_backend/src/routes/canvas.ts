import { Hono } from 'hono';
import { z } from 'zod';
import { asc, eq } from 'drizzle-orm';
import { db } from '../db';
import { nodes, edges, chatHistory, projects } from '../db/schema';
import { designArchitecture } from '../services/ai-orchestrator';

// ─────────────────────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────────────────────

const DesignSchema = z.object({
  prompt: z.string().min(1, 'Prompt cannot be empty'),
});

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────

const canvasRouter = new Hono();

/**
 * GET /api/canvas/:projectId
 *
 * Returns the COMPLETE initial state needed to hydrate the canvas when a
 * user first loads a project:
 *   - project metadata
 *   - all nodes (with positions and data)
 *   - all edges (source/target relationships)
 *   - full chat history (ordered oldest → newest for display)
 *
 * This is the single network request the frontend makes on page load.
 */
canvasRouter.get('/:projectId', async (c) => {
  const projectId = c.req.param('projectId')!;

  try {
    // Verify the project exists first to return a proper 404
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
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
 * Use this when the frontend doesn't have an active WebSocket connection,
 * or for programmatic / server-to-server calls.
 *
 * For real-time streaming with the typing effect, use the WebSocket
 * AI_CHAT_STREAM message instead.
 *
 * Body: { prompt: string }
 * Returns: { data: { architecture, code, savedNodeIds, savedEdgeIds } }
 */
canvasRouter.post('/:projectId/design', async (c) => {
  const projectId = c.req.param('projectId')!;

  // Verify project exists
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
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
    const result = await designArchitecture(parsed.data.prompt, projectId);
    return c.json({ data: result }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Orchestration failed';
    console.error(`[canvas] POST /${projectId}/design error:`, message);
    return c.json({ error: message }, 500);
  }
});

export default canvasRouter;
