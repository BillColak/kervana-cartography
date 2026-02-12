import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { cancelResearch, getResearchResults, getResearchStatus, startResearch } from "../research";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe("research actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("startResearch passes nodeId and jobType", async () => {
    const job = { id: "job_1", nodeId: "a", jobType: "EXPAND", status: "QUEUED" };
    mockInvoke.mockResolvedValueOnce(job);

    const result = await startResearch("a", "EXPAND");
    expect(mockInvoke).toHaveBeenCalledWith("start_research", {
      nodeId: "a",
      jobType: "EXPAND",
    });
    expect(result).toEqual(job);
  });

  it("getResearchStatus passes jobId", async () => {
    const job = { id: "job_1", status: "COMPLETED" };
    mockInvoke.mockResolvedValueOnce(job);

    const result = await getResearchStatus("job_1");
    expect(mockInvoke).toHaveBeenCalledWith("get_research_status", { jobId: "job_1" });
    expect(result).toEqual(job);
  });

  it("getResearchResults passes nodeId", async () => {
    mockInvoke.mockResolvedValueOnce([]);

    const result = await getResearchResults("a");
    expect(mockInvoke).toHaveBeenCalledWith("get_research_results", { nodeId: "a" });
    expect(result).toEqual([]);
  });

  it("cancelResearch passes jobId", async () => {
    mockInvoke.mockResolvedValueOnce(undefined);

    await cancelResearch("job_1");
    expect(mockInvoke).toHaveBeenCalledWith("cancel_research", { jobId: "job_1" });
  });
});
