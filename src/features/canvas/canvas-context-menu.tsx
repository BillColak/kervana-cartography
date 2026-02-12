import { updateNode } from "@/actions/nodes";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useStore } from "@/lib/store";
import type { MarketNodeData, ResearchStatus } from "@/types/market";

interface CanvasContextMenuProps {
  children: React.ReactNode;
  onAddRootNode: () => void;
  onAddChildNode: (parentId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onFitView: () => void;
  selectedNode: MarketNodeData | null;
}

export function CanvasContextMenu({
  children,
  onAddRootNode,
  onAddChildNode,
  onDeleteNode,
  onFitView,
  selectedNode,
}: CanvasContextMenuProps) {
  const { setView, selectNode, updateNode: updateStoreNode } = useStore();

  const handleEdit = () => {
    if (selectedNode) {
      selectNode(selectedNode.id);
      setView("split");
    }
  };

  const handleAddChild = () => {
    if (selectedNode) {
      onAddChildNode(selectedNode.id);
    }
  };

  const handleChangeColor = (color: string) => {
    if (selectedNode) {
      updateNode(selectedNode.id, { color })
        .then((updatedNode) => {
          updateStoreNode(selectedNode.id, updatedNode);
        })
        .catch(console.error);
    }
  };

  const handleSetResearchStatus = (status: ResearchStatus) => {
    if (selectedNode) {
      updateNode(selectedNode.id, { researchStatus: status })
        .then((updatedNode) => {
          updateStoreNode(selectedNode.id, updatedNode);
        })
        .catch(console.error);
    }
  };

  const handleDelete = () => {
    if (selectedNode) {
      onDeleteNode(selectedNode.id);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {selectedNode ? (
          // Node context menu
          <>
            <ContextMenuItem onClick={handleEdit}>Edit</ContextMenuItem>
            <ContextMenuItem onClick={handleAddChild}>Add Child</ContextMenuItem>

            <ContextMenuSeparator />

            <ContextMenuSub>
              <ContextMenuSubTrigger>Change Color</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem onClick={() => handleChangeColor("#3b82f6")}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500" />
                    <span>Blue</span>
                  </div>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleChangeColor("#10b981")}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500" />
                    <span>Green</span>
                  </div>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleChangeColor("#eab308")}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-500" />
                    <span>Yellow</span>
                  </div>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleChangeColor("#a855f7")}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-purple-500" />
                    <span>Purple</span>
                  </div>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleChangeColor("#ef4444")}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-500" />
                    <span>Red</span>
                  </div>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleChangeColor("#6b7280")}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-gray-500" />
                    <span>Gray</span>
                  </div>
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSub>
              <ContextMenuSubTrigger>Set Research Status</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuItem onClick={() => handleSetResearchStatus("not-started")}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <span>Not Started</span>
                  </div>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleSetResearchStatus("in-progress")}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span>In Progress</span>
                  </div>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => handleSetResearchStatus("complete")}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <span>Complete</span>
                  </div>
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>

            <ContextMenuSeparator />

            <ContextMenuItem onClick={handleDelete} className="text-red-600">
              Delete
            </ContextMenuItem>
          </>
        ) : (
          // Canvas context menu
          <>
            <ContextMenuItem onClick={onAddRootNode}>Add Root Node</ContextMenuItem>
            <ContextMenuItem onClick={onFitView}>Fit View</ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
