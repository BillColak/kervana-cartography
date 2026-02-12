import { createEdge } from "@/actions/edges";
import { createNode } from "@/actions/nodes";
import {
  type ResearchJob,
  type SubNicheSuggestion,
  getResearchResults,
  getResearchStatus,
  startResearch,
} from "@/actions/research";
import { useStore } from "@/lib/store";
import type { NodeLevel } from "@/types/market";
import { create } from "zustand";

const POLL_INTERVAL = 2000;

const NEXT_LEVEL: Record<string, NodeLevel> = {
  root: "core-market",
  "core-market": "submarket",
  submarket: "niche",
  niche: "sub-niche",
  "sub-niche": "sub-niche",
};

interface ResearchState {
  activeJobs: Record<string, ResearchJob>;
  results: Record<string, ResearchJob[]>;
  polling: Record<string, ReturnType<typeof setInterval>>;

  startNodeResearch: (nodeId: string, jobType: string) => Promise<void>;
  loadNodeResults: (nodeId: string) => Promise<void>;
  isNodeResearching: (nodeId: string) => boolean;
  getNodeResults: (nodeId: string, jobType: string) => ResearchJob | undefined;
  clearResults: () => void;
}

export const useResearchStore = create<ResearchState>((set, get) => ({
  activeJobs: {},
  results: {},
  polling: {},

  startNodeResearch: async (nodeId, jobType) => {
    try {
      const job = await startResearch(nodeId, jobType);
      set((state) => ({
        activeJobs: { ...state.activeJobs, [job.id]: job },
      }));

      // Start polling
      const interval = setInterval(async () => {
        try {
          const updated = await getResearchStatus(job.id);
          set((state) => ({
            activeJobs: { ...state.activeJobs, [job.id]: updated },
          }));

          if (updated.status === "COMPLETED" || updated.status === "FAILED") {
            clearInterval(interval);
            set((state) => {
              const { [job.id]: _, ...remaining } = state.polling;
              const { [job.id]: __, ...remainingJobs } = state.activeJobs;
              return { polling: remaining, activeJobs: remainingJobs };
            });

            // Reload results for this node
            await get().loadNodeResults(nodeId);

            // If expansion completed, auto-create child nodes
            if (updated.status === "COMPLETED" && jobType === "EXPAND" && updated.resultJson) {
              await autoCreateChildNodes(nodeId, updated.resultJson);
            }
          }
        } catch (err) {
          console.error("Poll error:", err);
        }
      }, POLL_INTERVAL);

      set((state) => ({
        polling: { ...state.polling, [job.id]: interval },
      }));
    } catch (err) {
      console.error("Start research error:", err);
    }
  },

  loadNodeResults: async (nodeId) => {
    try {
      const jobs = await getResearchResults(nodeId);
      set((state) => ({
        results: { ...state.results, [nodeId]: jobs },
      }));
    } catch (err) {
      console.error("Load results error:", err);
    }
  },

  isNodeResearching: (nodeId) => {
    const { activeJobs } = get();
    return Object.values(activeJobs).some(
      (job) => job.nodeId === nodeId && (job.status === "QUEUED" || job.status === "PROCESSING"),
    );
  },

  getNodeResults: (nodeId, jobType) => {
    const { results } = get();
    const nodeResults = results[nodeId] || [];
    return nodeResults.find((r) => r.jobType === jobType && r.status === "COMPLETED");
  },

  clearResults: () => {
    const { polling } = get();
    for (const interval of Object.values(polling)) {
      clearInterval(interval);
    }
    set({ activeJobs: {}, results: {}, polling: {} });
  },
}));

async function autoCreateChildNodes(parentNodeId: string, resultJson: string) {
  try {
    const parsed = JSON.parse(resultJson);
    const suggestions: SubNicheSuggestion[] = parsed.suggestions || [];
    const store = useStore.getState();
    const parentNode = store.nodes.find((n) => n.id === parentNodeId);
    if (!parentNode) return;

    const childLevel = NEXT_LEVEL[parentNode.level] || "sub-niche";
    const spacing = 250;
    const startX = parentNode.x - ((suggestions.length - 1) * spacing) / 2;

    for (let i = 0; i < suggestions.length; i++) {
      const suggestion = suggestions[i];
      const newNode = await createNode({
        label: suggestion.label,
        level: childLevel,
        color: parentNode.color,
        parentId: parentNodeId,
        x: startX + i * spacing,
        y: parentNode.y + 200,
      });

      store.addNode(newNode);

      try {
        const edge = await createEdge(parentNodeId, newNode.id, parentNode.color);
        store.addEdge(edge);
      } catch (err) {
        console.error("Edge creation error:", err);
      }
    }
  } catch (err) {
    console.error("Auto-create nodes error:", err);
  }
}
