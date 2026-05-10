import { serverApi } from '@/lib/server-api';
import { ReactFlow, Background, BackgroundVariant, Controls, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode } from '@/components/canvas/CustomNode';
import { CustomEdge } from '@/components/canvas/CustomEdge';
import { getLayoutedElements } from '@/lib/layout';
import { Eye } from 'lucide-react';
import { ArchitectLogo } from '@/components/brand/architect-logo';
import { notFound } from 'next/navigation';
import type { SharedCanvasStateResponse } from '@/types/architecture';

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
    const res = await serverApi.get<{ data: SharedCanvasStateResponse }>(`/share/${token}`);
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
      <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-zinc-950/72 px-5 shadow-[0_16px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <ArchitectLogo subtitle="Shared Viewer" />
        <div className="flex items-center gap-2">
           <span className="hidden text-sm font-semibold text-zinc-300 sm:block">
             {canvasState.project.name}
           </span>
           <span className="inline-flex items-center gap-1.5 rounded-full border border-lime-300/20 bg-lime-300/8 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-lime-100">
             <Eye className="h-3 w-3" />
             Read Only
           </span>
        </div>
      </header>

      {/* Canvas area */}
      <main className="relative flex-1 overflow-hidden bg-dot-grid">
        <div
          aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_36%,oklch(0.105_0.012_230)_100%)]"
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
            panOnDrag={true}
            zoomOnScroll={true}
            panOnScroll={true}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="oklch(0.76 0.17 190 / 18%)" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </main>
    </div>
  );
}
