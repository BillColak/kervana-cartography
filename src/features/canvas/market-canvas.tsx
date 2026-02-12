import { useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useStore } from "@/lib/store";
import { nodeTypes } from "./nodes";
import type { MarketNodeData } from "@/types/market";
import { getAllNodes, updateNode } from "@/actions/nodes";
import { getEdges } from "@/actions/edges";

export function MarketCanvas() {
  const { nodes: storeNodes, edges: storeEdges, setNodes, setEdges, selectNode } = useStore();

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
    [setEdgesState]
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<MarketNodeData>) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node<MarketNodeData>) => {
      updateNode(node.id, {
        x: node.position.x,
        y: node.position.y,
      }).catch(console.error);
    },
    []
  );

  return (
    <div className="w-full h-full bg-gray-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
