import { searchNodes } from "@/actions/nodes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { downloadFile, exportTreeAsMarkdown } from "@/features/export/export-markdown";
import { useStore } from "@/lib/store";
import {
  BarChart3,
  Brain,
  Columns,
  Download,
  FolderInput,
  LayoutGrid,
  Maximize,
  Maximize2,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Plus,
  Search,
  Sun,
} from "lucide-react";
import { useState } from "react";

interface AppToolbarProps {
  onAddNode: () => void;
  onFitView: () => void;
  onAutoLayout?: () => void;
  onToggleResearch?: () => void;
  showResearch?: boolean;
  onToggleStats?: () => void;
  showStats?: boolean;
  onImport?: () => void;
  isDark?: boolean;
  onToggleDarkMode?: () => void;
}

export function AppToolbar({
  onAddNode,
  onFitView,
  onAutoLayout,
  onToggleResearch,
  showResearch,
  onToggleStats,
  showStats,
  onImport,
  isDark,
  onToggleDarkMode,
}: AppToolbarProps) {
  const { nodes, selectedNodeId, view, setView, sidebarOpen, toggleSidebar, selectNode } =
    useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof nodes>([]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Build breadcrumb path
  const getBreadcrumb = () => {
    if (!selectedNode) return [];
    const path: typeof nodes = [];
    let current = selectedNode;

    while (current) {
      path.unshift(current);
      current = nodes.find((n) => n.id === current.parentId) as typeof current;
    }

    return path;
  };

  const breadcrumb = getBreadcrumb();

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      try {
        const results = await searchNodes(query.trim());
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchResultClick = (nodeId: string) => {
    selectNode(nodeId);
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center gap-4">
      {/* Left: Action buttons */}
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onAddNode} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Node
        </Button>

        <Button size="sm" variant="outline" onClick={onFitView} className="gap-2">
          <Maximize2 className="w-4 h-4" />
          Fit View
        </Button>

        {onAutoLayout && (
          <Button size="sm" variant="outline" onClick={onAutoLayout} className="gap-2">
            <LayoutGrid className="w-4 h-4" />
            Auto Layout
          </Button>
        )}

        <Button size="sm" variant="outline" onClick={toggleSidebar} className="gap-2">
          {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          {sidebarOpen ? "Hide" : "Show"} Sidebar
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const md = exportTreeAsMarkdown(nodes);
            downloadFile(md, "kervana-export.md", "text/markdown");
          }}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>

        {onImport && (
          <Button size="sm" variant="outline" onClick={onImport} className="gap-2">
            <FolderInput className="w-4 h-4" />
            Import
          </Button>
        )}

        {onToggleDarkMode && (
          <Button size="sm" variant="ghost" onClick={onToggleDarkMode} className="h-8 w-8 p-0">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search nodes..."
            className="pl-10"
          />
        </div>

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-64 overflow-y-auto z-50">
            {searchResults.map((node) => (
              <button
                type="button"
                key={node.id}
                onClick={() => handleSearchResultClick(node.id)}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: node.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{node.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{node.level}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: View mode & Breadcrumb */}
      <div className="flex items-center gap-4">
        {/* Research toggle */}
        {onToggleResearch && (
          <Button
            size="sm"
            variant={showResearch ? "default" : "outline"}
            onClick={onToggleResearch}
            className="gap-1 h-8"
          >
            <Brain className="w-4 h-4" />
            Research
          </Button>
        )}

        {/* Stats toggle */}
        {onToggleStats && (
          <Button
            size="sm"
            variant={showStats ? "default" : "outline"}
            onClick={onToggleStats}
            className="gap-1 h-8"
          >
            <BarChart3 className="w-4 h-4" />
            Stats
          </Button>
        )}

        {/* View mode toggle */}
        <div className="flex items-center gap-1 border border-gray-200 rounded-md p-1">
          <Button
            size="sm"
            variant={view === "canvas" ? "default" : "ghost"}
            onClick={() => setView("canvas")}
            className="gap-1 h-8"
          >
            <Maximize className="w-4 h-4" />
            Canvas
          </Button>
          <Button
            size="sm"
            variant={view === "split" ? "default" : "ghost"}
            onClick={() => setView("split")}
            className="gap-1 h-8"
          >
            <Columns className="w-4 h-4" />
            Split
          </Button>
        </div>

        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {breadcrumb.map((node, index) => (
              <div key={node.id} className="flex items-center gap-2">
                {index > 0 && <span className="text-gray-400">/</span>}
                <button
                  type="button"
                  onClick={() => selectNode(node.id)}
                  className="hover:text-blue-600 truncate max-w-[120px]"
                >
                  {node.label}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
