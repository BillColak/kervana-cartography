import { describe, expect, it } from "vitest";
import type { MarketNodeData } from "@/types/market";
import type { Edge, Node } from "@xyflow/react";
import { getLayoutedElements } from "../auto-layout";

function makeFlowNode(id: string, data: Partial<MarketNodeData> = {}): Node<MarketNodeData> {
  return {
    id,
    type: "marketNode",
    position: { x: 0, y: 0 },
    data: {
      id,
      label: id,
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
      ...data,
    },
  };
}

function makeFlowEdge(source: string, target: string): Edge {
  return { id: `${source}-${target}`, source, target };
}

describe("getLayoutedElements", () => {
  it("returns nodes with updated positions", () => {
    const nodes = [makeFlowNode("root"), makeFlowNode("child1"), makeFlowNode("child2")];
    const edges = [makeFlowEdge("root", "child1"), makeFlowEdge("root", "child2")];

    const result = getLayoutedElements(nodes, edges);
    expect(result.nodes).toHaveLength(3);

    // All nodes should have position set by dagre
    for (const node of result.nodes) {
      expect(node.position.x).toBeDefined();
      expect(node.position.y).toBeDefined();
    }
  });

  it("root is above children in TB layout", () => {
    const nodes = [makeFlowNode("root"), makeFlowNode("child")];
    const edges = [makeFlowEdge("root", "child")];

    const result = getLayoutedElements(nodes, edges, "TB");
    const rootNode = result.nodes.find((n) => n.id === "root");
    const childNode = result.nodes.find((n) => n.id === "child");

    expect(rootNode!.position.y).toBeLessThan(childNode!.position.y);
  });

  it("root is left of children in LR layout", () => {
    const nodes = [makeFlowNode("root"), makeFlowNode("child")];
    const edges = [makeFlowEdge("root", "child")];

    const result = getLayoutedElements(nodes, edges, "LR");
    const rootNode = result.nodes.find((n) => n.id === "root");
    const childNode = result.nodes.find((n) => n.id === "child");

    expect(rootNode!.position.x).toBeLessThan(childNode!.position.x);
  });

  it("siblings are spread horizontally in TB layout", () => {
    const nodes = [makeFlowNode("root"), makeFlowNode("a"), makeFlowNode("b")];
    const edges = [makeFlowEdge("root", "a"), makeFlowEdge("root", "b")];

    const result = getLayoutedElements(nodes, edges, "TB");
    const a = result.nodes.find((n) => n.id === "a")!;
    const b = result.nodes.find((n) => n.id === "b")!;

    // Same Y level, different X
    expect(a.position.y).toBe(b.position.y);
    expect(a.position.x).not.toBe(b.position.x);
  });

  it("preserves edges unchanged", () => {
    const nodes = [makeFlowNode("a"), makeFlowNode("b")];
    const edges = [makeFlowEdge("a", "b")];

    const result = getLayoutedElements(nodes, edges);
    expect(result.edges).toEqual(edges);
  });

  it("handles single node (no edges)", () => {
    const nodes = [makeFlowNode("solo")];
    const result = getLayoutedElements(nodes, []);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].position).toBeDefined();
  });

  it("handles empty inputs", () => {
    const result = getLayoutedElements([], []);
    expect(result.nodes).toEqual([]);
    expect(result.edges).toEqual([]);
  });
});
