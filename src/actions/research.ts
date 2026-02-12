import { invokeCommand } from "@/lib/tauri";

export interface ResearchJob {
  id: string;
  nodeId: string;
  jobType: string;
  status: string;
  resultJson: string | null;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface SubNicheSuggestion {
  label: string;
  description: string;
  pain_points: string[];
  audiences: string[];
  competition_level: string;
  keywords: string[];
}

export interface PainPointResult {
  frustration: string;
  user_quote: string;
  why_solutions_fail: string;
  severity: number;
}

export interface ValidationResult {
  market_depth: number;
  competition_intensity: number;
  pain_severity: number;
  monetization_potential: number;
  final_score: number;
  summary: string;
}

export async function startResearch(nodeId: string, jobType: string): Promise<ResearchJob> {
  return invokeCommand<ResearchJob>("start_research", { nodeId, jobType });
}

export async function getResearchStatus(jobId: string): Promise<ResearchJob> {
  return invokeCommand<ResearchJob>("get_research_status", { jobId });
}

export async function getResearchResults(nodeId: string): Promise<ResearchJob[]> {
  return invokeCommand<ResearchJob[]>("get_research_results", { nodeId });
}

export async function cancelResearch(jobId: string): Promise<void> {
  return invokeCommand<void>("cancel_research", { jobId });
}
