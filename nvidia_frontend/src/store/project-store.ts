import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';

// Backend types for chat
export type Role = 'user' | 'assistant' | 'system';
export interface ChatMessage {
  id: number;
  projectId: string;
  role: Role;
  content: string;
  createdAt: string;
}

export interface ProjectState {
  // Canvas State
  nodes: Node[];
  edges: Edge[];
  
  // Chat State
  chatHistory: ChatMessage[];
  isStreaming: boolean;
  streamContent: string;
  
  // Actions
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  // Chat Actions
  setChatHistory: (history: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  setStreamState: (isStreaming: boolean, content?: string) => void;
  appendStreamContent: (content: string) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  nodes: [],
  edges: [],
  chatHistory: [],
  isStreaming: false,
  streamContent: '',

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  setChatHistory: (history) => set({ chatHistory: history }),
  
  addChatMessage: (message) => 
    set((state) => ({ chatHistory: [...state.chatHistory, message] })),
    
  setStreamState: (isStreaming, content = '') => 
    set({ isStreaming, streamContent: content }),
    
  appendStreamContent: (content) =>
    set((state) => ({ streamContent: state.streamContent + content })),
}));
