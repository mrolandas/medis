import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useReactFlow,
  ReactFlowProvider,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useTreeData } from "../../providers/TreeDataProvider";
import { useTreeLayout } from "./useTreeLayout";
import { PersonNode } from "./PersonNode";
import { MarriageEdge, ParentChildEdge, FamilyForkEdge } from "./CustomEdges";
import { useTranslation } from "../../hooks/useTranslation";

const nodeTypes = { person: PersonNode };
const edgeTypes = {
  marriage: MarriageEdge,
  parentChild: ParentChildEdge,
  familyFork: FamilyForkEdge,
};

interface TreeViewInnerProps {
  selectedPersonId: string | null;
  highlightedPersonId: string | null;
  focusedPersonId: string | null;
  activeHighlightIds: string[];
  dimNonHighlighted: boolean;
  onPersonClick: (id: string) => void;
  onBackgroundClick: () => void;
}

function TreeViewInner({
  selectedPersonId,
  highlightedPersonId,
  focusedPersonId,
  activeHighlightIds,
  dimNonHighlighted,
  onPersonClick,
  onBackgroundClick,
}: TreeViewInnerProps) {
  const { t } = useTranslation();
  const { people, marriages, parentChild, loading } = useTreeData();
  const { nodes, edges } = useTreeLayout(
    people,
    marriages,
    parentChild,
    selectedPersonId,
    focusedPersonId,
    activeHighlightIds,
    dimNonHighlighted,
  );
  const { fitView, setCenter } = useReactFlow();
  const initialFitDone = useRef(false);

  // Fit view once after initial layout
  const onNodesChange = useCallback(() => {
    if (!initialFitDone.current && nodes.length > 0) {
      initialFitDone.current = true;
      setTimeout(() => fitView({ padding: 0.08, duration: 300 }), 50);
    }
  }, [nodes.length, fitView]);

  // Zoom to highlighted (searched) person
  useEffect(() => {
    if (!highlightedPersonId) return;
    const node = nodes.find((n) => n.id === highlightedPersonId);
    if (!node) return;
    const x = node.position.x + (node.width ?? 260) / 2;
    const y = node.position.y + (node.height ?? 80) / 2;
    setTimeout(() => setCenter(x, y, { zoom: 1, duration: 500 }), 100);
  }, [highlightedPersonId, nodes, setCenter]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      onPersonClick(node.id);
    },
    [onPersonClick],
  );

  const onPaneClick = useCallback(() => {
    onBackgroundClick();
  }, [onBackgroundClick]);

  const defaultEdgeOptions = useMemo(
    () => ({
      animated: false,
    }),
    [],
  );

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          fontSize: 20,
          color: "#7f8c8d",
        }}
      >
        {t("app.loading")}
      </div>
    );
  }

  if (people.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          fontSize: 20,
          color: "#7f8c8d",
          padding: 40,
          textAlign: "center",
        }}
      >
        {t("empty.noPeople")}
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      onNodeClick={onNodeClick}
      onPaneClick={onPaneClick}
      onNodesChange={onNodesChange}
      fitView
      fitViewOptions={{ padding: 0.08 }}
      minZoom={0.12}
      maxZoom={2}
      attributionPosition="bottom-left"
      proOptions={{ hideAttribution: true }}
      style={{ background: "#f8f9fa" }}
    >
      <Background color="#e0e0e0" gap={20} />
      <Controls
        position="top-left"
        showInteractive={false}
        style={{
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        }}
      />
    </ReactFlow>
  );
}

// Wrap with ReactFlowProvider
interface TreeViewProps {
  selectedPersonId: string | null;
  highlightedPersonId: string | null;
  focusedPersonId: string | null;
  activeHighlightIds: string[];
  dimNonHighlighted: boolean;
  onPersonClick: (id: string) => void;
  onBackgroundClick: () => void;
}

export function TreeView({
  selectedPersonId,
  highlightedPersonId,
  focusedPersonId,
  activeHighlightIds,
  dimNonHighlighted,
  onPersonClick,
  onBackgroundClick,
}: TreeViewProps) {
  return (
    <ReactFlowProvider>
      <TreeViewInner
        selectedPersonId={selectedPersonId}
        highlightedPersonId={highlightedPersonId}
        focusedPersonId={focusedPersonId}
        activeHighlightIds={activeHighlightIds}
        dimNonHighlighted={dimNonHighlighted}
        onPersonClick={onPersonClick}
        onBackgroundClick={onBackgroundClick}
      />
    </ReactFlowProvider>
  );
}
