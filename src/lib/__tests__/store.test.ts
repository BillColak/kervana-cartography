import { beforeEach, describe, expect, it } from "vitest";
import type { MarketEdgeData, MarketNodeData } from "@/types/market";
import { useStore } from "../store";

function makeNode(overrides: Partial<MarketNodeData> = {}): MarketNodeData {
  return {
    id: "test-1",
    label: "Test Node",
    level: "niche",
    color: "#00bcd4",
    markdown: "",
    tags: [],
    painPoints: [],
    audiences: [],
    parentId: null,
    researchStatus: "not-started",
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function makeEdge(overrides: Partial<MarketEdgeData> = {}): MarketEdgeData {
  return {
    id: "edge-1",
    sourceId: "parent",
    targetId: "test-1",
    color: "#00bcd4",
    ...overrides,
  };
}

describe("useStore", () => {
  beforeEach(() => {
    useStore.setState({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      view: "canvas",
      sidebarOpen: true,
    });
  });

  describe("node operations", () => {
    it("setNodes replaces all nodes", () => {
      const nodes = [makeNode({ id: "a" }), makeNode({ id: "b" })];
      useStore.getState().setNodes(nodes);
      expect(useStore.getState().nodes).toHaveLength(2);
      expect(useStore.getState().nodes[0].id).toBe("a");

      // Replace entirely
      useStore.getState().setNodes([makeNode({ id: "c" })]);
      expect(useStore.getState().nodes).toHaveLength(1);
      expect(useStore.getState().nodes[0].id).toBe("c");
    });

    it("addNode appends without replacing", () => {
      useStore.getState().setNodes([makeNode({ id: "a" })]);
      useStore.getState().addNode(makeNode({ id: "b" }));
      expect(useStore.getState().nodes).toHaveLength(2);
      expect(useStore.getState().nodes[0].id).toBe("a");
      expect(useStore.getState().nodes[1].id).toBe("b");
    });

    it("updateNode merges partial updates", () => {
      useStore.getState().setNodes([makeNode({ id: "a", label: "Original" })]);
      useStore.getState().updateNode("a", { label: "Updated", markdown: "# Hello" });

      const node = useStore.getState().nodes[0];
      expect(node.label).toBe("Updated");
      expect(node.markdown).toBe("# Hello");
      expect(node.color).toBe("#00bcd4"); // unchanged
    });

    it("updateNode ignores non-existent id", () => {
      useStore.getState().setNodes([makeNode({ id: "a" })]);
      useStore.getState().updateNode("nonexistent", { label: "Nope" });
      expect(useStore.getState().nodes[0].label).toBe("Test Node");
    });

    it("removeNode removes the node", () => {
      useStore.getState().setNodes([makeNode({ id: "a" }), makeNode({ id: "b" })]);
      useStore.getState().removeNode("a");
      expect(useStore.getState().nodes).toHaveLength(1);
      expect(useStore.getState().nodes[0].id).toBe("b");
    });

    it("removeNode cascades to connected edges", () => {
      useStore.getState().setNodes([makeNode({ id: "a" }), makeNode({ id: "b" })]);
      useStore.getState().setEdges([
        makeEdge({ id: "e1", sourceId: "a", targetId: "b" }),
        makeEdge({ id: "e2", sourceId: "b", targetId: "a" }),
        makeEdge({ id: "e3", sourceId: "x", targetId: "y" }),
      ]);

      useStore.getState().removeNode("a");
      // Both edges touching "a" should be gone
      expect(useStore.getState().edges).toHaveLength(1);
      expect(useStore.getState().edges[0].id).toBe("e3");
    });

    it("removeNode clears selection if deleted node was selected", () => {
      useStore.getState().setNodes([makeNode({ id: "a" }), makeNode({ id: "b" })]);
      useStore.getState().selectNode("a");
      useStore.getState().removeNode("a");
      expect(useStore.getState().selectedNodeId).toBeNull();
    });

    it("removeNode preserves selection if different node deleted", () => {
      useStore.getState().setNodes([makeNode({ id: "a" }), makeNode({ id: "b" })]);
      useStore.getState().selectNode("b");
      useStore.getState().removeNode("a");
      expect(useStore.getState().selectedNodeId).toBe("b");
    });
  });

  describe("edge operations", () => {
    it("setEdges replaces all edges", () => {
      useStore.getState().setEdges([makeEdge({ id: "e1" }), makeEdge({ id: "e2" })]);
      expect(useStore.getState().edges).toHaveLength(2);

      useStore.getState().setEdges([makeEdge({ id: "e3" })]);
      expect(useStore.getState().edges).toHaveLength(1);
    });

    it("addEdge appends", () => {
      useStore.getState().setEdges([makeEdge({ id: "e1" })]);
      useStore.getState().addEdge(makeEdge({ id: "e2" }));
      expect(useStore.getState().edges).toHaveLength(2);
    });

    it("removeEdge removes by id", () => {
      useStore.getState().setEdges([makeEdge({ id: "e1" }), makeEdge({ id: "e2" })]);
      useStore.getState().removeEdge("e1");
      expect(useStore.getState().edges).toHaveLength(1);
      expect(useStore.getState().edges[0].id).toBe("e2");
    });
  });

  describe("UI state", () => {
    it("selectNode sets and clears selection", () => {
      useStore.getState().selectNode("abc");
      expect(useStore.getState().selectedNodeId).toBe("abc");

      useStore.getState().selectNode(null);
      expect(useStore.getState().selectedNodeId).toBeNull();
    });

    it("setView changes view mode", () => {
      expect(useStore.getState().view).toBe("canvas");
      useStore.getState().setView("editor");
      expect(useStore.getState().view).toBe("editor");
      useStore.getState().setView("split");
      expect(useStore.getState().view).toBe("split");
    });

    it("toggleSidebar flips state", () => {
      expect(useStore.getState().sidebarOpen).toBe(true);
      useStore.getState().toggleSidebar();
      expect(useStore.getState().sidebarOpen).toBe(false);
      useStore.getState().toggleSidebar();
      expect(useStore.getState().sidebarOpen).toBe(true);
    });
  });
});
