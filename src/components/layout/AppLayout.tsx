import { useState, useCallback } from "react";
import { useTreeData } from "../../providers/TreeDataProvider";
import { Header } from "./Header";
import { TreeView } from "../tree/TreeView";
import { PersonPanel } from "../person/PersonPanel";
import { AddPersonModal } from "../common/AddPersonModal";
import { useTranslation } from "../../hooks/useTranslation";

export function AppLayout() {
  const { t } = useTranslation();
  const { loading, error, getPerson } = useTreeData();
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const selectedPerson = selectedPersonId
    ? getPerson(selectedPersonId)
    : undefined;

  const handleSelectPerson = useCallback((id: string) => {
    setSelectedPersonId(id);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedPersonId(null);
  }, []);

  const handlePersonAdded = useCallback((id: string) => {
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
        onSelectPerson={handleSelectPerson}
      />

      {/* Main area: Tree + optional panel */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <TreeView
          selectedPersonId={selectedPersonId}
          onSelectPerson={handleSelectPerson}
        />

        {/* Detail panel slides over the tree */}
        {selectedPerson && (
          <PersonPanel
            person={selectedPerson}
            onClose={handleClosePanel}
            onSelectPerson={handleSelectPerson}
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
