'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ReactFlow, Background, BackgroundVariant, Controls, Node, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useProjectStore } from '@/store/project-store';
import { useProjectWebSocket } from '@/hooks/useProjectWebSocket';
import { CustomNode } from './CustomNode';
import { CustomEdge } from './CustomEdge';
import { NodeEditorPanel } from './NodeEditorPanel';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ShareButton } from './ShareButton';

const nodeTypes = {
  default: CustomNode,
  custom: CustomNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

const defaultEdgeOptions = {
  type: 'custom',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: '#a1a1aa', // zinc-400
  },
};

interface CanvasEditorProps {
  projectId: string;
  initialNodes: any[];
  initialEdges: any[];
  initialChatHistory: any[];
}

export function CanvasEditor({ projectId, initialNodes, initialEdges, initialChatHistory }: CanvasEditorProps) {
  const initialized = useRef(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    setChatHistory,
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
        type: 'custom',
        position: { x: n.positionX, y: n.positionY },
        data: { label: n.label, type: n.type, ...n.dataJson },
      }));

      // Map backend edges to React Flow format
      const mappedEdges = initialEdges.map((e) => ({
        id: e.id,
        source: e.sourceNodeId,
        target: e.targetNodeId,
        data: e.dataJson || {},
      }));

      setNodes(mappedNodes);
      setEdges(mappedEdges);
      setChatHistory(initialChatHistory);
      initialized.current = true;
    }
  }, [initialNodes, initialEdges, initialChatHistory, setNodes, setEdges, setChatHistory]);

  const handleNodeDrag = useCallback((_: React.MouseEvent, node: Node) => {
    sendMessage({
      type: 'NODE_DRAG',
      nodeId: node.id,
      x: node.position.x,
      y: node.position.y,
    });
  }, [sendMessage]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handleAddNode = useCallback(() => {
    const newNode = {
      id: `manual-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { label: 'New Component' }
    };
    setNodes([...nodes, newNode as any]);
  }, [nodes, setNodes]);

  return (
    <div className="h-full w-full relative">
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <ShareButton projectId={projectId} />
        <Button onClick={handleAddNode} variant="outline" className="bg-zinc-900 border-zinc-700 hover:bg-zinc-800 text-zinc-300">
          <Plus className="mr-2 h-4 w-4" />
          Add Node
        </Button>
      </div>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDrag={handleNodeDrag}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        className="bg-transparent"
        minZoom={0.1}
        maxZoom={4}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="oklch(1 0 0 / 12%)" />
        <Controls className="bg-card border-white/10 fill-foreground" showInteractive={false} />
      </ReactFlow>

      <NodeEditorPanel nodeId={selectedNodeId} onClose={() => setSelectedNodeId(null)} />
    </div>
  );
}
