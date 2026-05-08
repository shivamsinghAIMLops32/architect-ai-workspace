import { Hono } from 'hono';
import { upgradeWebSocket, websocket } from 'hono/bun';
import type { ServerWebSocket } from 'bun';

import { db } from '../db';
import { nodes } from '../db/schema';
import { eq } from 'drizzle-orm';
import { streamDesignArchitecture } from '../services/ai-orchestrator';

// ─────────────────────────────────────────────────────────────────────────────
// Message Types — Client → Server
// ─────────────────────────────────────────────────────────────────────────────

interface CursorMoveMsg {
  type: 'CURSOR_MOVE';
  x: number;
  y: number;
}

interface NodeDragMsg {
  type: 'NODE_DRAG';
  nodeId: string; // the prefixed id stored in DB (e.g. "proj123-lb-1")
  x: number;
  y: number;
}

interface AiChatStreamMsg {
  type: 'AI_CHAT_STREAM';
  prompt: string;
}

type ClientMessage = CursorMoveMsg | NodeDragMsg | AiChatStreamMsg;

// Re-export websocket so index.ts can attach it to the Bun server config.
export { websocket };

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────

const wsRouter = new Hono();

wsRouter.get(
  '/ws/projects/:projectId',
  upgradeWebSocket((c) => {
    // Capture per-connection state in a closure — no global map needed.
    const projectId = c.req.param('projectId')!;
    const clientId = crypto.randomUUID();

    // Helpers to send typed payloads to a single socket
    const send = (ws: { send: (data: string) => void }, payload: object) =>
      ws.send(JSON.stringify(payload));

    return {
      // ── onOpen ──────────────────────────────────────────────────────────
      onOpen(_evt, ws) {
        const raw = ws.raw as ServerWebSocket<unknown>;

        // Subscribe to the project's pub/sub topic.
        // raw.publish() sends to ALL other subscribers in this topic.
        raw.subscribe(projectId);

        // Announce arrival to everyone else in the room
        raw.publish(
          projectId,
          JSON.stringify({ type: 'CLIENT_JOINED', clientId }),
        );

        // Confirm connection details to the connecting client
        send(ws, { type: 'CONNECTED', clientId, projectId });

        console.log(`[WS] client ${clientId} joined project ${projectId}`);
      },

      // ── onMessage ───────────────────────────────────────────────────────
      async onMessage(evt, ws) {
        const raw = ws.raw as ServerWebSocket<unknown>;

        let msg: ClientMessage;
        try {
          msg = JSON.parse(evt.data.toString()) as ClientMessage;
        } catch {
          send(ws, { type: 'ERROR', message: 'Invalid JSON payload' });
          return;
        }

        switch (msg.type) {
          // ── CURSOR_MOVE ────────────────────────────────────────────────
          // Pure ephemeral broadcast — intentionally NOT persisted.
          case 'CURSOR_MOVE': {
            raw.publish(
              projectId,
              JSON.stringify({
                type: 'CURSOR_MOVE',
                clientId,
                x: msg.x,
                y: msg.y,
              }),
            );
            break;
          }

          // ── NODE_DRAG ──────────────────────────────────────────────────
          // Broadcast position + fire-and-forget DB update.
          // Using void to not block the WS event loop on the DB write.
          case 'NODE_DRAG': {
            const broadcastPayload = JSON.stringify({
              type: 'NODE_DRAG',
              clientId,
              nodeId: msg.nodeId,
              x: msg.x,
              y: msg.y,
            });

            // Broadcast to all other clients in the room immediately
            raw.publish(projectId, broadcastPayload);

            // Persist new position asynchronously (fire-and-forget)
            void db
              .update(nodes)
              .set({ positionX: msg.x, positionY: msg.y })
              .where(eq(nodes.id, msg.nodeId))
              .catch((err: unknown) =>
                console.error(`[WS] NODE_DRAG DB update failed for ${msg.nodeId}:`, err),
              );

            break;
          }

          // ── AI_CHAT_STREAM ─────────────────────────────────────────────
          // Run the full two-agent pipeline, streaming architect tokens to
          // EVERY client in the room as they arrive, then sending AI_DONE
          // with the full architecture + generated code once complete.
          case 'AI_CHAT_STREAM': {
            if (!msg.prompt?.trim()) {
              send(ws, { type: 'AI_ERROR', message: 'Prompt cannot be empty' });
              break;
            }

            // Run the pipeline in a non-blocking async IIFE
            void (async () => {
              try {
                for await (const event of streamDesignArchitecture(
                  msg.prompt,
                  projectId,
                )) {
                  if (event.type === 'chunk') {
                    const chunkPayload = JSON.stringify({
                      type: 'AI_CHUNK',
                      content: event.content,
                      clientId, // so the frontend knows who triggered it
                    });
                    // Broadcast chunk to other clients and echo to self
                    raw.publish(projectId, chunkPayload);
                    ws.send(chunkPayload);
                  } else if (event.type === 'done') {
                    const donePayload = JSON.stringify({
                      type: 'AI_DONE',
                      result: event.result,
                      clientId,
                    });
                    // Broadcast final result to everyone in the room
                    raw.publish(projectId, donePayload);
                    ws.send(donePayload);
                  }
                }
              } catch (err) {
                const errMsg =
                  err instanceof Error ? err.message : 'Unknown orchestration error';
                console.error('[WS] AI_CHAT_STREAM pipeline error:', errMsg);
                // Only the requesting client gets the error
                send(ws, { type: 'AI_ERROR', message: errMsg });
              }
            })();

            break;
          }

          default: {
            send(ws, {
              type: 'ERROR',
              message: `Unknown message type: ${(msg as ClientMessage).type}`,
            });
          }
        }
      },

      // ── onClose ─────────────────────────────────────────────────────────
      onClose(_evt, ws) {
        const raw = ws.raw as ServerWebSocket<unknown>;

        // Announce departure to remaining room members
        raw.publish(
          projectId,
          JSON.stringify({ type: 'CLIENT_LEFT', clientId }),
        );

        // Unsubscribe from the pub/sub topic (Bun cleans up automatically
        // on socket close, but being explicit is safer)
        raw.unsubscribe(projectId);

        console.log(`[WS] client ${clientId} left project ${projectId}`);
      },

      // ── onError ─────────────────────────────────────────────────────────
      onError(err, _ws) {
        console.error(`[WS] socket error for client ${clientId}:`, err);
      },
    };
  }),
);

export default wsRouter;
