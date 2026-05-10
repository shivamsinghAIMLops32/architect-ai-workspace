import type { ChatMessage } from '@/store/project-store';

export interface BackendProject {
  id: string;
  name: string;
  createdAt?: string;
}

export interface BackendCanvasNode {
  id: string;
  label?: string;
  type?: string;
  positionX: number;
  positionY: number;
  dataJson?: Record<string, unknown>;
}

export interface BackendCanvasEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  dataJson?: Record<string, unknown>;
}

export interface CanvasStateResponse {
  project: BackendProject;
  nodes: BackendCanvasNode[];
  edges: BackendCanvasEdge[];
  chatHistory: ChatMessage[];
}

export interface SharedCanvasStateResponse {
  project: BackendProject;
  nodes: BackendCanvasNode[];
  edges: BackendCanvasEdge[];
}

export interface AiArchitectureNode {
  id: string;
  label: string;
  type?: string;
  position_x?: number;
  position_y?: number;
  data?: Record<string, unknown>;
}

export interface AiCanvasSnapshotNode {
  id: string;
  type?: string;
  label: string;
  position_x: number;
  position_y: number;
  data: Record<string, unknown>;
}

export interface AiCanvasSnapshotEdge {
  id: string;
  source: string;
  target: string;
  data: Record<string, unknown>;
}

export interface AiArchitectureEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  protocol?: string;
  animated?: boolean;
}

export interface AiDoneMessage {
  type: 'AI_DONE';
  result?: {
    architecture?: {
      nodes: AiArchitectureNode[];
      edges: AiArchitectureEdge[];
    };
  };
}

export type ProjectWsIncomingMessage =
  | { type: 'NODE_DRAG'; nodeId: string; x: number; y: number }
  | { type: 'AI_CHUNK'; content: string }
  | AiDoneMessage
  | { type: 'AI_ERROR'; message: string };

export type ProjectWsOutgoingMessage =
  | {
      type: 'AI_CHAT_STREAM';
      prompt: string;
      currentArchitecture: {
        nodes: AiCanvasSnapshotNode[];
        edges: AiCanvasSnapshotEdge[];
      };
    }
  | { type: 'NODE_DRAG'; nodeId: string; x: number; y: number };
