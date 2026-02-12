import { createEdge } from "@/actions/edges";
import { createNode } from "@/actions/nodes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import type { NodeLevel } from "@/types/market";
import { useState } from "react";

interface AddNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string | null;
}

const levelOrder: NodeLevel[] = ["root", "core-market", "submarket", "niche", "sub-niche"];

const defaultColors: Record<NodeLevel, string> = {
  root: "#6b7280",
  "core-market": "#3b82f6",
  submarket: "#10b981",
  niche: "#eab308",
  "sub-niche": "#a855f7",
};

export function AddNodeDialog({ open, onOpenChange, parentId }: AddNodeDialogProps) {
  const { nodes, addNode, addEdge } = useStore();
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#3b82f6");

  const parentNode = parentId ? nodes.find((n) => n.id === parentId) : null;

  // Auto-determine child level based on parent
  const getChildLevel = (parentLevel: NodeLevel): NodeLevel => {
    const currentIndex = levelOrder.indexOf(parentLevel);
    return currentIndex < levelOrder.length - 1 ? levelOrder[currentIndex + 1] : parentLevel;
  };

  const childLevel = parentNode ? getChildLevel(parentNode.level) : "root";

  const handleCreate = async () => {
    if (!label.trim()) return;

    try {
      // Calculate position (below parent or center)
      const x = parentNode ? parentNode.x : 400;
      const y = parentNode ? parentNode.y + 150 : 100;

      // Create the node
      const newNode = await createNode({
        label: label.trim(),
        level: childLevel,
        color: color || defaultColors[childLevel],
        parentId: parentId || null,
        x,
        y,
      });

      addNode(newNode);

      // Create edge from parent to child
      if (parentId) {
        const edge = await createEdge(parentId, newNode.id, newNode.color);
        addEdge(edge);
      }

      // Reset and close
      setLabel("");
      setColor(defaultColors[childLevel]);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create node:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {parentNode ? `Add Child to ${parentNode.label}` : "Add New Node"}
          </DialogTitle>
          <DialogDescription>
            {parentNode
              ? `Create a new ${childLevel} node under ${parentNode.label}`
              : "Create a new root node"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter node label"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreate();
                }
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="level">Level</Label>
            <Input id="level" value={childLevel} disabled className="capitalize" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10"
              />
              <Select value={color} onValueChange={setColor}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="#3b82f6">Blue</SelectItem>
                  <SelectItem value="#10b981">Green</SelectItem>
                  <SelectItem value="#eab308">Yellow</SelectItem>
                  <SelectItem value="#a855f7">Purple</SelectItem>
                  <SelectItem value="#ef4444">Red</SelectItem>
                  <SelectItem value="#6b7280">Gray</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!label.trim()}>
            Create Node
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
