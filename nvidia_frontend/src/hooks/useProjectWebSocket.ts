'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useProjectStore } from '@/store/project-store';
import { getLayoutedElements } from '@/lib/layout';
import type { ProjectWsIncomingMessage, ProjectWsOutgoingMessage } from '@/types/architecture';

export function useProjectWebSocket(projectId?: string | string[]) {
  const ws = useRef<WebSocket | null>(null);
  const pendingMessages = useRef<ProjectWsOutgoingMessage[]>([]);
  const { setStreamState, appendStreamContent, updateNodePosition } = useProjectStore();

  const flushPendingMessages = useCallback(() => {
    if (ws.current?.readyState !== WebSocket.OPEN) return;
    while (pendingMessages.current.length > 0) {
      const msg = pendingMessages.current.shift();
      if (msg) ws.current.send(JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    if (!projectId || typeof projectId !== 'string') return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/projects/${projectId}`;
    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () => {
      console.log('[WS] Connected to project', projectId);
      flushPendingMessages();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ProjectWsIncomingMessage;
        
        switch (data.type) {
          case 'NODE_DRAG':
            updateNodePosition(data.nodeId, data.x, data.y);
            break;

          case 'AI_CHUNK':
            appendStreamContent(data.content);
            break;

          case 'AI_DONE': {
            const finalContent = useProjectStore.getState().streamContent;
            const hiddenArchitectureJson = data.result?.architecture
              ? `\n\n\`\`\`json\n${JSON.stringify(data.result.architecture, null, 2)}\n\`\`\``
              : '';
            setStreamState(false);
            useProjectStore.getState().addChatMessage({
              id: Date.now(),
              projectId: projectId as string,
              role: 'assistant',
              content: `${finalContent.trim()}${hiddenArchitectureJson}`,
              createdAt: new Date().toISOString(),
            });

            if (data.result?.architecture) {
              const mappedNodes = data.result.architecture.nodes.map((n) => ({
                id: `${projectId}-${n.id}`,
                type: 'custom',
                position: { x: n.position_x ?? 0, y: n.position_y ?? 0 },
                data: { 
                  label: n.label, 
                  type: n.type,
                  ...n.data 
                },
              }));

              const mappedEdges = data.result.architecture.edges.map((e) => ({
                id: `${projectId}-${e.id}`,
                source: `${projectId}-${e.source}`,
                target: `${projectId}-${e.target}`,
                data: {
                  label: e.label,
                  protocol: e.protocol,
                  animated: e.animated
                }
              }));

              const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                mappedNodes,
                mappedEdges,
                'LR' // Left to Right flow
              );

              useProjectStore.getState().setNodes(layoutedNodes);
              useProjectStore.getState().setEdges(layoutedEdges);
            }
            break;
          }

          case 'AI_ERROR':
            console.error('[WS] AI Error:', data.message);
            setStreamState(false);
            useProjectStore.getState().addChatMessage({
              id: Date.now(),
              projectId: projectId as string,
              role: 'assistant',
              content: `Architecture generation failed: ${data.message}`,
              createdAt: new Date().toISOString(),
            });
            break;

          default:
            break;
        }
      } catch (err) {
        console.error('[WS] Error parsing message:', err);
      }
    };

    socket.onclose = () => {
      console.log('[WS] Disconnected');
      ws.current = null;
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [projectId, setStreamState, appendStreamContent, updateNodePosition, flushPendingMessages]);

  const sendMessage = useCallback((msg: ProjectWsOutgoingMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
      return true;
    }
    pendingMessages.current.push(msg);
    return false;
  }, []);

  return { sendMessage };
}
