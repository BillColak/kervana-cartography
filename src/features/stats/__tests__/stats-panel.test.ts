import { describe, expect, it } from "vitest";
import type { MarketNodeData } from "@/types/market";
import { computeStats } from "../stats-panel";

function makeNode(overrides: Partial<MarketNodeData> = {}): MarketNodeData {
  return {
    id: "test-1",
    label: "Test",
    level: "niche",
    color: "#000",
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

describe("computeStats", () => {
  it("handles empty nodes", () => {
    const stats = computeStats([]);
    expect(stats.totalNodes).toBe(0);
    expect(stats.maxDepth).toBe(0);
    expect(stats.researchCoverage).toBe(0);
    expect(stats.averageValidationScore).toBe(0);
  });

  it("counts total nodes", () => {
    const nodes = [makeNode({ id: "a" }), makeNode({ id: "b" }), makeNode({ id: "c" })];
    const stats = computeStats(nodes);
    expect(stats.totalNodes).toBe(3);
  });

  it("counts by level", () => {
    const nodes = [
      makeNode({ id: "a", level: "root" }),
      makeNode({ id: "b", level: "niche" }),
      makeNode({ id: "c", level: "niche" }),
    ];
    const stats = computeStats(nodes);
    expect(stats.byLevel.root).toBe(1);
    expect(stats.byLevel.niche).toBe(2);
  });

  it("counts by research status", () => {
    const nodes = [
      makeNode({ id: "a", researchStatus: "complete" }),
      makeNode({ id: "b", researchStatus: "complete" }),
      makeNode({ id: "c", researchStatus: "not-started" }),
    ];
    const stats = computeStats(nodes);
    expect(stats.byResearchStatus.complete).toBe(2);
    expect(stats.byResearchStatus["not-started"]).toBe(1);
    expect(stats.researchCoverage).toBeCloseTo(66.67, 0);
  });

  it("computes average validation score", () => {
    const nodes = [
      makeNode({ id: "a", validationScore: 80 }),
      makeNode({ id: "b", validationScore: 60 }),
      makeNode({ id: "c" }), // no score
    ];
    const stats = computeStats(nodes);
    expect(stats.averageValidationScore).toBe(70);
    expect(stats.scoredNodes).toBe(2);
  });

  it("collects unique tags", () => {
    const nodes = [
      makeNode({ id: "a", tags: ["health", "fitness"] }),
      makeNode({ id: "b", tags: ["fitness", "yoga"] }),
    ];
    const stats = computeStats(nodes);
    expect(stats.totalTags).toBe(3);
    expect(stats.uniqueTags).toEqual(["fitness", "health", "yoga"]);
  });

  it("counts pain points and audiences", () => {
    const nodes = [
      makeNode({ id: "a", painPoints: ["p1", "p2"], audiences: ["a1"] }),
      makeNode({ id: "b", painPoints: ["p3"], audiences: ["a2", "a3"] }),
    ];
    const stats = computeStats(nodes);
    expect(stats.totalPainPoints).toBe(3);
    expect(stats.totalAudiences).toBe(3);
  });

  it("calculates tree depth", () => {
    const nodes = [
      makeNode({ id: "root", parentId: null }),
      makeNode({ id: "l1", parentId: "root" }),
      makeNode({ id: "l2", parentId: "l1" }),
      makeNode({ id: "l3", parentId: "l2" }),
    ];
    const stats = computeStats(nodes);
    expect(stats.maxDepth).toBe(4);
  });

  it("counts competition levels", () => {
    const nodes = [
      makeNode({ id: "a", competition: "low" }),
      makeNode({ id: "b", competition: "high" }),
      makeNode({ id: "c", competition: "high" }),
      makeNode({ id: "d" }), // unknown
    ];
    const stats = computeStats(nodes);
    expect(stats.byCompetition.low).toBe(1);
    expect(stats.byCompetition.high).toBe(2);
    expect(stats.byCompetition.unknown).toBe(1);
  });
});
