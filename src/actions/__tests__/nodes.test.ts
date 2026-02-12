import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { createNode, deleteNode, getAllNodes, getNode, searchNodes, updateNode } from "../nodes";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe("node actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAllNodes calls get_all_nodes", async () => {
    const nodes = [{ id: "a", label: "Test" }];
    mockInvoke.mockResolvedValueOnce(nodes);

    const result = await getAllNodes();
    expect(mockInvoke).toHaveBeenCalledWith("get_all_nodes", undefined);
    expect(result).toEqual(nodes);
  });

  it("getNode calls get_node with id", async () => {
    const node = { id: "a", label: "Test" };
    mockInvoke.mockResolvedValueOnce(node);

    const result = await getNode("a");
    expect(mockInvoke).toHaveBeenCalledWith("get_node", { id: "a" });
    expect(result).toEqual(node);
  });

  it("createNode passes input object", async () => {
    const input = { label: "New", level: "niche" as const, color: "#fff" };
    const created = { id: "node_123", ...input };
    mockInvoke.mockResolvedValueOnce(created);

    const result = await createNode(input);
    expect(mockInvoke).toHaveBeenCalledWith("create_node", { input });
    expect(result).toEqual(created);
  });

  it("updateNode passes id and input", async () => {
    const input = { label: "Updated" };
    mockInvoke.mockResolvedValueOnce({ id: "a", label: "Updated" });

    await updateNode("a", input);
    expect(mockInvoke).toHaveBeenCalledWith("update_node", { id: "a", input });
  });

  it("deleteNode passes id", async () => {
    mockInvoke.mockResolvedValueOnce(undefined);

    await deleteNode("a");
    expect(mockInvoke).toHaveBeenCalledWith("delete_node", { id: "a" });
  });

  it("searchNodes passes query string", async () => {
    mockInvoke.mockResolvedValueOnce([]);

    await searchNodes("health");
    expect(mockInvoke).toHaveBeenCalledWith("search_nodes", { query: "health" });
  });

  it("propagates Tauri errors", async () => {
    mockInvoke.mockRejectedValueOnce(new Error("DB locked"));

    await expect(getAllNodes()).rejects.toThrow("DB locked");
  });
});
