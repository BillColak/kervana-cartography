import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { createEdge, deleteEdge, getEdges } from "../edges";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe("edge actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getEdges calls get_edges", async () => {
    const edges = [{ id: "e1", sourceId: "a", targetId: "b", color: "#fff" }];
    mockInvoke.mockResolvedValueOnce(edges);

    const result = await getEdges();
    expect(mockInvoke).toHaveBeenCalledWith("get_edges", undefined);
    expect(result).toEqual(edges);
  });

  it("createEdge passes sourceId, targetId, color", async () => {
    const edge = { id: "e1", sourceId: "a", targetId: "b", color: "#00bcd4" };
    mockInvoke.mockResolvedValueOnce(edge);

    const result = await createEdge("a", "b", "#00bcd4");
    expect(mockInvoke).toHaveBeenCalledWith("create_edge", {
      sourceId: "a",
      targetId: "b",
      color: "#00bcd4",
    });
    expect(result).toEqual(edge);
  });

  it("deleteEdge passes id", async () => {
    mockInvoke.mockResolvedValueOnce(undefined);

    await deleteEdge("e1");
    expect(mockInvoke).toHaveBeenCalledWith("delete_edge", { id: "e1" });
  });
});
