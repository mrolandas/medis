import { useState, useCallback } from "react";
import { useTreeData } from "../../providers/TreeDataProvider";
import { useTranslation } from "../../hooks/useTranslation";
import { PersonDetailsForm } from "./PersonDetailsForm";
import { RelationshipsSection } from "./RelationshipsSection";
import type { Person } from "../../types";

interface PersonPanelProps {
  person: Person;
  onClose: () => void;
  onSelectPerson: (id: string) => void;
}

/** Slide-out detail sidebar for viewing/editing a person */
export function PersonPanel({
  person,
  onClose,
  onSelectPerson,
}: PersonPanelProps) {
  const { t } = useTranslation();
  const { deletePerson } = useTreeData();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = useCallback(async () => {
    await deletePerson(person.id);
    onClose();
  }, [deletePerson, person.id, onClose]);

  const displayName = `${person.first_name} ${person.last_name ?? ""}`.trim();

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 400,
        maxWidth: "90vw",
        height: "100%",
        background: "#ffffff",
        boxShadow: "-4px 0 20px rgba(0,0,0,0.12)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "2px solid #ecf0f1",
          flexShrink: 0,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22, color: "#2d3436" }}>
          {displayName}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: 28,
            cursor: "pointer",
            color: "#636e72",
            padding: "0 4px",
            lineHeight: 1,
          }}
          title={t("action.close")}
        >
          ×
        </button>
      </div>

      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 16px 24px",
        }}
      >
        <PersonDetailsForm person={person} />
        <RelationshipsSection person={person} onSelectPerson={onSelectPerson} />

        {/* Delete section */}
        <div
          style={{
            marginTop: 32,
            padding: "16px 0",
            borderTop: "1px solid #ecf0f1",
          }}
        >
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                padding: "10px 20px",
                fontSize: 15,
                fontWeight: 600,
                background: "#fff",
                color: "#e74c3c",
                border: "2px solid #e74c3c",
                borderRadius: 8,
                cursor: "pointer",
                width: "100%",
              }}
            >
              {t("action.delete")} {displayName}
            </button>
          ) : (
            <div
              style={{
                padding: 16,
                background: "#ffeaea",
                borderRadius: 10,
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 15, color: "#c0392b", margin: "0 0 8px" }}>
                {t("confirm.deletePerson")}
              </p>
              <p style={{ fontSize: 13, color: "#e74c3c", margin: "0 0 12px" }}>
                {t("confirm.deleteWarning")}
              </p>
              <div
                style={{ display: "flex", gap: 8, justifyContent: "center" }}
              >
                <button
                  onClick={handleDelete}
                  style={{
                    padding: "10px 24px",
                    fontSize: 15,
                    fontWeight: 600,
                    background: "#e74c3c",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  {t("action.confirm")}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{
                    padding: "10px 24px",
                    fontSize: 15,
                    fontWeight: 600,
                    background: "#dfe6e9",
                    color: "#2d3436",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  {t("action.cancel")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
