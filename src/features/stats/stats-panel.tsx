import { useStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { CompetitionLevel, NodeLevel, ResearchStatus } from "@/types/market";
import {
  BarChart3,
  Brain,
  Layers,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo } from "react";

interface TreeStats {
  totalNodes: number;
  byLevel: Record<NodeLevel, number>;
  byResearchStatus: Record<ResearchStatus, number>;
  byCompetition: Record<CompetitionLevel | "unknown", number>;
  averageValidationScore: number;
  scoredNodes: number;
  totalTags: number;
  uniqueTags: string[];
  totalPainPoints: number;
  totalAudiences: number;
  maxDepth: number;
  researchCoverage: number;
}

function computeStats(
  nodes: ReturnType<typeof useStore.getState>["nodes"],
): TreeStats {
  const byLevel: Record<string, number> = {};
  const byResearchStatus: Record<string, number> = {};
  const byCompetition: Record<string, number> = {};
  const allTags = new Set<string>();
  let totalScore = 0;
  let scoredNodes = 0;
  let totalPainPoints = 0;
  let totalAudiences = 0;

  for (const node of nodes) {
    byLevel[node.level] = (byLevel[node.level] || 0) + 1;
    byResearchStatus[node.researchStatus] =
      (byResearchStatus[node.researchStatus] || 0) + 1;

    const comp = node.competition || "unknown";
    byCompetition[comp] = (byCompetition[comp] || 0) + 1;

    for (const tag of node.tags) allTags.add(tag);
    totalPainPoints += node.painPoints.length;
    totalAudiences += node.audiences.length;

    if (node.validationScore != null && node.validationScore > 0) {
      totalScore += node.validationScore;
      scoredNodes++;
    }
  }

  // Calculate max depth
  function getDepth(nodeId: string, visited = new Set<string>()): number {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);
    const children = nodes.filter((n) => n.parentId === nodeId);
    if (children.length === 0) return 1;
    return 1 + Math.max(...children.map((c) => getDepth(c.id, visited)));
  }

  const roots = nodes.filter((n) => !n.parentId);
  const maxDepth =
    roots.length > 0
      ? Math.max(...roots.map((r) => getDepth(r.id)))
      : 0;

  const researched = byResearchStatus.complete || 0;
  const researchCoverage =
    nodes.length > 0 ? (researched / nodes.length) * 100 : 0;

  return {
    totalNodes: nodes.length,
    byLevel: byLevel as Record<NodeLevel, number>,
    byResearchStatus: byResearchStatus as Record<ResearchStatus, number>,
    byCompetition: byCompetition as Record<CompetitionLevel | "unknown", number>,
    averageValidationScore: scoredNodes > 0 ? totalScore / scoredNodes : 0,
    scoredNodes,
    totalTags: allTags.size,
    uniqueTags: Array.from(allTags).sort(),
    totalPainPoints,
    totalAudiences,
    maxDepth,
    researchCoverage,
  };
}

const LEVEL_LABELS: Record<string, string> = {
  root: "Root",
  "core-market": "Core Market",
  submarket: "Submarket",
  niche: "Niche",
  "sub-niche": "Sub-Niche",
};

const LEVEL_COLORS: Record<string, string> = {
  root: "bg-gray-500",
  "core-market": "bg-blue-500",
  submarket: "bg-purple-500",
  niche: "bg-green-500",
  "sub-niche": "bg-orange-500",
};

export function StatsPanel() {
  const nodes = useStore((s) => s.nodes);
  const stats = useMemo(() => computeStats(nodes), [nodes]);

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No nodes to analyze. Add some markets to see statistics.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        Market Tree Statistics
      </h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Layers className="w-4 h-4" />
              Total Nodes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNodes}</div>
            <p className="text-xs text-muted-foreground">
              Depth: {stats.maxDepth} levels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Brain className="w-4 h-4" />
              Research Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.researchCoverage.toFixed(0)}%
            </div>
            <Progress value={stats.researchCoverage} className="mt-1 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Avg Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.scoredNodes > 0
                ? stats.averageValidationScore.toFixed(1)
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.scoredNodes}/{stats.totalNodes} scored
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Target className="w-4 h-4" />
              Pain Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPainPoints}</div>
            <p className="text-xs text-muted-foreground">
              <Users className="w-3 h-3 inline mr-1" />
              {stats.totalAudiences} audiences
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Node Distribution by Level */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Distribution by Level
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(LEVEL_LABELS).map(([level, label]) => {
            const count = stats.byLevel[level as NodeLevel] || 0;
            const pct =
              stats.totalNodes > 0
                ? (count / stats.totalNodes) * 100
                : 0;
            return (
              <div key={level} className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${LEVEL_COLORS[level]}`}
                />
                <span className="text-sm flex-1">{label}</span>
                <span className="text-sm font-mono">{count}</span>
                <div className="w-20">
                  <Progress value={pct} className="h-1.5" />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Research Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Research Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(
            [
              ["not-started", "Not Started", "bg-gray-400"],
              ["in-progress", "In Progress", "bg-yellow-400"],
              ["complete", "Complete", "bg-green-400"],
            ] as const
          ).map(([status, label, color]) => {
            const count =
              stats.byResearchStatus[status as ResearchStatus] || 0;
            return (
              <div key={status} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-sm flex-1">{label}</span>
                <span className="text-sm font-mono">{count}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Competition Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Competition Levels
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(
            [
              ["low", "Low", "text-green-500"],
              ["medium", "Medium", "text-yellow-500"],
              ["high", "High", "text-red-500"],
              ["unknown", "Unknown", "text-gray-400"],
            ] as const
          ).map(([level, label, color]) => {
            const count = stats.byCompetition[level] || 0;
            if (count === 0 && level === "unknown") return null;
            return (
              <div key={level} className="flex items-center gap-2">
                <span className={`text-sm font-medium ${color}`}>●</span>
                <span className="text-sm flex-1">{label}</span>
                <span className="text-sm font-mono">{count}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Tags Cloud */}
      {stats.uniqueTags.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Tags ({stats.totalTags})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {stats.uniqueTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Export for testing
export { computeStats };
export type { TreeStats };
