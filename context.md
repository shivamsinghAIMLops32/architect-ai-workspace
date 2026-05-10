# Architect AI — Project Context & Documentation

This document serves as a deep dive into the architecture, design decisions, and data flow of the Architect AI project. It is intended for developers, AI agents, and contributors who need to understand how the system works under the hood.

## 1. System Overview

Architect AI is designed to bridge the gap between ideation and system design. Users chat with an AI assistant that incrementally builds a React Flow architecture diagram on a canvas.

The system is split into two independent services:
- **`nvidia_backend`**: A fast, WebSocket-capable API server built with Bun and Hono.
- **`nvidia_frontend`**: A Next.js application that renders the interactive React Flow canvas.

## 2. Core Data Models (Drizzle ORM)

The database schema (`nvidia_backend/src/db/schema.ts`) uses PostgreSQL and consists of:

- **Users & Sessions**: Managed automatically by `better-auth`.
- **Projects**: Represents a single workspace/canvas.
  - `id`: Unique identifier.
  - `userId`: The owner of the project (enforces isolation).
  - `shareToken`: A unique string generated for public read-only sharing.
- **Nodes**: Represents a single system component (e.g., a database, an API).
  - `projectId`: Foreign key to the project.
  - `type`: Node type (e.g., `database`, `load_balancer`).
  - `positionX` / `positionY`: Coordinates on the canvas.
  - `dataJson`: A JSONB column storing rich metadata: `description`, `endpoints` (array of methods/paths), `techStack`, `port`, `protocol`, `tier`, and `scaling`.
- **Edges**: Represents connections between nodes.
  - `sourceNodeId` / `targetNodeId`: Foreign keys to nodes.
  - `dataJson`: JSONB column storing edge metadata: `label`, `protocol`, and `animated` (boolean for async connections).
- **Chat History**: Stores the conversational turns between the user and the assistant.

## 3. The AI Pipeline (`ai-orchestrator.ts`)

The AI orchestration is the brain of the application. When a user sends a message, the following pipeline executes:

1. **Context Gathering**: The backend fetches the existing `chatHistory` and the current state of the canvas (nodes and edges).
2. **Architect Agent (Llama 3.3 70B)**: 
   - Receives a strict system prompt demanding a JSON graph output.
   - The AI first outputs its reasoning inside `<think>...</think>` tags (Chain of Thought).
   - It then streams a strict JSON object containing the new or updated `nodes` and `edges`.
   - The model must assign a `tier` (client, gateway, service, data, external) to every node.
3. **Real-time Streaming**: As the AI streams its response, the backend parses the chunks and forwards them to the frontend via WebSockets (`AI_CHUNK`), allowing the UI to show a typing indicator.
4. **Fast Persistence**: Once the JSON is fully parsed, it is immediately upserted into the PostgreSQL database. An `AI_DONE` event is broadcasted via WebSockets containing the complete architecture.
5. **Coder Agent (Qwen 2.5 Coder 32B)**: 
   - Runs in the background (fire-and-forget).
   - Takes the final JSON graph and generates infrastructure-as-code (e.g., Docker Compose files).

## 4. Frontend Layout Engine (`layout.ts`)

Instead of relying on a standard, messy force-directed graph, Architect AI uses a hybrid **Tier-Aware Column Layout**:

- **Dagre**: We use `dagre` to calculate edge routing and relative spacing.
- **Tier Overrides**: Once Dagre runs, we manually override the X-coordinates of nodes based on their `tier`:
  - `client` → x: 0
  - `gateway` → x: 450
  - `service` → x: 900
  - `data` → x: 1350
  - `external` → x: 1800
- This ensures data always flows left-to-right, mirroring standard production architecture diagrams.

## 5. Real-Time Collaboration (WebSockets)

The `/ws/projects/:projectId` route handles real-time synchronization:
- **Connection**: Verifies the Better Auth session cookie. If authenticated and the user owns the project, they join a Pub/Sub topic.
- **Cursor Moves**: High-frequency, ephemeral events (`CURSOR_MOVE`) are broadcasted via Pub/Sub but NOT saved to the database.
- **Node Drags**: `NODE_DRAG` events broadcast the new coordinates instantly and trigger an asynchronous, fire-and-forget database update to save the new `positionX` and `positionY`.
- **AI Triggers**: The `AI_CHAT_STREAM` event kicks off the AI Orchestrator pipeline over the WebSocket connection.

## 6. Security & Access Control

Security is implemented at multiple layers:
1. **Next.js Middleware**: Edge middleware checks for the presence of the `better-auth.session_token` cookie. Unauthenticated users are redirected to `/login`.
2. **API Routes**: Hono middleware (`requireAuth`) extracts the user session from the database.
3. **Database Row-Level Isolation**: Every `GET`, `POST`, and `DELETE` operation against `projects`, `canvas`, or `ws` verifies `where(eq(projects.userId, user.id))`.
4. **Public Sharing**: The `/api/share/generate/:projectId` endpoint creates a unique 21-character `shareToken`. The `/api/share/:token` route is public, but only returns nodes and edges (chat history is excluded to protect prompt IP). The frontend `/share/[token]/page.tsx` renders this in a strict read-only React Flow canvas.

## 7. UI/UX Design Philosophy

- **Aesthetics**: Dark mode by default (`bg-background`, `text-foreground`).
- **Nodes**: Rendered via `CustomNode.tsx`. They are highly detailed cards featuring:
  - Color-coded top accent strips based on tier (e.g., Blue for Client, Emerald for Data).
  - Pill badges for tech stacks (`Node.js`, `Redis`).
  - Small API endpoint lists with HTTP method badges (GET = green, POST = blue).
- **Edges**: Rendered via `CustomEdge.tsx`. Uses smoothstep paths. Features inline pill badges for the connection label and protocol. Streaming/Async connections (e.g., WebSockets, Kafka) render with an animated dashed stroke.
- **Chat**: To prevent overwhelming the user, raw JSON is never shown in the chat window. Instead, `layout.tsx` intercepts JSON payloads and renders a compact "Architecture Generated" summary card.
