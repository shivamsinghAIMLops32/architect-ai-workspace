import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

// Standard dimensions for our new rich nodes
const nodeWidth = 420;
const nodeHeight = 290;
const verticalGap = 70;

// Tier definitions for layout
const TIER_COLUMNS: Record<string, number> = {
  client: 0,
  gateway: 520,
  service: 1040,
  data: 1560,
  external: 2080,
};

const TIER_ORDER = ['client', 'gateway', 'service', 'data', 'external', 'unknown'];

export const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // Configure dagre — larger spacing for breathing room
  dagreGraph.setGraph({ 
    rankdir: direction, 
    ranksep: 250, 
    nodesep: 100,
    edgesep: 50,
    marginx: 50,
    marginy: 50
  });

  // Track nodes by tier to assign manual X positions if tier exists
  const nodesByTier: Record<string, Node[]> = {
    client: [], gateway: [], service: [], data: [], external: [], unknown: []
  };

  nodes.forEach((node) => {
    // Add to dagre graph for edge routing
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    
    // Group by tier
    const tier = (node.data?.tier as string) || 'unknown';
    if (nodesByTier[tier]) {
      nodesByTier[tier].push(node);
    } else {
      nodesByTier.unknown.push(node);
    }
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Let dagre do its layout to calculate edge routing and fallback node positions
  dagre.layout(dagreGraph);

  const positionedById = new Map<string, { x: number; y: number }>();

  TIER_ORDER.forEach((tierName) => {
    const tierNodes = [...(nodesByTier[tierName] ?? [])].sort((a, b) => {
      const aStep = Number(a.data?.flowStep) || 999;
      const bStep = Number(b.data?.flowStep) || 999;
      if (aStep !== bStep) return aStep - bStep;
      return String(a.data?.label ?? a.id).localeCompare(String(b.data?.label ?? b.id));
    });

    const columnX = TIER_COLUMNS[tierName] ?? 1040;
    const totalHeight = tierNodes.length * nodeHeight + Math.max(0, tierNodes.length - 1) * verticalGap;
    const startY = -totalHeight / 2;

    tierNodes.forEach((node, index) => {
      positionedById.set(node.id, {
        x: columnX,
        y: startY + index * (nodeHeight + verticalGap),
      });
    });
  });

  const newNodes = nodes.map((node) => {
    const dagreNode = dagreGraph.node(node.id);
    const systematicPosition = positionedById.get(node.id);
    
    return {
      ...node,
      position: systematicPosition ?? {
        x: dagreNode.x - nodeWidth / 2,
        y: dagreNode.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: newNodes, edges };
};
