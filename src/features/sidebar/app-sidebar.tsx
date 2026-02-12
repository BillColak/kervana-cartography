import { deleteNode } from "@/actions/nodes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, MoreHorizontal, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

const statusIndicators: Record<string, string> = {
  "not-started": "bg-gray-400",
  "in-progress": "bg-yellow-400",
  complete: "bg-green-400",
};

const statusLabels: Record<string, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  complete: "Complete",
};

export function AppSidebar() {
  const { nodes, selectedNodeId, selectNode, removeNode, setView } = useStore();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(nodes.map((n) => n.id)));
  const [filter, setFilter] = useState("");

  const rootNodes = nodes.filter((n) => n.level === "root");

  const getChildren = (parentId: string) => nodes.filter((n) => n.parentId === parentId);

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

  const expandAll = () => setExpandedNodes(new Set(nodes.map((n) => n.id)));
  const collapseAll = () => setExpandedNodes(new Set());

  const countDescendants = (nodeId: string): number => {
    const children = getChildren(nodeId);
    return children.length + children.reduce((sum, child) => sum + countDescendants(child.id), 0);
  };

  // Filter nodes by label
  const matchesFilter = useMemo(() => {
    if (!filter.trim()) return new Set(nodes.map((n) => n.id));
    const term = filter.toLowerCase();
    const matching = new Set<string>();

    for (const node of nodes) {
      if (
        node.label.toLowerCase().includes(term) ||
        node.tags.some((t) => t.toLowerCase().includes(term))
      ) {
        // Add this node and all ancestors
        matching.add(node.id);
        let current = node;
        while (current.parentId) {
          matching.add(current.parentId);
          const parent = nodes.find((n) => n.id === current.parentId);
          if (!parent) break;
          current = parent;
        }
      }
    }
    return matching;
  }, [filter, nodes]);

  const handleDelete = async (nodeId: string, label: string) => {
    const descendants = countDescendants(nodeId);
    const msg =
      descendants > 0
        ? `Delete "${label}" and ${descendants} child node${descendants > 1 ? "s" : ""}?`
        : `Delete "${label}"?`;

    if (window.confirm(msg)) {
      try {
        await deleteNode(nodeId);
        removeNode(nodeId);
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  const handleEditNode = (nodeId: string) => {
    selectNode(nodeId);
    setView("split");
  };

  // Stats
  const totalNodes = nodes.length;
  const completedNodes = nodes.filter((n) => n.researchStatus === "complete").length;

  const renderNode = (node: (typeof nodes)[0], depth = 0) => {
    if (!matchesFilter.has(node.id)) return null;

    const children = getChildren(node.id);
    const visibleChildren = children.filter((c) => matchesFilter.has(c.id));
    const isSelected = node.id === selectedNodeId;
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = visibleChildren.length > 0;
    const descendantCount = countDescendants(node.id);

    return (
      <div key={node.id}>
        <div
          className={cn(
            "w-full text-left px-2 py-1.5 text-sm rounded flex items-center gap-1.5 group cursor-pointer transition-colors",
            isSelected
              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
              : "hover:bg-gray-100 dark:hover:bg-gray-700/50",
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {/* Expand/collapse toggle */}
          <button
            type="button"
            className="flex-shrink-0 hover:bg-gray-200 dark:hover:bg-gray-600 rounded p-0.5"
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleExpanded(node.id);
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )
            ) : (
              <div className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Color dot */}
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: node.color }}
          />

          {/* Research status */}
          <div
            className={cn(
              "w-1.5 h-1.5 rounded-full flex-shrink-0",
              statusIndicators[node.researchStatus],
            )}
            title={statusLabels[node.researchStatus]}
          />

          {/* Label — clickable */}
          <button
            type="button"
            className="truncate flex-1 text-left bg-transparent border-none p-0 cursor-pointer"
            onClick={() => selectNode(node.id)}
            onDoubleClick={() => handleEditNode(node.id)}
          >
            {node.label}
          </button>

          {/* Descendant count */}
          {descendantCount > 0 && (
            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
              {descendantCount}
            </span>
          )}

          {/* Validation score */}
          {node.validationScore != null && node.validationScore > 0 && (
            <span
              className={cn(
                "text-xs font-mono flex-shrink-0 px-1 rounded",
                node.validationScore >= 70
                  ? "text-green-600 bg-green-50 dark:bg-green-900/30"
                  : node.validationScore >= 40
                    ? "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30"
                    : "text-red-600 bg-red-50 dark:bg-red-900/30",
              )}
            >
              {Math.round(node.validationScore)}
            </span>
          )}

          {/* Actions */}
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEditNode(node.id)}>Edit</DropdownMenuItem>
                <DropdownMenuItem>Add Child</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 dark:text-red-400"
                  onClick={() => handleDelete(node.id, node.label)}
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Children */}
        {isExpanded && visibleChildren.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="w-64 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">Market Tree</h2>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={expandAll}
              title="Expand all"
            >
              +
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
              onClick={collapseAll}
              title="Collapse all"
            >
              −
            </Button>
          </div>
        </div>

        {/* Filter */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter..."
            className="h-7 text-xs pl-7"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{totalNodes} nodes</span>
          <span>
            {completedNodes}/{totalNodes} researched
          </span>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-1">{rootNodes.map((node) => renderNode(node))}</div>
    </div>
  );
}
