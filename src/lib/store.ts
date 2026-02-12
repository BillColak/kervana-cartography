import type { MarketEdgeData, MarketNodeData } from "@/types/market";
import { create } from "zustand";

export type ViewMode = "canvas" | "editor" | "split";

interface StoreState {
  nodes: MarketNodeData[];
  edges: MarketEdgeData[];
  selectedNodeId: string | null;
  view: ViewMode;
  sidebarOpen: boolean;

  // Node actions
  setNodes: (nodes: MarketNodeData[]) => void;
  addNode: (node: MarketNodeData) => void;
  updateNode: (id: string, updates: Partial<MarketNodeData>) => void;
  removeNode: (id: string) => void;

  // Edge actions
  setEdges: (edges: MarketEdgeData[]) => void;
  addEdge: (edge: MarketEdgeData) => void;
  removeEdge: (id: string) => void;

  // UI actions
  selectNode: (id: string | null) => void;
  setView: (view: ViewMode) => void;
  toggleSidebar: () => void;
}

export const useStore = create<StoreState>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  view: "canvas",
  sidebarOpen: true,

  setNodes: (nodes) => set({ nodes }),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) => (node.id === id ? { ...node, ...updates } : node)),
    })),
  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter((edge) => edge.sourceId !== id && edge.targetId !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    })),

  setEdges: (edges) => set({ edges }),
  addEdge: (edge) => set((state) => ({ edges: [...state.edges, edge] })),
  removeEdge: (id) => set((state) => ({ edges: state.edges.filter((edge) => edge.id !== id) })),

  selectNode: (id) => set({ selectedNodeId: id }),
  setView: (view) => set({ view }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
