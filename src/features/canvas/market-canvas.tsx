import {
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  type Node,
  Panel,
  ReactFlow,
  type ReactFlowInstance,
  type SelectionMode,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useCallback, useEffect, useRef, useState } from "react";
import "@xyflow/react/dist/style.css";

import { getEdges } from "@/actions/edges";
import { getAllNodes, updateNode } from "@/actions/nodes";
import { useStore } from "@/lib/store";
import type { MarketNodeData } from "@/types/market";
import { AddNodeDialog } from "./add-node-dialog";
import { getLayoutedElements } from "./auto-layout";
import { nodeTypes } from "./nodes";

interface MarketCanvasProps {
  addDialogOpen: boolean;
  setAddDialogOpen: (open: boolean) => void;
  fitViewTrigger: number;
  autoLayoutTrigger?: number;
}

export function MarketCanvas({
  addDialogOpen,
  setAddDialogOpen,
  fitViewTrigger,
  autoLayoutTrigger = 0,
}: MarketCanvasProps) {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    setNodes,
    setEdges,
    selectNode,
    selectedNodeId,
  } = useStore();
  const reactFlowInstance = useRef<ReactFlowInstance<Node<MarketNodeData>, Edge> | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);

  const [nodes, setNodesState, onNodesChange] = useNodesState<Node<MarketNodeData>>([]);
  const [edges, setEdgesState, onEdgesChange] = useEdgesState<Edge>([]);

  // Load data from backend
  useEffect(() => {
    Promise.all([getAllNodes(), getEdges()])
      .then(([nodesData, edgesData]) => {
        setNodes(nodesData);
        setEdges(edgesData);
      })
      .catch(console.error);
  }, [setNodes, setEdges]);

  // Convert store nodes to ReactFlow nodes
  useEffect(() => {
    const flowNodes: Node<MarketNodeData>[] = storeNodes.map((node) => ({
      id: node.id,
      type: "market",
      position: { x: node.x, y: node.y },
      selected: node.id === selectedNodeId,
      data: node,
    }));
    setNodesState(flowNodes);
  }, [storeNodes, setNodesState, selectedNodeId]);

  // Convert store edges to ReactFlow edges
  useEffect(() => {
    const flowEdges: Edge[] = storeEdges.map((edge) => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      type: "smoothstep",
      animated: false,
      style: { stroke: edge.color, strokeWidth: 2 },
      label: "",
    }));
    setEdgesState(flowEdges);
  }, [storeEdges, setEdgesState]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdgesState((eds) => addEdge({ ...connection, type: "smoothstep", style: { strokeWidth: 2 } }, eds));
    },
    [setEdgesState],
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<MarketNodeData>) => {
      selectNode(node.id);
    },
    [selectNode],
  );

  const onNodeDragStop = useCallback((_event: React.MouseEvent, node: Node<MarketNodeData>) => {
    updateNode(node.id, {
      x: node.position.x,
      y: node.position.y,
    }).catch(console.error);
  }, []);

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // Delete selected nodes on Delete/Backspace
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Delete" || event.key === "Backspace") {
        const selected = nodes.filter((n) => n.selected);
        if (selected.length > 0) {
          // Only handle if not editing text
          const target = event.target as HTMLElement;
          if (target.closest("[contenteditable]") || target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
          // Don't delete from canvas with just keyboard for safety
        }
      }
    },
    [nodes],
  );

  // Handle fitView trigger
  useEffect(() => {
    if (fitViewTrigger > 0 && reactFlowInstance.current) {
      reactFlowInstance.current.fitView({ padding: 0.2, duration: 300 });
    }
  }, [fitViewTrigger]);

  // Handle auto-layout trigger
  // biome-ignore lint/correctness/useExhaustiveDependencies: triggered by autoLayoutTrigger only
  useEffect(() => {
    if (autoLayoutTrigger > 0 && nodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
      setNodesState(layoutedNodes);
      setEdgesState(layoutedEdges);

      // Save new positions to backend
      for (const node of layoutedNodes) {
        updateNode(node.id, { x: node.position.x, y: node.position.y }).catch(console.error);
      }

      // Fit view after layout
      setTimeout(() => {
        reactFlowInstance.current?.fitView({ padding: 0.2, duration: 300 });
      }, 50);
    }
  }, [autoLayoutTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full h-full bg-gray-50 dark:cosmic-bg" onKeyDown={onKeyDown}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { strokeWidth: 2 },
        }}
        connectionLineStyle={{ strokeWidth: 2, stroke: "#94a3b8" }}
        fitView
        snapToGrid={snapToGrid}
        snapGrid={[20, 20]}
        selectionOnDrag
        selectionMode={"partial" as SelectionMode}
        panOnScroll
        zoomOnDoubleClick={false}
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={null}
      >
        <Background
          gap={20}
          size={1}
          variant={BackgroundVariant.Dots}
          className="dark:opacity-30"
        />
        <Controls
          showInteractive={false}
          className="!bg-white dark:!bg-[hsl(232,40%,7%)] !border-gray-200 dark:!border-[rgba(139,92,246,0.15)] !shadow-md dark:!shadow-[0_0_20px_rgba(0,0,0,0.4),0_0_8px_rgba(139,92,246,0.1)] !rounded-lg overflow-hidden [&>button]:!bg-white dark:[&>button]:!bg-[hsl(232,40%,7%)] [&>button]:!border-gray-200 dark:[&>button]:!border-[rgba(139,92,246,0.1)] [&>button]:!text-gray-600 dark:[&>button]:!text-[hsl(226,20%,55%)] [&>button:hover]:!bg-gray-100 dark:[&>button:hover]:!bg-[rgba(139,92,246,0.1)]"
        />

        {/* Canvas info panel */}
        <Panel position="bottom-right" className="!m-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-muted-foreground bg-white/80 dark:bg-card/80 backdrop-blur rounded-lg px-3 py-1.5 border border-gray-200/50 dark:border-[rgba(139,92,246,0.15)]">
            <span>{nodes.length} nodes</span>
            <span>·</span>
            <span>{edges.length} edges</span>
            <span>·</span>
            <button
              type="button"
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`transition-colors ${snapToGrid ? "text-blue-500" : "text-gray-400"}`}
              title={snapToGrid ? "Snap to grid ON" : "Snap to grid OFF"}
            >
              Grid {snapToGrid ? "ON" : "OFF"}
            </button>
          </div>
        </Panel>
      </ReactFlow>

      <AddNodeDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        parentId={selectedNodeId}
      />
    </div>
  );
}
