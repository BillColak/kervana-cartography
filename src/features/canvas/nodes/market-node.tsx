import { Handle, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { MarketNodeData } from "@/types/market";

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
  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg border-2 bg-white shadow-md min-w-[200px]",
        levelColors[data.level],
        selected && "ring-2 ring-blue-400"
      )}
      style={{ borderColor: data.color }}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="font-semibold text-sm">{data.label}</div>
          <div className="text-xs text-gray-500 mt-1 capitalize">{data.level}</div>
        </div>
        <div
          className={cn("w-2 h-2 rounded-full", statusIndicators[data.researchStatus])}
          title={data.researchStatus}
        />
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
