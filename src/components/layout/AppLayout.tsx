import { useState, useCallback, useEffect, useMemo } from "react";
import { useTreeData } from "../../providers/TreeDataProvider";
import { Header } from "./Header";
import { TreeView } from "../tree/TreeView";
import { PersonPanel } from "../person/PersonPanel";
import { AddPersonModal } from "../common/AddPersonModal";
import { useTranslation } from "../../hooks/useTranslation";

export function AppLayout() {
  const { t } = useTranslation();
  const { loading, error, getPerson, parentChild } = useTreeData();
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [focusedPersonId, setFocusedPersonId] = useState<string | null>(null);
  const [highlightedPersonId, setHighlightedPersonId] = useState<string | null>(
    null,
  );
  const [showAddModal, setShowAddModal] = useState(false);

  const selectedPerson = selectedPersonId
    ? getPerson(selectedPersonId)
    : undefined;

  const focusHighlightIds = useMemo(() => {
    if (!focusedPersonId) return [] as string[];

    const parentsByChild = new Map<string, Set<string>>();
    const childrenByParent = new Map<string, Set<string>>();

    for (const pc of parentChild) {
      if (!parentsByChild.has(pc.child_id)) {
        parentsByChild.set(pc.child_id, new Set());
      }
      if (!childrenByParent.has(pc.parent_id)) {
        childrenByParent.set(pc.parent_id, new Set());
      }
      parentsByChild.get(pc.child_id)!.add(pc.parent_id);
      childrenByParent.get(pc.parent_id)!.add(pc.child_id);
    }

    const collectLine = (startId: string, next: Map<string, Set<string>>) => {
      const visited = new Set<string>();
      const queue = [startId];

      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);
        for (const relativeId of next.get(currentId) ?? []) {
          if (!visited.has(relativeId)) queue.push(relativeId);
        }
      }

      return visited;
    };

    const result = new Set<string>([
      ...collectLine(focusedPersonId, parentsByChild),
      ...collectLine(focusedPersonId, childrenByParent),
    ]);

    return [...result];
  }, [focusedPersonId, parentChild]);

  const activeHighlightIds = useMemo(() => {
    const ids = new Set<string>(focusHighlightIds);
    if (highlightedPersonId) ids.add(highlightedPersonId);
    if (selectedPersonId) ids.add(selectedPersonId);
    return [...ids];
  }, [focusHighlightIds, highlightedPersonId, selectedPersonId]);

  const handleTreePersonClick = useCallback(
    (id: string) => {
      setHighlightedPersonId(null);
      if (selectedPersonId === id) return;
      if (focusedPersonId === id) {
        setSelectedPersonId(id);
        return;
      }
      setFocusedPersonId(id);
      setSelectedPersonId(null);
    },
    [focusedPersonId, selectedPersonId],
  );

  const handlePanelSelectPerson = useCallback((id: string) => {
    setHighlightedPersonId(null);
    setFocusedPersonId(id);
    setSelectedPersonId(id);
  }, []);

  const handleSearchPerson = useCallback((id: string) => {
    setFocusedPersonId(null);
    setSelectedPersonId(null);
    setHighlightedPersonId(id);
  }, []);

  const handleTreeBackgroundClick = useCallback(() => {
    setFocusedPersonId(null);
    setSelectedPersonId(null);
    setHighlightedPersonId(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (showAddModal) return;
      handleTreeBackgroundClick();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTreeBackgroundClick, showAddModal]);

  const handleClosePanel = useCallback(() => {
    setSelectedPersonId(null);
  }, []);

  const handlePersonAdded = useCallback((id: string) => {
    setFocusedPersonId(id);
    setSelectedPersonId(id);
  }, []);

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontSize: 20,
          color: "#e74c3c",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          padding: 40,
          textAlign: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <div>{t("app.error")}</div>
          <div style={{ fontSize: 14, color: "#7f8c8d", marginTop: 8 }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontSize: 22,
          color: "#7f8c8d",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        {t("app.loading")}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <Header
        onAddPerson={() => setShowAddModal(true)}
        onSelectPerson={handleSearchPerson}
      />

      {/* Main area: Tree + optional panel */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <TreeView
          selectedPersonId={selectedPersonId}
          highlightedPersonId={highlightedPersonId}
          focusedPersonId={focusedPersonId}
          activeHighlightIds={activeHighlightIds}
          dimNonHighlighted={focusedPersonId !== null}
          onPersonClick={handleTreePersonClick}
          onBackgroundClick={handleTreeBackgroundClick}
        />

        {/* Detail panel slides over the tree */}
        {selectedPerson && (
          <PersonPanel
            person={selectedPerson}
            onClose={handleClosePanel}
            onSelectPerson={handlePanelSelectPerson}
          />
        )}
      </div>

      {/* Add person modal */}
      {showAddModal && (
        <AddPersonModal
          onClose={() => setShowAddModal(false)}
          onPersonAdded={handlePersonAdded}
        />
      )}
    </div>
  );
}
