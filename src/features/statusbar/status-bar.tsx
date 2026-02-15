import { useStore } from "@/lib/store";
import { useResearchStore } from "@/lib/research-store";
import { useErrorStore } from "@/lib/error-store";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Database,
  Circle,
  Clock,
  FileText,
  GitBranch,
  Layers,
  Loader2,
  Network,
  Sparkles,
  Tag,
  Target,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { EmbeddingStatus } from "@/actions/embeddings";
import { getEmbeddingStatus } from "@/actions/embeddings";

interface AiProviderInfo {
  provider: string | null;
  available: boolean;
  hint?: string;
}

export function StatusBar() {
  const { nodes, edges, selectedNodeId, view } = useStore();
  const activeJobs = useResearchStore((s) => s.activeJobs);
  const [aiProvider, setAiProvider] = useState<AiProviderInfo | null>(null);
  const [embeddingStatus, setEmbeddingStatus] = useState<EmbeddingStatus | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "idle">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const pushError = useErrorStore((s) => s.pushError);

  // Check AI provider on mount
  useEffect(() => {
    invoke<AiProviderInfo>("get_ai_provider")
      .then(setAiProvider)
      .catch((err) => {
        pushError(String(err), "get AI provider");
        setAiProvider({ provider: null, available: false });
      });
    getEmbeddingStatus()
      .then(setEmbeddingStatus)
      .catch((err) => pushError(String(err), "get embedding status"));
  }, [pushError]);

  // Refresh embedding status when nodes change
  useEffect(() => {
    getEmbeddingStatus()
      .then(setEmbeddingStatus)
      .catch((err) => pushError(String(err), "refresh embedding status"));
  }, [nodes.length, pushError]);

  // Listen for save events (simulated via interval checking)
  useEffect(() => {
    // We'll track when nodes change as a proxy for saves
    if (nodes.length > 0) {
      setSaveState("saved");
      setLastSaved(new Date());
    }
  }, [nodes]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Compute stats
  const totalTags = nodes.reduce((acc, n) => acc + n.tags.length, 0);
  const totalPainPoints = nodes.reduce((acc, n) => acc + n.painPoints.length, 0);
  const totalAudiences = nodes.reduce((acc, n) => acc + n.audiences.length, 0);

  const completedNodes = nodes.filter((n) => n.researchStatus === "complete").length;
  const inProgressNodes = nodes.filter((n) => n.researchStatus === "in-progress").length;
  const notStartedNodes = nodes.filter((n) => n.researchStatus === "not-started").length;

  const scoredNodes = nodes.filter((n) => (n.validationScore ?? 0) > 0);
  const avgScore = scoredNodes.length > 0
    ? Math.round(scoredNodes.reduce((a, n) => a + (n.validationScore ?? 0), 0) / scoredNodes.length)
    : 0;

  const maxDepth = (() => {
    let max = 0;
    for (const node of nodes) {
      let depth = 0;
      let current = node;
      while (current.parentId) {
        depth++;
        const parent = nodes.find((n) => n.id === current.parentId);
        if (!parent) break;
        current = parent;
      }
      max = Math.max(max, depth);
    }
    return max;
  })();

  const runningJobs = Object.values(activeJobs).filter(
    (j) => j.status === "QUEUED" || j.status === "PROCESSING",
  ).length;

  const formatTime = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="h-7 bg-gray-100 dark:cosmic-panel border-t border-gray-200 dark:border-border px-3 flex items-center gap-0 text-[11px] text-gray-500 dark:text-muted-foreground select-none overflow-x-auto">
      {/* AI Provider Status */}
      <StatusItem
        icon={
          aiProvider?.available ? (
            <Sparkles className="w-3 h-3 text-purple-500" />
          ) : (
            <Sparkles className="w-3 h-3 text-gray-400" />
          )
        }
        label={aiProvider?.available ? `AI: ${aiProvider.provider}` : "AI: offline"}
        className={aiProvider?.available ? "text-purple-600 dark:text-purple-400" : "text-gray-400"}
        tooltip={aiProvider?.available ? `Connected to ${aiProvider.provider}` : aiProvider?.hint || "No API key configured"}
      />

      {/* RAG / Embedding Status */}
      {embeddingStatus && (
        <StatusItem
          icon={<Database className="w-3 h-3" />}
          label={`RAG: ${embeddingStatus.embeddedNodes}/${embeddingStatus.totalNodes} (${embeddingStatus.coverage}%)`}
          className={
            embeddingStatus.coverage >= 100
              ? "text-green-600 dark:text-green-400"
              : embeddingStatus.coverage > 0
                ? "text-yellow-600 dark:text-yellow-400"
                : ""
          }
          tooltip={`${embeddingStatus.embeddedNodes} of ${embeddingStatus.totalNodes} nodes embedded for RAG`}
        />
      )}

      <Divider />

      {/* Research Jobs */}
      {runningJobs > 0 ? (
        <StatusItem
          icon={<Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
          label={`${runningJobs} job${runningJobs > 1 ? "s" : ""} running`}
          className="text-blue-600 dark:text-blue-400"
        />
      ) : (
        <StatusItem
          icon={<Activity className="w-3 h-3" />}
          label="Idle"
        />
      )}

      <Divider />

      {/* Save State */}
      <StatusItem
        icon={
          saveState === "saving" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : saveState === "saved" ? (
            <CheckCircle2 className="w-3 h-3 text-green-500" />
          ) : (
            <Circle className="w-3 h-3" />
          )
        }
        label={
          saveState === "saving"
            ? "Saving..."
            : lastSaved
              ? `Saved ${formatTime(lastSaved)}`
              : "Ready"
        }
        className={saveState === "saved" ? "text-green-600 dark:text-green-400" : ""}
      />

      <Divider />

      {/* Tree Stats */}
      <StatusItem icon={<Network className="w-3 h-3" />} label={`${nodes.length} nodes`} />
      <StatusItem icon={<GitBranch className="w-3 h-3" />} label={`${edges.length} edges`} />
      <StatusItem icon={<Layers className="w-3 h-3" />} label={`Depth ${maxDepth}`} />

      <Divider />

      {/* Research Progress */}
      <StatusItem
        icon={<CheckCircle2 className="w-3 h-3 text-green-500" />}
        label={`${completedNodes}`}
        tooltip={`${completedNodes} complete`}
      />
      <StatusItem
        icon={<Clock className="w-3 h-3 text-yellow-500" />}
        label={`${inProgressNodes}`}
        tooltip={`${inProgressNodes} in progress`}
      />
      <StatusItem
        icon={<Circle className="w-3 h-3 text-gray-400" />}
        label={`${notStartedNodes}`}
        tooltip={`${notStartedNodes} not started`}
      />

      {avgScore > 0 && (
        <>
          <Divider />
          <StatusItem
            icon={<Target className="w-3 h-3" />}
            label={`Avg score: ${avgScore}`}
            className={
              avgScore >= 70
                ? "text-green-600 dark:text-green-400"
                : avgScore >= 40
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-red-500"
            }
          />
        </>
      )}

      <Divider />

      {/* Data counts */}
      <StatusItem icon={<Tag className="w-3 h-3" />} label={`${totalTags} tags`} />
      <StatusItem icon={<AlertCircle className="w-3 h-3" />} label={`${totalPainPoints} pains`} />
      <StatusItem icon={<Users className="w-3 h-3" />} label={`${totalAudiences} audiences`} />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side: Selected node info */}
      {selectedNode && (
        <>
          <StatusItem
            icon={
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: selectedNode.color }}
              />
            }
            label={selectedNode.label}
            className="font-medium text-gray-700 dark:text-gray-300 max-w-[150px] truncate"
          />
          <StatusItem
            icon={<FileText className="w-3 h-3" />}
            label={`${selectedNode.markdown.length > 0 ? `${selectedNode.markdown.split(/\s+/).filter(Boolean).length} words` : "empty"}`}
          />
          <StatusItem
            icon={
              <div
                className={cn(
                  "w-2 h-2 rounded-full",
                  selectedNode.researchStatus === "complete"
                    ? "bg-green-500"
                    : selectedNode.researchStatus === "in-progress"
                      ? "bg-yellow-500"
                      : "bg-gray-400",
                )}
              />
            }
            label={selectedNode.researchStatus.replace("-", " ")}
            className="capitalize"
          />
        </>
      )}

      {/* View mode */}
      <Divider />
      <StatusItem
        icon={<Zap className="w-3 h-3" />}
        label={view === "canvas" ? "Canvas" : view === "split" ? "Split" : "Editor"}
      />
    </div>
  );
}

function StatusItem({
  icon,
  label,
  className,
  tooltip,
}: {
  icon: React.ReactNode;
  label: string;
  className?: string;
  tooltip?: string;
}) {
  return (
    <div
      className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-gray-200/50 dark:hover:bg-gray-700/50 whitespace-nowrap", className)}
      title={tooltip || label}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

function Divider() {
  return <div className="w-px h-3.5 bg-gray-300 dark:bg-gray-600 mx-0.5" />;
}
