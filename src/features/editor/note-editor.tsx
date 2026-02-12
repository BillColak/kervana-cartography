import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { updateNode } from "@/actions/nodes";
import { Button } from "@/components/ui/button";

export function NoteEditor() {
  const { nodes, selectedNodeId, selectNode } = useStore();
  const [markdown, setMarkdown] = useState("");

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  useEffect(() => {
    if (selectedNode) {
      setMarkdown(selectedNode.markdown);
    }
  }, [selectedNode]);

  const handleSave = async () => {
    if (selectedNode) {
      await updateNode(selectedNode.id, { markdown });
    }
  };

  if (!selectedNode) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a node to edit
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{selectedNode.label}</h3>
          <p className="text-sm text-gray-500 capitalize">{selectedNode.level}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} size="sm">
            Save
          </Button>
          <Button onClick={() => selectNode(null)} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </div>
      <div className="flex-1 p-4">
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          className="w-full h-full p-4 border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter markdown notes..."
        />
      </div>
    </div>
  );
}
