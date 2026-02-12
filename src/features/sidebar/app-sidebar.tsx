import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

const statusIndicators: Record<string, string> = {
  "not-started": "bg-gray-400",
  "in-progress": "bg-yellow-400",
  complete: "bg-green-400",
};

export function AppSidebar() {
  const { nodes, selectedNodeId, selectNode } = useStore();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(nodes.map((n) => n.id)));

  // Build tree structure
  const rootNodes = nodes.filter((n) => n.level === "root");

  const getChildren = (parentId: string) => {
    return nodes.filter((n) => n.parentId === parentId);
  };

  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const countDescendants = (nodeId: string): number => {
    const children = getChildren(nodeId);
    return children.length + children.reduce((sum, child) => sum + countDescendants(child.id), 0);
  };

  const renderNode = (node: (typeof nodes)[0], depth = 0) => {
    const children = getChildren(node.id);
    const isSelected = node.id === selectedNodeId;
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = children.length > 0;
    const descendantCount = countDescendants(node.id);

    return (
      <div key={node.id}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2 group cursor-pointer",
                isSelected && "bg-blue-50 text-blue-700 font-medium",
              )}
              style={{ paddingLeft: `${depth * 16 + 12}px` }}
              onContextMenu={(e) => {
                e.preventDefault();
              }}
            >
              {/* Expand/collapse toggle */}
              <button
                type="button"
                className="flex-shrink-0 hover:bg-gray-200 rounded p-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasChildren) {
                    toggleExpanded(node.id);
                  }
                }}
              >
                {hasChildren ? (
                  isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )
                ) : (
                  <div className="w-4 h-4" />
                )}
              </button>

              {/* Node info */}
              <button
                type="button"
                className="flex-1 flex items-center gap-2 min-w-0 cursor-pointer bg-transparent border-none p-0 text-left"
                onClick={() => selectNode(node.id)}
              >
                {/* Color dot */}
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: node.color }}
                />

                {/* Research status */}
                <div
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    statusIndicators[node.researchStatus],
                  )}
                  title={node.researchStatus}
                />

                {/* Label */}
                <span className="truncate flex-1">{node.label}</span>

                {/* Node count badge */}
                {descendantCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {descendantCount}
                  </Badge>
                )}

                {/* Add child button */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Open add node dialog with this parent
                    console.log("Add child to:", node.id);
                  }}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </button>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() => {
                console.log("Add child to:", node.id);
              }}
            >
              Add Child
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                console.log("Rename node:", node.id);
                // TODO: Implement rename dialog
              }}
            >
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                console.log("Change color:", node.id);
                // TODO: Implement color picker
              }}
            >
              Change Color
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => {
                console.log("Delete node:", node.id);
                // TODO: Implement delete confirmation
              }}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Render children if expanded */}
        {isExpanded && children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Market Tree</h2>
      </div>
      <div className="p-2 flex-1 overflow-y-auto">{rootNodes.map((node) => renderNode(node))}</div>
    </div>
  );
}
