import { serverApi } from '@/lib/server-api';
import { ReactFlow, Background, BackgroundVariant, Controls, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode } from '@/components/canvas/CustomNode';
import { CustomEdge } from '@/components/canvas/CustomEdge';
import { getLayoutedElements } from '@/lib/layout';
import { Cpu } from 'lucide-react';
import { notFound } from 'next/navigation';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

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
    color: '#a1a1aa',
  },
};

async function getSharedCanvasState(token: string) {
  try {
    const res = await serverApi.get<{
      data: {
        project: any;
        nodes: any[];
        edges: any[];
      };
    }>(`/share/${token}`);
    return res.data;
  } catch (error) {
    console.error(`Failed to load shared canvas state for ${token}:`, error);
    return null;
  }
}

export default async function SharedProjectPage({ params }: SharePageProps) {
  const { token } = await params;
  const canvasState = await getSharedCanvasState(token);

  if (!canvasState) {
    notFound();
  }

  // Map backend nodes to React Flow format
  const mappedNodes = canvasState.nodes.map((n) => ({
    id: n.id,
    type: n.type || 'default',
    position: { x: n.positionX, y: n.positionY },
    data: { label: n.label, ...n.dataJson },
  }));

  // Map backend edges to React Flow format
  const mappedEdges = canvasState.edges.map((e) => ({
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

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      {/* Top nav bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/8 bg-background/80 px-5 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10">
            <Cpu className="h-4 w-4 text-violet-400" />
          </div>
          <div>
            <span className="text-sm font-semibold tracking-tight text-foreground block">
              Architect AI
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
              Shared Viewer
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-sm font-medium text-zinc-300">
             {canvasState.project.name}
           </span>
           <span className="text-xs text-zinc-600 border border-white/10 bg-white/5 rounded px-2 py-0.5">
             Read Only
           </span>
        </div>
      </header>

      {/* Canvas area */}
      <main className="relative flex-1 overflow-hidden bg-dot-grid">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,oklch(0.09_0_0)_100%)] z-0"
        />
        <div className="relative z-10 h-full w-full">
          <ReactFlow
            nodes={layoutedNodes}
            edges={layoutedEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            className="bg-transparent"
            minZoom={0.1}
            maxZoom={4}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
            edgesUpdatable={false}
            panOnDrag={true}
            zoomOnScroll={true}
            panOnScroll={true}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="oklch(1 0 0 / 12%)" />
            <Controls className="bg-card border-white/10 fill-foreground" showInteractive={false} />
          </ReactFlow>
        </div>
      </main>
    </div>
  );
}
