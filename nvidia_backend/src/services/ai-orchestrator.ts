import { nvidia } from '../lib/nvidia';
import { NIM_MODELS } from '../config/model';
import { db } from '../db';
import { nodes, edges, chatHistory } from '../db/schema';
import type { NewNode, NewEdge } from '../db/schema';

// ─────────────────────────────────────────────────────────────────────────────
// Types — what the Architect agent must return
// ─────────────────────────────────────────────────────────────────────────────

export interface ArchitectNode {
  id: string;          // e.g. "lb-1"
  type: string;        // e.g. "load_balancer"
  label: string;       // e.g. "Nginx Load Balancer"
  position_x: number;
  position_y: number;
  data: Record<string, unknown>; // arbitrary metadata
}

export interface ArchitectEdge {
  id: string;          // e.g. "edge-lb1-api1"
  source: string;      // node id
  target: string;      // node id
}

export interface ArchitectOutput {
  nodes: ArchitectNode[];
  edges: ArchitectEdge[];
}

export interface OrchestratorResult {
  architecture: ArchitectOutput;
  code: string;
  savedNodeIds: string[];
  savedEdgeIds: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage 1 — Architect Agent (Llama-3.3-70b)
// Converts a free-text prompt into a strict JSON graph of nodes + edges.
// ─────────────────────────────────────────────────────────────────────────────

const ARCHITECT_SYSTEM_PROMPT = `You are a senior infrastructure architect.
The user will describe a system they want to build.
Your ONLY job is to output a valid JSON object that maps that system as a graph.

Rules:
1. Respond with ONLY raw JSON — no markdown fences, no explanation, no preamble.
2. The JSON must have exactly two top-level keys: "nodes" and "edges".
3. Each node must have: id (string), type (string), label (string), position_x (number), position_y (number), data (object).
4. Each edge must have: id (string), source (string, a node id), target (string, a node id).
5. Lay out nodes on a 200-unit grid (e.g., 0, 200, 400...) to give the canvas meaningful coordinates.
6. Node types should be concise snake_case identifiers: load_balancer, api_server, database, cache, message_queue, cdn, storage, etc.
7. Produce between 3 and 12 nodes. Keep the design realistic.

Example output shape:
{
  "nodes": [
    { "id": "lb-1", "type": "load_balancer", "label": "Nginx LB", "position_x": 0, "position_y": 200, "data": { "replicas": 1 } }
  ],
  "edges": [
    { "id": "edge-lb1-api1", "source": "lb-1", "target": "api-1" }
  ]
}`;

async function runArchitectAgent(prompt: string): Promise<ArchitectOutput> {
  const response = await nvidia.chat.completions.create({
    model: NIM_MODELS.BALANCED, // meta/llama-3.3-70b-instruct
    messages: [
      { role: 'system', content: ARCHITECT_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,   // low temp = deterministic JSON
    max_tokens: 2048,
    stream: false,
  });

  const raw = response.choices[0]?.message?.content ?? '';

  try {
    const parsed = JSON.parse(raw) as ArchitectOutput;

    // Validate the shape minimally before trusting it
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      throw new Error('Architect agent returned invalid shape — missing nodes or edges array');
    }

    return parsed;
  } catch {
    throw new Error(`Architect agent returned non-JSON output:\n${raw}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage 2 — Coder Agent (Qwen-2.5-Coder-32b)
// Takes the architecture JSON and generates a docker-compose / config snippet.
// ─────────────────────────────────────────────────────────────────────────────

const CODER_SYSTEM_PROMPT = `You are an expert DevOps engineer who writes clean, production-ready configuration code.
The user will provide a JSON description of an infrastructure architecture (nodes and edges).
Your job is to generate the most appropriate configuration file for that architecture.

Rules:
1. Prefer docker-compose.yml if the architecture involves multiple services.
2. Add Nginx config blocks where a load_balancer node exists.
3. Include environment variable stubs (no real secrets) and health check directives.
4. Output ONLY the configuration file content — no explanation outside of code comments.
5. Use clear YAML/config comments to annotate each section with the corresponding node label.`;

async function runCoderAgent(architecture: ArchitectOutput): Promise<string> {
  const architectureJson = JSON.stringify(architecture, null, 2);

  const response = await nvidia.chat.completions.create({
    model: NIM_MODELS.CODING, // qwen/qwen2.5-coder-32b-instruct
    messages: [
      { role: 'system', content: CODER_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Generate the configuration code for this architecture:\n\n${architectureJson}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 4096,
    stream: false,
  });

  return response.choices[0]?.message?.content ?? '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Stage 3 — Persistence
// Saves nodes + edges from the Architect's output to Neon via Drizzle.
// ─────────────────────────────────────────────────────────────────────────────

async function persistToDatabase(
  projectId: string,
  architecture: ArchitectOutput,
  userPrompt: string,
  generatedCode: string,
): Promise<{ savedNodeIds: string[]; savedEdgeIds: string[] }> {
  // Map Architect nodes → Drizzle NewNode shape
  const nodeRows: NewNode[] = architecture.nodes.map((n) => ({
    id: `${projectId}-${n.id}`,
    projectId,
    type: n.type,
    label: n.label,
    positionX: n.position_x,
    positionY: n.position_y,
    dataJson: n.data ?? {},
  }));

  // Map Architect edges → Drizzle NewEdge shape (ids must reference the prefixed node ids)
  const edgeRows: NewEdge[] = architecture.edges.map((e) => ({
    id: `${projectId}-${e.id}`,
    projectId,
    sourceNodeId: `${projectId}-${e.source}`,
    targetNodeId: `${projectId}-${e.target}`,
  }));

  // Insert nodes (upsert — safe to call multiple times for the same project)
  const insertedNodes = await db
    .insert(nodes)
    .values(nodeRows)
    .onConflictDoUpdate({
      target: nodes.id,
      set: {
        label: nodes.label,
        positionX: nodes.positionX,
        positionY: nodes.positionY,
        dataJson: nodes.dataJson,
      },
    })
    .returning({ id: nodes.id });

  // Insert edges
  const insertedEdges = await db
    .insert(edges)
    .values(edgeRows)
    .onConflictDoUpdate({
      target: edges.id,
      set: {
        sourceNodeId: edges.sourceNodeId,
        targetNodeId: edges.targetNodeId,
      },
    })
    .returning({ id: edges.id });

  // Persist conversation turns to chat_history
  await db.insert(chatHistory).values([
    { projectId, role: 'user', content: userPrompt },
    {
      projectId,
      role: 'assistant',
      // Store the full AI response: architecture summary + generated code
      content: `Architecture generated with ${architecture.nodes.length} nodes and ${architecture.edges.length} edges.\n\n\`\`\`\n${generatedCode}\n\`\`\``,
    },
  ]);

  return {
    savedNodeIds: insertedNodes.map((n) => n.id),
    savedEdgeIds: insertedEdges.map((e) => e.id),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — designArchitecture
// Called by REST routes and WebSocket handlers.
// ─────────────────────────────────────────────────────────────────────────────

export async function designArchitecture(
  prompt: string,
  projectId: string,
): Promise<OrchestratorResult> {
  // ── Stage 1: Architect Agent ─────────────────────────────────
  const architecture = await runArchitectAgent(prompt);

  // ── Stage 2: Coder Agent (runs in parallel is fine here since it's independent) ─
  const code = await runCoderAgent(architecture);

  // ── Stage 3: Persist to DB ───────────────────────────────────
  const { savedNodeIds, savedEdgeIds } = await persistToDatabase(
    projectId,
    architecture,
    prompt,
    code,
  );

  return { architecture, code, savedNodeIds, savedEdgeIds };
}

// ─────────────────────────────────────────────────────────────────────────────
// streamDesignArchitecture — WebSocket-oriented pipeline
//
// Yields two event shapes:
//   { type: 'chunk'; content: string }   — one token from the Architect stream
//   { type: 'done';  result: OrchestratorResult } — final persisted result
//
// The WebSocket handler sends 'chunk' events as AI_CHUNK messages (typing
// effect) and the 'done' event as AI_DONE with the full canvas payload.
// ─────────────────────────────────────────────────────────────────────────────

export type StreamEvent =
  | { type: 'chunk'; content: string }
  | { type: 'done'; result: OrchestratorResult };

export async function* streamDesignArchitecture(
  prompt: string,
  projectId: string,
): AsyncGenerator<StreamEvent> {
  // ── Stage 1: Stream architect thoughts ──────────────────────────────────
  const architectStream = await nvidia.chat.completions.create({
    model: NIM_MODELS.BALANCED,
    messages: [
      { role: 'system', content: ARCHITECT_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 2048,
    stream: true,
  });

  let buffer = '';
  for await (const chunk of architectStream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      buffer += content;
      yield { type: 'chunk', content };
    }
  }

  // ── Stage 2: Parse the fully-streamed JSON ───────────────────────────────
  let architecture: ArchitectOutput;
  try {
    architecture = JSON.parse(buffer) as ArchitectOutput;
    if (!Array.isArray(architecture.nodes) || !Array.isArray(architecture.edges)) {
      throw new Error('Invalid shape');
    }
  } catch {
    throw new Error(`Architect agent returned unparseable JSON:\n${buffer}`);
  }

  // ── Stage 3: Coder agent (blocking, but WS is already showing progress) ──
  const code = await runCoderAgent(architecture);

  // ── Stage 4: Persist ─────────────────────────────────────────────────────
  const { savedNodeIds, savedEdgeIds } = await persistToDatabase(
    projectId,
    architecture,
    prompt,
    code,
  );

  yield { type: 'done', result: { architecture, code, savedNodeIds, savedEdgeIds } };
}
