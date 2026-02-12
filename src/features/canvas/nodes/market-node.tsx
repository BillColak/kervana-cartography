import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useResearchStore } from "@/lib/research-store";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { MarketNodeData } from "@/types/market";
import { Handle, Position } from "@xyflow/react";
import { AlertCircle, Loader2, Tag } from "lucide-react";

const statusIndicators: Record<string, string> = {
  "not-started": "bg-gray-400",
  "in-progress": "bg-yellow-400",
  complete: "bg-green-400",
};

interface MarketNodeProps {
  data: MarketNodeData;
  selected?: boolean;
}

export function MarketNode({ data, selected }: MarketNodeProps) {
  const { setView, selectNode } = useStore();
  const isResearching = useResearchStore((s) => s.isNodeResearching(data.id));

  const handleDoubleClick = () => {
    selectNode(data.id);
    setView("split");
  };

  const markdownPreview = data.markdown
    ? data.markdown.split("\n")[0].substring(0, 60) + (data.markdown.length > 60 ? "..." : "")
    : "";

  const hasScore = data.validationScore != null && data.validationScore > 0;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={400}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "px-4 py-3 rounded-xl border-2 bg-white dark:bg-gray-800 shadow-md min-w-[200px] max-w-[280px] cursor-pointer transition-all duration-200",
              "hover:shadow-lg hover:-translate-y-0.5",
              selected && "ring-2 ring-blue-400 shadow-blue-100 dark:shadow-blue-900/20",
            )}
            style={{ borderColor: data.color }}
            onDoubleClick={handleDoubleClick}
          >
            <Handle
              type="target"
              position={Position.Top}
              className="!w-2 !h-2 !bg-gray-400 !border-none"
            />

            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm leading-tight">{data.label}</div>
                <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 uppercase tracking-wider">
                  {data.level.replace("-", " ")}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isResearching && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                <div
                  className={cn("w-2.5 h-2.5 rounded-full", statusIndicators[data.researchStatus])}
                  title={data.researchStatus}
                />
              </div>
            </div>

            {/* Validation score bar */}
            {hasScore &&
              (() => {
                const score = data.validationScore ?? 0;
                return (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px] mb-0.5">
                      <span className="text-gray-500 dark:text-gray-400">Score</span>
                      <span
                        className={cn(
                          "font-bold",
                          score >= 70
                            ? "text-green-600"
                            : score >= 40
                              ? "text-yellow-600"
                              : "text-red-500",
                        )}
                      >
                        {Math.round(score)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          score >= 70
                            ? "bg-green-500"
                            : score >= 40
                              ? "bg-yellow-500"
                              : "bg-red-500",
                        )}
                        style={{ width: `${Math.min(score, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

            {/* Badges */}
            {(data.tags.length > 0 || data.painPoints.length > 0) && (
              <div className="flex items-center gap-1.5 mt-2">
                {data.tags.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-5 gap-0.5 px-1.5">
                    <Tag className="w-2.5 h-2.5" />
                    {data.tags.length}
                  </Badge>
                )}
                {data.painPoints.length > 0 && (
                  <Badge variant="outline" className="text-[10px] h-5 gap-0.5 px-1.5">
                    <AlertCircle className="w-2.5 h-2.5" />
                    {data.painPoints.length}
                  </Badge>
                )}
                {data.competition && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] h-5 px-1.5",
                      data.competition === "low"
                        ? "text-green-600 border-green-200"
                        : data.competition === "high"
                          ? "text-red-600 border-red-200"
                          : "text-yellow-600 border-yellow-200",
                    )}
                  >
                    {data.competition}
                  </Badge>
                )}
              </div>
            )}

            {/* Markdown preview */}
            {markdownPreview && (
              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 italic leading-relaxed line-clamp-2">
                {markdownPreview}
              </div>
            )}

            <Handle
              type="source"
              position={Position.Bottom}
              className="!w-2 !h-2 !bg-gray-400 !border-none"
            />
          </div>
        </TooltipTrigger>

        <TooltipContent side="right" className="max-w-xs p-3">
          <div className="space-y-2">
            <div>
              <div className="font-semibold text-sm">{data.label}</div>
              <div className="text-xs text-gray-400 capitalize">{data.level.replace("-", " ")}</div>
            </div>

            {data.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {data.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {data.painPoints.length > 0 && (
              <div>
                <div className="text-xs font-medium mb-1">Pain Points</div>
                <ul className="text-xs space-y-0.5 text-gray-600 dark:text-gray-300">
                  {data.painPoints.slice(0, 3).map((p) => (
                    <li key={p} className="flex gap-1">
                      <span className="text-red-400">•</span> {p}
                    </li>
                  ))}
                  {data.painPoints.length > 3 && (
                    <li className="text-gray-400">+{data.painPoints.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            {data.audiences.length > 0 && (
              <div className="text-xs text-gray-600 dark:text-gray-300">
                <span className="font-medium">Audiences:</span>{" "}
                {data.audiences.slice(0, 2).join(", ")}
              </div>
            )}

            <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-200 dark:border-gray-600">
              Double-click to edit · Right-click for AI
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
