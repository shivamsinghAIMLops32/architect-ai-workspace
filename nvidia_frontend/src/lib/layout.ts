import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

// Standard dimensions for our new rich nodes
const nodeWidth = 350;
const nodeHeight = 250; // Increased height for richer content

// Tier definitions for layout
const TIER_COLUMNS: Record<string, number> = {
  client: 0,
  gateway: 450,
  service: 900,
  data: 1350,
  external: 1800,
};

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

  // Now, override node X positions based on tiers, and arrange Y positions sequentially
  const newNodes = nodes.map((node) => {
    const dagreNode = dagreGraph.node(node.id);
    const tier = (node.data?.tier as string) || 'unknown';
    
    let targetX = dagreNode.x - nodeWidth / 2;
    const targetY = dagreNode.y - nodeHeight / 2;

    // If it has a known tier, override its X position to snap to our perfect columns,
    // but keep dagre's Y position to prevent edge crossings and overlapping!
    if (TIER_COLUMNS[tier] !== undefined) {
      targetX = TIER_COLUMNS[tier];
    }

    return {
      ...node,
      position: { x: targetX, y: targetY },
    };
  });

  return { nodes: newNodes, edges };
};
