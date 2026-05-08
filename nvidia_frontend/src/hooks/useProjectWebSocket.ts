'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useProjectStore } from '@/store/project-store';

export function useProjectWebSocket(projectId?: string | string[]) {
  const ws = useRef<WebSocket | null>(null);
  const { setStreamState, appendStreamContent, nodes, setNodes } = useProjectStore();

  useEffect(() => {
    if (!projectId || typeof projectId !== 'string') return;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}/projects/${projectId}`;
    const socket = new WebSocket(wsUrl);
    ws.current = socket;

    socket.onopen = () => {
      console.log('[WS] Connected to project', projectId);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'NODE_DRAG':
            // We update the node position if it's from another client
            // (The backend broadcasts to everyone, including us, but we could also filter by clientId if needed)
            // Let's just update the store directly
            setNodes((prevNodes) =>
              prevNodes.map((n) =>
                n.id === data.nodeId
                  ? { ...n, position: { x: data.x, y: data.y } }
                  : n
              )
            );
            break;

          case 'AI_CHUNK':
            appendStreamContent(data.content);
            break;

          case 'AI_DONE':
            setStreamState(false);
            // Optionally, handle the final result (e.g., merging new nodes/edges into the canvas)
            break;

          case 'AI_ERROR':
            console.error('[WS] AI Error:', data.message);
            setStreamState(false);
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
  }, [projectId, setStreamState, appendStreamContent, setNodes]); // omit nodes from dependency to avoid reconnecting on node change

  const sendMessage = useCallback((msg: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    }
  }, []);

  return { sendMessage };
}
