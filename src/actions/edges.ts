import type { MarketEdgeData } from "@/types/market";
import { invokeCommand } from "@/lib/tauri";

export async function getEdges(): Promise<MarketEdgeData[]> {
  return invokeCommand<MarketEdgeData[]>("get_edges");
}

export async function createEdge(
  sourceId: string,
  targetId: string,
  color: string
): Promise<MarketEdgeData> {
  return invokeCommand<MarketEdgeData>("create_edge", { sourceId, targetId, color });
}

export async function deleteEdge(id: string): Promise<void> {
  return invokeCommand<void>("delete_edge", { id });
}
