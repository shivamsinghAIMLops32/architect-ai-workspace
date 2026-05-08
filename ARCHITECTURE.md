# Master Project Blueprint: Architect-AI (Collaborative System Designer API)

## Overview
You are acting as a Senior Backend Architect. We are building a collaborative, real-time system design tool (similar to React Flow or Excalidraw) powered by a Multi-Agent AI backend. 

## Current Environment & Stack
- **Runtime:** Bun
- **Framework:** Hono.js
- **Validation:** Zod
- **AI Provider:** NVIDIA NIM (using the `openai` SDK contract).
- **Database:** Neon DB (Serverless PostgreSQL). The `DATABASE_URL` is already present in `.env` and validated in `src/env.ts`.
- **Current Structure:** Clean, modular setup (`src/config`, `src/lib`, `src/routes`, `src/env.ts`, `src/index.ts`).

## The Multi-Agent AI Pipeline
We will utilize two NVIDIA NIM models:
1. **The Architect Agent (`meta/llama-3.3-70b-instruct`):** Analyzes the user's chat prompt and outputs a structured JSON representing required infrastructure nodes and edges (e.g., Load Balancer connecting to 3 API instances).
2. **The Coder Agent (`qwen/qwen2.5-coder-32b-instruct`):** Takes the Architect's output and generates the configuration code (e.g., `docker-compose.yml`, Nginx conf, or Bun boilerplate).

---

## Execution Rules (CRITICAL)
- Execute this plan strictly **Phase by Phase**.
- Do NOT proceed to the next phase until I explicitly confirm the current phase is working.
- When generating code, write modular, production-ready TypeScript.
- Provide the exact terminal commands needed for any installations before writing the code.

---

### Phase 1: Database Setup (Neon + Drizzle)
1. Install the required dependencies for Neon and Drizzle.
2. Create `src/db/schema.ts`. We need the following tables to support a node-based whiteboard and chat:
   - `projects` (id, name, created_at, updated_at)
   - `nodes` (id, project_id, type, label, position_x, position_y, data_json)
   - `edges` (id, project_id, source_node_id, target_node_id)
   - `chat_history` (id, project_id, role, content)
3. Set up `src/db/index.ts` using `@neondatabase/serverless` (`neon-http`) and connect it to Drizzle.
4. Provide the commands to generate and push the initial migration to Neon DB.

### Phase 2: The Multi-Agent Orchestration Service
1. Create `src/services/ai-orchestrator.ts`.
2. Initialize the NVIDIA NIM client using the existing environment variables.
3. Write a function `designArchitecture(prompt: string, projectId: string)`.
4. Implement the pipeline: 
   - First call `Llama-3.3-70b` to map out the system design as a strict JSON array of nodes/edges.
   - Then, pass that output to `Qwen-2.5-Coder` to generate the accompanying code snippet.
5. Save the generated nodes and edges directly to the database using the Drizzle schema from Phase 1.

### Phase 3: Real-Time WebSockets (Hono/Bun Native)
1. Upgrade `src/index.ts` to support Bun's native WebSocket implementation within Hono.
2. Create `src/routes/ws.ts`.
3. Implement a WebSocket route `/ws/projects/:projectId` that handles:
   - `CURSOR_MOVE`: Broadcast mouse positions to other connected clients.
   - `NODE_DRAG`: Broadcast node position updates in real-time.
   - `AI_CHAT_STREAM`: When a user asks the AI to generate a design, stream the AI's thought process (SSE/Text chunks) back through the WebSocket so the frontend can type it out in real-time.

### Phase 4: Standard REST API Canvas Routes
1. Create `src/routes/projects.ts` for basic CRUD (Create new board, list boards).
2. Create `src/routes/canvas.ts` to fetch the complete initial state of a project (fetching all nodes, edges, and chat history) when a user first loads the page.
3. Wire these routes into the main `Hono` app router.

# Phase 5 Master Blueprint: Authentication Integration (Better Auth)

## Overview
We are adding full authentication to our existing Hono + Bun + Neon DB stack using `better-auth`. 
We will use Email & Password authentication. Email verification is explicitly NOT required for now.

## Current Environment Constraints
- Framework: Hono (`hono/bun`)
- ORM: Drizzle ORM (`drizzle-orm/neon-http`)
- Database: Serverless PostgreSQL (Neon DB)
- Existing Routes: `/api/projects`, `/api/canvas`, and `/ws/projects/:projectId`

---

## Execution Plan

### Step 1: Install Dependencies
Provide the command to install the necessary packages:
`bun add better-auth`

### Step 2: Update Drizzle Schema
Update `src/db/schema.ts` to include the strict tables required by `better-auth` for PostgreSQL. We need:
- `user` (id, name, email, emailVerified, image, createdAt, updatedAt)
- `session` (id, expiresAt, token, createdAt, updatedAt, ipAddress, userAgent, userId)
- `account` (id, accountId, providerId, userId, accessToken, refreshToken, idToken, accessTokenExpiresAt, refreshTokenExpiresAt, scope, password, createdAt, updatedAt)
- `verification` (id, identifier, value, expiresAt, createdAt, updatedAt)

*Note: Ensure you import these into `src/db/index.ts` if needed, and prompt me to run the database push command once you write the schema.*

### Step 3: Initialize Better Auth
Create `src/lib/auth.ts`.
1. Import `betterAuth` from `better-auth`.
2. Import the `drizzleAdapter` from `better-auth/adapters/drizzle`.
3. Configure the `betterAuth` instance:
   - Connect it to our existing Drizzle `db`.
   - Enable the `emailAndPassword` plugin.
   - Set `requireEmailVerification: false` inside the emailAndPassword config.
   - Add a secret key placeholder (tell me to add `BETTER_AUTH_SECRET` to my `.env`).

### Step 4: Mount Auth Routes in Hono
Create `src/routes/auth.ts` (or update `src/index.ts` directly).
1. We need to mount the Better Auth handler to a Hono route.
2. Create an `app.all("/api/auth/*", (c) => auth.handler(c.req.raw))` route. 
*(This single line automatically creates the `/sign-in`, `/sign-up`, `/update-user`, and `/delete-user` endpoints).*

### Step 5: Protect the Existing Routes (Middleware)
Create `src/middleware/auth.ts`.
1. Write a Hono middleware function that checks for a valid session using `auth.api.getSession({ headers: c.req.raw.headers })`.
2. If no session exists, return a `401 Unauthorized`.
3. If a session exists, attach the `user` object to the Hono Context (`c.set('user', session.user)`).
4. Instruct me on how to apply this middleware to the `projects`, `canvas`, and `ws` routes in `index.ts`.

---
**Initial Command:** "Acknowledge this plan. Begin Step 1 and Step 2 by providing the exact Drizzle schema required by Better Auth for PostgreSQL."