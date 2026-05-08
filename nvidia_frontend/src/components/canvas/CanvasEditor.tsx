'use client';

import { useEffect, useRef, useCallback } from 'react';
import { ReactFlow, Background, BackgroundVariant, Controls, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useProjectStore } from '@/store/project-store';
import { useProjectWebSocket } from '@/hooks/useProjectWebSocket';

interface CanvasEditorProps {
  projectId: string;
  initialNodes: any[];
  initialEdges: any[];
}

export function CanvasEditor({ projectId, initialNodes, initialEdges }: CanvasEditorProps) {
  const initialized = useRef(false);
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onConnect,
  } = useProjectStore();

  const { sendMessage } = useProjectWebSocket(projectId);

  useEffect(() => {
    if (!initialized.current) {
      // Map backend nodes to React Flow format
      const mappedNodes = initialNodes.map((n) => ({
        id: n.id,
        type: n.type || 'default',
        position: { x: n.positionX, y: n.positionY },
        data: { label: n.label, ...n.dataJson },
      }));

      // Map backend edges to React Flow format
      const mappedEdges = initialEdges.map((e) => ({
        id: e.id,
        source: e.sourceNodeId,
        target: e.targetNodeId,
      }));

      setNodes(mappedNodes);
      setEdges(mappedEdges);
      initialized.current = true;
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeDrag = useCallback((_: React.MouseEvent, node: Node) => {
    sendMessage({
      type: 'NODE_DRAG',
      nodeId: node.id,
      x: node.position.x,
      y: node.position.y,
    });
  }, [sendMessage]);

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDrag={handleNodeDrag}
        fitView
        className="bg-transparent"
        minZoom={0.2}
        maxZoom={4}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="oklch(1 0 0 / 12%)" />
        <Controls className="bg-card border-white/10 fill-foreground" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
