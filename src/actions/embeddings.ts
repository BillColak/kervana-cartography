import { invoke } from "@tauri-apps/api/core";

export interface EmbedResult {
  status: "embedded" | "cached";
  node_id: string;
  dimensions: number;
}

export interface EmbedAllResult {
  total: number;
  embedded: number;
  skipped: number;
  errors: number;
}

export interface EmbeddingStatus {
  embeddedNodes: number;
  totalNodes: number;
  coverage: number;
  providerAvailable: boolean;
}

export interface SimilarNode {
  nodeId: string;
  label: string;
  level: string;
  similarity: number;
}

export async function embedNode(nodeId: string): Promise<EmbedResult> {
  return invoke<EmbedResult>("embed_node", { nodeId });
}

export async function embedAllNodes(): Promise<EmbedAllResult> {
  return invoke<EmbedAllResult>("embed_all_nodes");
}

export async function getEmbeddingStatus(): Promise<EmbeddingStatus> {
  return invoke<EmbeddingStatus>("get_embedding_status");
}

export async function findSimilarNodes(nodeId: string, topK = 5): Promise<SimilarNode[]> {
  return invoke<SimilarNode[]>("find_similar_nodes", { nodeId, topK });
}
