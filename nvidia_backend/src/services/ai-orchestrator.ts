import { nvidia } from '../lib/nvidia';
import { NIM_MODELS } from '../config/model';
import { db } from '../db';
import { nodes, edges, chatHistory } from '../db/schema';
import type { NewNode, NewEdge } from '../db/schema';
import { eq } from 'drizzle-orm';

// ─────────────────────────────────────────────────────────────────────────────
// Types — what the Architect agent must return
// ─────────────────────────────────────────────────────────────────────────────

export interface ArchitectEndpoint {
  method: string;  // "GET", "POST", "PUT", "DELETE", etc.
  path: string;    // "/api/users"
  desc: string;    // "Register a new user"
}

export interface ArchitectNodeData {
  description: string;
  endpoints: ArchitectEndpoint[];
  techStack: string[];
  port: number | null;
  protocol: string;        // "HTTP", "gRPC", "WebSocket", "TCP", "AMQP"
  tier: 'client' | 'gateway' | 'service' | 'data' | 'external';
  scaling: string;         // "horizontal", "vertical", "singleton"
  flowStep?: number;
  flowDescription?: string;
  capacityEstimate?: string;
}

export interface ArchitectNode {
  id: string;          // e.g. "lb-1"
  type: string;        // e.g. "load_balancer"
  label: string;       // e.g. "Nginx Load Balancer"
  position_x: number;
  position_y: number;
  data: ArchitectNodeData;
}

