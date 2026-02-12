export type NodeLevel = "root" | "core-market" | "submarket" | "niche" | "sub-niche";
export type ResearchStatus = "not-started" | "in-progress" | "complete";
export type CompetitionLevel = "low" | "medium" | "high";

export interface MarketNodeData extends Record<string, unknown> {
  id: string;
  label: string;
  level: NodeLevel;
  color: string;
  markdown: string;
  tags: string[];
  painPoints: string[];
  audiences: string[];
  marketSize?: string;
  competition?: CompetitionLevel;
  validationScore?: number;
  parentId: string | null;
  researchStatus: ResearchStatus;
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt: number;
  updatedAt: number;
}

export interface MarketEdgeData {
  id: string;
  sourceId: string;
  targetId: string;
  color: string;
}

export interface CreateNodeInput {
  label: string;
  level: NodeLevel;
  color: string;
  parentId?: string | null;
  x?: number;
  y?: number;
}

export interface UpdateNodeInput {
  label?: string;
  color?: string;
  markdown?: string;
  tags?: string[];
  painPoints?: string[];
  audiences?: string[];
  marketSize?: string;
  competition?: CompetitionLevel;
  validationScore?: number;
  researchStatus?: ResearchStatus;
  x?: number;
  y?: number;
}
