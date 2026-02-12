import type { NodeTypes } from "@xyflow/react";
import { MarketNode } from "./market-node";
import type { MarketNodeData } from "@/types/market";

export const nodeTypes: NodeTypes = {
  market: MarketNode,
} satisfies NodeTypes;

export type { MarketNodeData };
