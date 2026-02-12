import type { MarketNodeData } from "@/types/market";
import type { NodeTypes } from "@xyflow/react";
import { MarketNode } from "./market-node";

export const nodeTypes: NodeTypes = {
  market: MarketNode,
} satisfies NodeTypes;

export type { MarketNodeData };
