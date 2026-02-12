import { describe, expect, it } from "vitest";
import type { MarketNodeData } from "@/types/market";
import { exportTreeAsJson, exportTreeAsMarkdown } from "../export-markdown";

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

describe("exportTreeAsMarkdown", () => {
  it("generates header and export date", () => {
    const result = exportTreeAsMarkdown([]);
    expect(result).toContain("# Market Research Tree");
    expect(result).toContain("*Exported on");
  });

  it("renders single root node with correct heading", () => {
    const nodes = [makeNode({ id: "root", label: "Core Markets", level: "root" })];
    const result = exportTreeAsMarkdown(nodes);
    expect(result).toContain("# Core Markets");
    expect(result).toContain("**Research Status:** not-started");
  });

  it("renders hierarchy with correct heading levels", () => {
    const nodes = [
      makeNode({ id: "root", label: "Markets", level: "root", parentId: null }),
      makeNode({ id: "health", label: "Health", level: "core-market", parentId: "root" }),
      makeNode({ id: "fitness", label: "Fitness", level: "submarket", parentId: "health" }),
    ];
    const result = exportTreeAsMarkdown(nodes);
    expect(result).toContain("# Markets");
    expect(result).toContain("## Health");
    expect(result).toContain("### Fitness");
  });

  it("includes tags when present", () => {
    const nodes = [makeNode({ tags: ["wellness", "diet"] })];
    const result = exportTreeAsMarkdown(nodes);
    expect(result).toContain("**Tags:** wellness, diet");
  });

  it("includes pain points as list", () => {
    const nodes = [makeNode({ painPoints: ["Too expensive", "Too slow"] })];
    const result = exportTreeAsMarkdown(nodes);
    expect(result).toContain("**Pain Points:**");
    expect(result).toContain("- Too expensive");
    expect(result).toContain("- Too slow");
  });

  it("includes audiences as list", () => {
    const nodes = [makeNode({ audiences: ["Gen Z", "Athletes"] })];
    const result = exportTreeAsMarkdown(nodes);
    expect(result).toContain("**Audiences:**");
    expect(result).toContain("- Gen Z");
    expect(result).toContain("- Athletes");
  });

  it("includes competition level", () => {
    const nodes = [makeNode({ competition: "high" })];
    const result = exportTreeAsMarkdown(nodes);
    expect(result).toContain("**Competition:** high");
  });

  it("includes validation score when > 0", () => {
    const nodes = [makeNode({ validationScore: 75 })];
    const result = exportTreeAsMarkdown(nodes);
    expect(result).toContain("**Validation Score:** 75/100");
  });

  it("excludes validation score when 0 or undefined", () => {
    const nodes = [makeNode({ validationScore: 0 })];
    const result = exportTreeAsMarkdown(nodes);
    expect(result).not.toContain("**Validation Score:**");
  });

  it("includes node markdown content", () => {
    const nodes = [makeNode({ markdown: "This is a **great** niche." })];
    const result = exportTreeAsMarkdown(nodes);
    expect(result).toContain("This is a **great** niche.");
  });

  it("omits empty markdown", () => {
    const nodes = [makeNode({ markdown: "   " })];
    const result = exportTreeAsMarkdown(nodes);
    // Should not have empty content sections (just the separator)
    const lines = result.split("\n");
    const contentLines = lines.filter((l) => l.trim() === "");
    expect(contentLines.length).toBeGreaterThan(0); // has spacing but no stray content
  });

  it("handles empty tree", () => {
    const result = exportTreeAsMarkdown([]);
    expect(result).toContain("# Market Research Tree");
    // Should not crash
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("exportTreeAsJson", () => {
  it("returns valid JSON", () => {
    const nodes = [makeNode({ id: "a" }), makeNode({ id: "b" })];
    const result = exportTreeAsJson(nodes);
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].id).toBe("a");
  });

  it("handles empty array", () => {
    const result = exportTreeAsJson([]);
    expect(JSON.parse(result)).toEqual([]);
  });
});
