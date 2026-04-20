import { useCallback, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useTreeData } from "../../providers/TreeDataProvider";
import { useTreeLayout } from "./useTreeLayout";
import { PersonNode } from "./PersonNode";
import { MarriageEdge, ParentChildEdge } from "./CustomEdges";
import { useTranslation } from "../../hooks/useTranslation";
import { useIsMobile } from "../../hooks/useIsMobile";

const nodeTypes = { person: PersonNode };
const edgeTypes = { marriage: MarriageEdge, parentChild: ParentChildEdge };

interface TreeViewInnerProps {
  selectedPersonId: string | null;
  onSelectPerson: (id: string) => void;
}

function TreeViewInner({
  selectedPersonId,
  onSelectPerson,
}: TreeViewInnerProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { people, marriages, parentChild, loading } = useTreeData();
  const { nodes, edges } = useTreeLayout(
    people,
    marriages,
    parentChild,
    selectedPersonId,
  );
  const { fitView } = useReactFlow();
  const initialFitDone = useRef(false);

  // Fit view once after initial layout
  const onNodesChange = useCallback(() => {
    if (!initialFitDone.current && nodes.length > 0) {
      initialFitDone.current = true;
      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
    }
  }, [nodes.length, fitView]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      onSelectPerson(node.id);
    },
    [onSelectPerson],
  );

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
      onNodesChange={onNodesChange}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.2}
      maxZoom={2}
      attributionPosition="bottom-left"
      proOptions={{ hideAttribution: true }}
      style={{ background: "#f8f9fa" }}
    >
      <Background color="#e0e0e0" gap={20} />
      <Controls
        showInteractive={false}
        position={isMobile ? "top-right" : "bottom-left"}
        style={{
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        }}
      />
      {!isMobile && (
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as { isSelected?: boolean };
            return data?.isSelected ? "#e8915c" : "#c8d6e5";
          }}
          maskColor="rgba(248, 249, 250, 0.7)"
          style={{
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          }}
        />
      )}
    </ReactFlow>
  );
}

// Wrap with ReactFlowProvider
interface TreeViewProps {
  selectedPersonId: string | null;
  onSelectPerson: (id: string) => void;
}

export function TreeView({ selectedPersonId, onSelectPerson }: TreeViewProps) {
  return (
    <ReactFlowProvider>
      <TreeViewInner
        selectedPersonId={selectedPersonId}
        onSelectPerson={onSelectPerson}
      />
    </ReactFlowProvider>
  );
}
