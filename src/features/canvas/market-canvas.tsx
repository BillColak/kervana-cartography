import {
  Background,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  ReactFlow,
  type ReactFlowInstance,
  addEdge,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useCallback, useEffect, useRef } from "react";
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
      data: node,
    }));
    setNodesState(flowNodes);
  }, [storeNodes, setNodesState]);

  // Convert store edges to ReactFlow edges
  useEffect(() => {
    const flowEdges: Edge[] = storeEdges.map((edge) => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      style: { stroke: edge.color },
    }));
    setEdgesState(flowEdges);
  }, [storeEdges, setEdgesState]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdgesState((eds) => addEdge(connection, eds));
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
    <div className="w-full h-full bg-gray-50 dark:bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      <AddNodeDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        parentId={selectedNodeId}
      />
    </div>
  );
}
