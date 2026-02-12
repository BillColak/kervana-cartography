import type {
  PainPointResult,
  ResearchJob,
  SubNicheSuggestion,
  ValidationResult,
} from "@/actions/research";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useResearchStore } from "@/lib/research-store";
import { useStore } from "@/lib/store";
import { Brain, Loader2, Target, TrendingUp } from "lucide-react";
import { useEffect } from "react";

export function ResearchPanel() {
  const { nodes, selectedNodeId } = useStore();
  const { startNodeResearch, loadNodeResults, isNodeResearching, getNodeResults } =
    useResearchStore();

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const isResearching = selectedNodeId ? isNodeResearching(selectedNodeId) : false;

  useEffect(() => {
    if (selectedNodeId) {
      loadNodeResults(selectedNodeId);
    }
  }, [selectedNodeId, loadNodeResults]);

  if (!selectedNode) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 p-4">
        Select a node to run AI research
      </div>
    );
  }

  const expandResult = getNodeResults(selectedNode.id, "EXPAND");
  const painResult = getNodeResults(selectedNode.id, "PAIN_POINTS");
  const validateResult = getNodeResults(selectedNode.id, "VALIDATE");

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold flex items-center gap-2">
          <Brain className="w-4 h-4" />
          AI Research
        </h3>
        <p className="text-sm text-gray-500 mt-1">{selectedNode.label}</p>
      </div>

      <Tabs defaultValue="expand" className="flex-1">
        <TabsList className="w-full justify-start px-4 pt-2">
          <TabsTrigger value="expand" className="text-xs">
            Sub-Niches
          </TabsTrigger>
          <TabsTrigger value="pain" className="text-xs">
            Pain Points
          </TabsTrigger>
          <TabsTrigger value="validate" className="text-xs">
            Validation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expand" className="p-4 space-y-3">
          <ExpandTab
            result={expandResult}
            isResearching={isResearching}
            onRun={() => startNodeResearch(selectedNode.id, "EXPAND")}
          />
        </TabsContent>

        <TabsContent value="pain" className="p-4 space-y-3">
          <PainPointsTab
            result={painResult}
            isResearching={isResearching}
            onRun={() => startNodeResearch(selectedNode.id, "PAIN_POINTS")}
          />
        </TabsContent>

        <TabsContent value="validate" className="p-4 space-y-3">
          <ValidationTab
            result={validateResult}
            isResearching={isResearching}
            onRun={() => startNodeResearch(selectedNode.id, "VALIDATE")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RunButton({
  label,
  isResearching,
  onRun,
}: { label: string; isResearching: boolean; onRun: () => void }) {
  return (
    <Button onClick={onRun} disabled={isResearching} className="w-full" variant="outline">
      {isResearching ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Researching...
        </>
      ) : (
        <>
          <Brain className="w-4 h-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  );
}

function ExpandTab({
  result,
  isResearching,
  onRun,
}: { result: ResearchJob | undefined; isResearching: boolean; onRun: () => void }) {
  const suggestions = result?.resultJson
    ? (JSON.parse(result.resultJson).suggestions as SubNicheSuggestion[]) || []
    : [];

  return (
    <>
      <RunButton label="Expand with AI" isResearching={isResearching} onRun={onRun} />
      {suggestions.map((s) => (
        <Card key={s.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{s.label}</CardTitle>
            <CardDescription className="text-xs">{s.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">
                {s.competition_level}
              </Badge>
              {s.keywords.slice(0, 3).map((k) => (
                <Badge key={k} variant="secondary" className="text-xs">
                  {k}
                </Badge>
              ))}
            </div>
            {s.pain_points.length > 0 && (
              <div className="text-xs text-gray-600">
                <Target className="w-3 h-3 inline mr-1" />
                {s.pain_points[0]}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      {result && suggestions.length === 0 && (
        <p className="text-sm text-gray-500">No suggestions found. Try again.</p>
      )}
    </>
  );
}

function PainPointsTab({
  result,
  isResearching,
  onRun,
}: { result: ResearchJob | undefined; isResearching: boolean; onRun: () => void }) {
  const painPoints = result?.resultJson
    ? (JSON.parse(result.resultJson).pain_points as PainPointResult[]) || []
    : [];

  return (
    <>
      <RunButton label="Discover Pain Points" isResearching={isResearching} onRun={onRun} />
      {painPoints.map((pp) => (
        <Card key={pp.frustration}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-3 h-3 text-red-500" />
              {pp.frustration}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={pp.severity >= 7 ? "destructive" : "secondary"} className="text-xs">
                Severity: {pp.severity}/10
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs italic text-gray-600">&ldquo;{pp.user_quote}&rdquo;</p>
            <p className="text-xs text-gray-500">{pp.why_solutions_fail}</p>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function ValidationTab({
  result,
  isResearching,
  onRun,
}: { result: ResearchJob | undefined; isResearching: boolean; onRun: () => void }) {
  const validation = result?.resultJson
    ? (JSON.parse(result.resultJson).validation as ValidationResult) || null
    : null;

  return (
    <>
      <RunButton label="Validate Niche" isResearching={isResearching} onRun={onRun} />
      {validation && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Score: {Math.round(validation.final_score)}/100
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScoreBar label="Market Depth" value={validation.market_depth} max={10} />
            <ScoreBar label="Competition" value={10 - validation.competition_intensity} max={10} />
            <ScoreBar label="Pain Severity" value={validation.pain_severity} max={10} />
            <ScoreBar label="Monetization" value={validation.monetization_potential} max={10} />
            <p className="text-xs text-gray-600 mt-2">{validation.summary}</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = (value / max) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">
          {value.toFixed(1)}/{max}
        </span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}
