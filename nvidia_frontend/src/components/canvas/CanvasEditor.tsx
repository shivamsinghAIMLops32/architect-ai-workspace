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
import type { BackendCanvasEdge, BackendCanvasNode } from '@/types/architecture';
import type { ChatMessage } from '@/store/project-store';
import { getLayoutedElements } from '@/lib/layout';

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
  initialNodes: BackendCanvasNode[];
  initialEdges: BackendCanvasEdge[];
  initialChatHistory: ChatMessage[];
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

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        mappedNodes,
        mappedEdges,
        'LR'
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
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
    const nextFlowStep = Math.max(
      0,
      ...nodes.map((node) => Number(node.data?.flowStep) || 0)
    ) + 1;

    const newNode: Node = {
      id: `manual-${Date.now()}`,
      type: 'custom',
      position: { x: 1040, y: nextFlowStep * 180 },
      data: {
        label: 'New Component',
        type: 'service',
        description: 'Manually added component. Edit this node, then ask AI to connect or refine it.',
        endpoints: [],
        techStack: ['Custom'],
        port: null,
        protocol: 'HTTP',
        tier: 'service',
        scaling: 'horizontal',
        flowStep: nextFlowStep,
        flowDescription: 'Manual component awaiting refinement',
        capacityEstimate: 'TBD',
      }
    };
    setNodes([...nodes, newNode]);
  }, [nodes, setNodes]);

  return (
    <div className="h-full w-full relative">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <ShareButton projectId={projectId} />
        <Button onClick={handleAddNode} variant="outline" className="border-white/10 bg-zinc-950/75 text-zinc-300 shadow-[0_16px_45px_rgba(0,0,0,0.25)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-lime-200/30 hover:bg-lime-200/10 hover:text-lime-100">
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
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="oklch(0.76 0.17 190 / 18%)" />
        <Controls showInteractive={false} />
      </ReactFlow>

      <NodeEditorPanel nodeId={selectedNodeId} onClose={() => setSelectedNodeId(null)} />
    </div>
  );
}
