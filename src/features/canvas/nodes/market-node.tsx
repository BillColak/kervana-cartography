import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { MarketNodeData } from "@/types/market";
import { Handle, Position } from "@xyflow/react";
import { AlertCircle, Tag } from "lucide-react";

const levelColors: Record<string, string> = {
  root: "border-gray-500",
  "core-market": "border-blue-500",
  submarket: "border-green-500",
  niche: "border-yellow-500",
  "sub-niche": "border-purple-500",
};

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

  const handleDoubleClick = () => {
    selectNode(data.id);
    setView("split");
  };

  // Get first line of markdown as preview
  const markdownPreview = data.markdown
    ? data.markdown.split("\n")[0].substring(0, 50) + (data.markdown.length > 50 ? "..." : "")
    : "";

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[200px] max-w-[280px] cursor-pointer hover:shadow-lg transition-shadow",
              levelColors[data.level],
              selected && "ring-2 ring-blue-400",
            )}
            style={{ borderColor: data.color }}
            onDoubleClick={handleDoubleClick}
          >
            <Handle type="target" position={Position.Top} className="w-3 h-3" />

            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{data.label}</div>
                <div className="text-xs text-gray-500 mt-1 capitalize">{data.level}</div>
              </div>
              <div
                className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  statusIndicators[data.researchStatus],
                )}
                title={data.researchStatus}
              />
            </div>

            {/* Badges row */}
            <div className="flex items-center gap-2 mb-2">
              {data.tags.length > 0 && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Tag className="w-3 h-3" />
                  {data.tags.length}
                </Badge>
              )}
              {data.painPoints.length > 0 && (
                <Badge variant="outline" className="text-xs gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {data.painPoints.length}
                </Badge>
              )}
            </div>

            {/* Markdown preview */}
            {markdownPreview && (
              <div className="text-xs text-gray-600 italic truncate">{markdownPreview}</div>
            )}

            <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
          </div>
        </TooltipTrigger>

        <TooltipContent side="right" className="max-w-sm">
          <div className="space-y-2">
            <div>
              <div className="font-semibold">{data.label}</div>
              <div className="text-xs text-gray-400 capitalize">{data.level}</div>
            </div>

            {data.tags.length > 0 && (
              <div>
                <div className="text-xs font-medium mb-1">Tags</div>
                <div className="flex flex-wrap gap-1">
                  {data.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {data.painPoints.length > 0 && (
              <div>
                <div className="text-xs font-medium mb-1">Pain Points</div>
                <ul className="text-xs space-y-1 list-disc list-inside">
                  {data.painPoints.slice(0, 3).map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                  {data.painPoints.length > 3 && (
                    <li className="text-gray-400">+{data.painPoints.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            {data.audiences.length > 0 && (
              <div>
                <div className="text-xs font-medium mb-1">Audiences</div>
                <div className="text-xs">{data.audiences.slice(0, 2).join(", ")}</div>
                {data.audiences.length > 2 && (
                  <div className="text-xs text-gray-400">+{data.audiences.length - 2} more</div>
                )}
              </div>
            )}

            {data.competition && (
              <div className="text-xs">
                <span className="font-medium">Competition:</span> {data.competition}
              </div>
            )}

            {data.validationScore !== undefined && data.validationScore > 0 && (
              <div className="text-xs">
                <span className="font-medium">Validation:</span> {data.validationScore}/100
              </div>
            )}

            <div className="text-xs text-gray-400 pt-2 border-t">Double-click to edit</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