export interface ArchitectEdge {
  id: string;          // e.g. "edge-lb1-api1"
  source: string;      // node id
  target: string;      // node id
  label: string;       // e.g. "REST /api/users"
  protocol: string;    // "HTTP", "gRPC", "WebSocket", "TCP"
  animated: boolean;   // true for async/streaming connections
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

const ARCHITECT_SYSTEM_PROMPT = `You are a Senior Engineering and System Architect who designs production-grade distributed systems.
The user will describe a system they want to build or ask follow-up questions.
Your job is to update the architecture and output a concise user-facing explanation followed by a valid JSON object that maps the COMPLETE current system graph.

Rules:
1. Do NOT output hidden reasoning, chain-of-thought, <think> tags, implementation logs, or raw analysis.
2. Start with brief conversational Markdown for the user. Keep it useful and clean:
   - A 1 sentence summary.
   - A numbered "Request flow" list with 3-6 steps.
   - A short "Changed on canvas" list when this is a follow-up.
3. Finally, output a JSON block inside a \`\`\`json fence. The frontend hides this JSON and uses it only to update the canvas.
4. The JSON must have exactly two top-level keys: "nodes" and "edges".
5. When a CURRENT ARCHITECTURE is provided, treat it as the source of truth. Return the FULL revised architecture, not only the delta. Preserve existing components unless the user asks to remove/replace them, and enhance the current graph by adding, removing, or editing nodes and edges as requested.

NODE SCHEMA — each node MUST have ALL of these fields:
{
  "id": "string — unique snake_case id, e.g. 'api_server_1'",
  "type": "string — snake_case: load_balancer, api_server, database, cache, message_queue, cdn, storage, web_app, mobile_app, auth_service, monitoring, firewall, worker, scheduler, search_engine, notification_service, etc.",
  "label": "string — human-readable name, e.g. 'Nginx API Gateway'",
  "position_x": 0,
  "position_y": 0,
  "data": {
    "description": "string — 1-2 sentences explaining its exact role and responsibility in THIS architecture",
    "endpoints": [
      {"method": "POST", "path": "/api/users", "desc": "Register a new user"},
      {"method": "GET", "path": "/api/health", "desc": "Health check"}
    ],
    "techStack": ["Node.js", "Express", "TypeScript"],
    "port": 8080,
    "protocol": "HTTP",
    "tier": "service",
    "scaling": "horizontal",
    "flowStep": 2,
    "flowDescription": "Authenticates the user and routes the playback request",
    "capacityEstimate": "10k req/sec, 50MB/s bandwidth"
  }
}

FIELD RULES:
- "endpoints": Array of {method, path, desc} objects. Include 2-4 realistic API routes for API servers, gateways, and services. Use empty array [] for databases, caches, queues, and non-API components.
- "techStack": Array of 1-3 specific technologies. Be concrete: "PostgreSQL 16" not just "database", "Redis 7" not just "cache", "Nginx" not just "load balancer".
- "port": The network port this service listens on. Use null for external services and clients.
- "protocol": One of "HTTP", "HTTPS", "gRPC", "WebSocket", "TCP", "AMQP", "MQTT". Pick the most appropriate for the connection type.
- "tier": REQUIRED. One of "client", "gateway", "service", "data", "external". This determines the visual layout column:
    - "client" = browsers, mobile apps, SPAs (leftmost column)
    - "gateway" = load balancers, API gateways, reverse proxies, CDNs
    - "service" = backend services, workers, microservices
    - "data" = databases, caches, message queues, object storage
    - "external" = third-party APIs, email providers, payment gateways
- "scaling": One of "horizontal", "vertical", "singleton". Most services are "horizontal", databases are typically "vertical" or "singleton".
- "flowStep": Integer. Number the nodes to show the primary path a user request takes (1, 2, 3...). Use the same number for parallel steps. Leave null for background/monitoring tasks.
- "flowDescription": A concise 1-sentence description of what happens at this node during the request flow.
- "capacityEstimate": A brief back-of-the-envelope calculation for this node (e.g., "10k req/sec", "500GB storage", "2ms latency").

EDGE SCHEMA — each edge MUST have ALL of these fields:
{
  "id": "string — unique id, e.g. 'edge_gateway_to_api'",
  "source": "string — source node id",
  "target": "string — target node id",
  "label": "string — short data flow description, e.g. 'REST /api/*', 'Pub/Sub events', 'SQL queries', 'Cache lookups'",
  "protocol": "string — one of HTTP, HTTPS, gRPC, WebSocket, TCP, AMQP, MQTT",
  "animated": false
}

EDGE RULES:
- "label": Keep it concise (max 25 chars). Describe WHAT data flows through this connection.
- "animated": Set to true ONLY for asynchronous/streaming connections (WebSocket, message queues, event streams). Set to false for synchronous request-response (HTTP, gRPC).
- Make sure edges flow logically: client → gateway → service → data. Include reverse edges only when the architecture requires bidirectional communication.

GENERAL RULES:
- Produce between 4 and 12 nodes. Keep the design realistic, production-grade, and educational.
- Every node MUST have a valid "tier" value. This is critical for layout.
- Use stable ids. If a CURRENT ARCHITECTURE node id already exists, reuse that exact unprefixed id for the same component.
- Ensure the primary flow is systematic: flowStep 1 starts at clients, then gateway, services, data, and external/background systems last.
- Use descriptive, specific labels — "PostgreSQL Primary" not "Database".
- Include infrastructure components that a real production system would need (load balancer, cache, monitoring, etc).

Example output shape:
Here is the architecture for your e-commerce platform. It starts with the React SPA communicating with an API gateway, which routes traffic to the backend services.

Request flow:
1. The user opens the React storefront through the CDN.
2. API calls enter the Nginx gateway for TLS termination and routing.
3. Backend services handle product, cart, and checkout operations.
4. Data is read from PostgreSQL and accelerated with Redis.

\`\`\`json
{
  "nodes": [
    {
      "id": "web_app",
      "type": "web_app",
      "label": "React SPA",
      "position_x": 0,
      "position_y": 0,
      "data": {
        "description": "Single page application serving the storefront UI. Communicates with the API gateway for all backend operations.",
        "endpoints": [],
        "techStack": ["React 18", "TypeScript", "Vite"],
        "port": 3000,
        "protocol": "HTTPS",
        "tier": "client",
        "scaling": "horizontal",
        "flowStep": 1,
        "flowDescription": "User loads the storefront and performs actions",
        "capacityEstimate": "1M DAU, 50MB static assets"
      }
    },
    {
      "id": "api_gateway",
      "type": "load_balancer",
      "label": "Nginx API Gateway",
      "position_x": 0,
      "position_y": 0,
      "data": {
        "description": "Entry point for all API traffic. Handles TLS termination, rate limiting, and routes requests to backend services.",
        "endpoints": [
          {"method": "ANY", "path": "/*", "desc": "Reverse proxy to services"},
          {"method": "GET", "path": "/health", "desc": "Gateway health check"}
        ],
        "techStack": ["Nginx", "OpenResty"],
        "port": 443,
        "protocol": "HTTPS",
        "tier": "gateway",
        "scaling": "horizontal",
        "flowStep": 2,
        "flowDescription": "Receives user API request and proxies to microservices",
        "capacityEstimate": "50k req/sec, TLS termination"
      }
    }
  ],
  "edges": [
    {
      "id": "edge_web_to_gateway",
      "source": "web_app",
      "target": "api_gateway",
      "label": "HTTPS /api/*",
      "protocol": "HTTPS",
      "animated": false
    }
  ]
}
\`\`\``;

export type ChatMessagePayload = { role: 'user' | 'assistant' | 'system'; content: string };

async function runArchitectAgent(messages: ChatMessagePayload[]): Promise<ArchitectOutput> {
  const response = await nvidia.chat.completions.create({
    model: NIM_MODELS.BALANCED, // meta/llama-3.3-70b-instruct
    messages: [
      { role: 'system', content: ARCHITECT_SYSTEM_PROMPT },
      ...messages,
    ],
    temperature: 0.2,   // low temp = deterministic JSON
    max_tokens: 4096,
    stream: false,
  });

  const raw = response.choices[0]?.message?.content ?? '';

  try {
    const jsonMatch = raw.match(/```json\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : raw.includes('</think>') ? raw.split('</think>')[1].trim() : raw.trim();
    const cleanJsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    
    const parsed = JSON.parse(cleanJsonStr) as ArchitectOutput;

    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      throw new Error('Architect agent returned invalid shape — missing nodes or edges array');
    }

    return parsed;
  } catch (e) {
    throw new Error(`Architect agent returned unparseable output:\n${raw}`);
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
  rawBuffer?: string,
): Promise<{ savedNodeIds: string[]; savedEdgeIds: string[] }> {
  const stripProjectPrefix = (id: string) => {
    const prefix = `${projectId}-`;
    return id.startsWith(prefix) ? id.slice(prefix.length) : id;
  };

  // Map Architect nodes → Drizzle NewNode shape
  const nodeRows: NewNode[] = architecture.nodes.map((n) => ({
    id: `${projectId}-${stripProjectPrefix(n.id)}`,
    projectId,
    type: n.type,
    label: n.label,
    positionX: n.position_x,
    positionY: n.position_y,
    dataJson: n.data ?? {},
  }));

  // Map Architect edges → Drizzle NewEdge shape (ids must reference the prefixed node ids)
  const edgeRows: NewEdge[] = architecture.edges.map((e) => ({
    id: `${projectId}-${stripProjectPrefix(e.id)}`,
    projectId,
    sourceNodeId: `${projectId}-${stripProjectPrefix(e.source)}`,
    targetNodeId: `${projectId}-${stripProjectPrefix(e.target)}`,
    dataJson: {
      label: e.label || '',
      protocol: e.protocol || 'HTTP',
      animated: e.animated || false,
    },
  }));

  await db.delete(edges).where(eq(edges.projectId, projectId));
  await db.delete(nodes).where(eq(nodes.projectId, projectId));

  const insertedNodes = nodeRows.length > 0
    ? await db.insert(nodes).values(nodeRows).returning({ id: nodes.id })
    : [];

  const insertedEdges = edgeRows.length > 0
    ? await db.insert(edges).values(edgeRows).returning({ id: edges.id })
    : [];

  // Persist conversation turns to chat_history
  await db.insert(chatHistory).values([
    { projectId, role: 'user', content: userPrompt },
    {
      projectId,
      role: 'assistant',
      content: rawBuffer || `Architecture generated with ${architecture.nodes.length} nodes and ${architecture.edges.length} edges.\n\n\`\`\`\n${generatedCode}\n\`\`\``,
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
  messages: ChatMessagePayload[],
  projectId: string,
): Promise<OrchestratorResult> {
  // ── Stage 1: Architect Agent ─────────────────────────────────
  const architecture = await runArchitectAgent(messages);

  // ── Stage 2: Coder Agent (runs in parallel is fine here since it's independent) ─
  const code = await runCoderAgent(architecture);

  // ── Stage 3: Persist to DB ───────────────────────────────────
  const prompt = messages[messages.length - 1].content;
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
  messages: ChatMessagePayload[],
  projectId: string,
  currentArchitecture?: { nodes: unknown[], edges: unknown[] }
): AsyncGenerator<StreamEvent> {
  // ── Stage 1: Stream architect thoughts ──────────────────────────────────
  
  const systemPrompt = currentArchitecture 
    ? `${ARCHITECT_SYSTEM_PROMPT}\n\nCURRENT ARCHITECTURE (source of truth; unprefixed ids):\n${JSON.stringify(currentArchitecture, null, 2)}`
    : ARCHITECT_SYSTEM_PROMPT;

  const architectStream = await nvidia.chat.completions.create({
    model: NIM_MODELS.BALANCED,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    temperature: 0.2,
    max_tokens: 4096,
    stream: true,
  });

  let buffer = '';
  let jsonFenceStarted = false;
  let streamedVisibleLength = 0;
  for await (const chunk of architectStream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      buffer += content;
      if (!jsonFenceStarted) {
        const lowerBuffer = buffer.toLowerCase();
        const jsonFenceIndex = lowerBuffer.indexOf('```json');
        const objectIndex = buffer.search(/(^|\n)\s*\{\s*["\n]/);
        const jsonStartCandidates = [jsonFenceIndex, objectIndex].filter((index) => index >= 0);
        const jsonStart = jsonStartCandidates.length > 0 ? Math.min(...jsonStartCandidates) : -1;

        if (jsonStart === -1) {
          const safeVisibleEnd = Math.max(streamedVisibleLength, buffer.length - 8);
          const visibleContent = buffer.slice(streamedVisibleLength, safeVisibleEnd);
          streamedVisibleLength = safeVisibleEnd;
          if (visibleContent) {
            yield { type: 'chunk', content: visibleContent };
          }
        } else {
          jsonFenceStarted = true;
          const visibleContent = buffer.slice(streamedVisibleLength, jsonStart);
          streamedVisibleLength = jsonStart;
          if (visibleContent) {
            yield { type: 'chunk', content: visibleContent };
          }
        }
      }
    }
  }

  // ── Stage 2: Parse the fully-streamed JSON ───────────────────────────────
  let architecture: ArchitectOutput;
  try {
    const jsonMatch = buffer.match(/```json\s*([\s\S]*?)\s*```/i);
    const jsonStr = jsonMatch?.[1] ?? buffer.slice(buffer.indexOf('{'), buffer.lastIndexOf('}') + 1);
    const cleanJsonStr = jsonStr.trim();
    architecture = JSON.parse(cleanJsonStr) as ArchitectOutput;
    if (!Array.isArray(architecture.nodes) || !Array.isArray(architecture.edges)) {
      throw new Error('Invalid shape');
    }
  } catch {
    throw new Error(`Architect agent returned unparseable JSON:\n${buffer}`);
  }

  // ── Stage 3: Fast Persistence & Yield ────────────────────────────────────
  // We want the UI to update INSTANTLY. The Coder Agent is slow, so we
  // run it in the background and persist the initial architecture now.
  
  const { savedNodeIds, savedEdgeIds } = await persistToDatabase(
    projectId,
    architecture,
    messages[messages.length - 1].content,
    '', // generatedCode will be updated later
    buffer // pass the raw buffer to preserve <think> tags in chat history
  );

  yield { type: 'done', result: { architecture, code: '', savedNodeIds, savedEdgeIds } };

  // ── Stage 4: Background Coder Agent ──────────────────────────────────────
  Promise.resolve().then(async () => {
    try {
      const code = await runCoderAgent(architecture);
      // We could update the DB with the generated code here if needed
    } catch (e) {
      console.error('Coder agent failed in background:', e);
    }
  });
}
