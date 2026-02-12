import { invokeCommand } from "@/lib/tauri";
import type { CreateNodeInput, MarketNodeData, UpdateNodeInput } from "@/types/market";

export async function getAllNodes(): Promise<MarketNodeData[]> {
  return invokeCommand<MarketNodeData[]>("get_all_nodes");
}

export async function getNode(id: string): Promise<MarketNodeData> {
  return invokeCommand<MarketNodeData>("get_node", { id });
}

export async function createNode(input: CreateNodeInput): Promise<MarketNodeData> {
  return invokeCommand<MarketNodeData>("create_node", { input });
}

export async function updateNode(id: string, input: UpdateNodeInput): Promise<MarketNodeData> {
  return invokeCommand<MarketNodeData>("update_node", { id, input });
}

export async function deleteNode(id: string): Promise<void> {
  return invokeCommand<void>("delete_node", { id });
}

export async function searchNodes(query: string): Promise<MarketNodeData[]> {
  return invokeCommand<MarketNodeData[]>("search_nodes", { query });
}
