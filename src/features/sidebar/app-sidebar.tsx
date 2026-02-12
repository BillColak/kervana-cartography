import { useStore } from "@/lib/store";

export function AppSidebar() {
  const { nodes, selectedNodeId, selectNode } = useStore();

  // Build tree structure
  const rootNodes = nodes.filter((n) => n.level === "root");

  const getChildren = (parentId: string) => {
    return nodes.filter((n) => n.parentId === parentId);
  };

  const renderNode = (node: typeof nodes[0], depth = 0) => {
    const children = getChildren(node.id);
    const isSelected = node.id === selectedNodeId;

    return (
      <div key={node.id}>
        <button
          type="button"
          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded ${
            isSelected ? "bg-blue-50 text-blue-700 font-medium" : ""
          }`}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          onClick={() => selectNode(node.id)}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: node.color }}
            />
            <span>{node.label}</span>
          </div>
        </button>
        {children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Market Tree</h2>
      </div>
      <div className="p-2">
        {rootNodes.map((node) => renderNode(node))}
      </div>
    </div>
  );
}
