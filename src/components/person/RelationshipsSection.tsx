import { useState, useCallback } from "react";
import { useTreeData } from "../../providers/TreeDataProvider";
import { useTranslation } from "../../hooks/useTranslation";
import type { Person, MarriageStatus } from "../../types";

interface RelationshipsSectionProps {
  person: Person;
  onSelectPerson: (id: string) => void;
}

export function RelationshipsSection({
  person,
  onSelectPerson,
}: RelationshipsSectionProps) {
  const { t } = useTranslation();
  const {
    people,
    marriages,
    parentChild,
    addMarriage,
    deleteMarriage,
    addParentChild,
    deleteParentChild,
  } = useTreeData();

  const [addingType, setAddingType] = useState<
    "spouse" | "parent" | "child" | null
  >(null);
  const [selectedId, setSelectedId] = useState("");
  const [relationshipStatus, setRelationshipStatus] =
    useState<MarriageStatus>("married");

  // Find relationships for this person
  const personMarriages = marriages.filter(
    (m) => m.person1_id === person.id || m.person2_id === person.id,
  );
  const personParents = parentChild.filter((pc) => pc.child_id === person.id);
  const personChildren = parentChild.filter((pc) => pc.parent_id === person.id);

  // People not already related (for add dropdown)
  const relatedIds = new Set([
    person.id,
    ...personMarriages.map((m) =>
      m.person1_id === person.id ? m.person2_id : m.person1_id,
    ),
    ...personParents.map((pc) => pc.parent_id),
    ...personChildren.map((pc) => pc.child_id),
  ]);

  const availablePeople = people.filter((p) => !relatedIds.has(p.id));

  const getPersonName = useCallback(
    (id: string) => {
      const p = people.find((x) => x.id === id);
      if (!p) return "?";
      return `${p.first_name} ${p.middle_name ?? ""} ${p.last_name ?? ""}`.trim();
    },
    [people],
  );

  const handleAdd = useCallback(async () => {
    if (!selectedId || !addingType) return;
    if (addingType === "spouse") {
      await addMarriage({
        person1_id: person.id,
        person2_id: selectedId,
        relationship_status: relationshipStatus,
        marriage_date: null,
        divorce_date: relationshipStatus === "divorced" ? "unknown" : null,
        marriage_place: null,
        order_index: personMarriages.length,
      });
    } else if (addingType === "parent") {
      await addParentChild(selectedId, person.id);
    } else if (addingType === "child") {
      await addParentChild(person.id, selectedId);
    }
    setAddingType(null);
    setSelectedId("");
    setRelationshipStatus("married");
  }, [
    addingType,
    selectedId,
    relationshipStatus,
    person.id,
    personMarriages.length,
    addMarriage,
    addParentChild,
  ]);

  const sectionStyle: React.CSSProperties = {
    marginTop: 20,
    padding: "12px 0",
    borderTop: "1px solid #ecf0f1",
  };

  const headingStyle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 700,
    color: "#2d3436",
    marginBottom: 8,
  };

  const chipStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 12px",
    background: "#f0f3f5",
    borderRadius: 20,
    fontSize: 14,
    margin: "2px 4px",
    cursor: "pointer",
  };

  const removeButtonStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    color: "#e74c3c",
    cursor: "pointer",
    fontSize: 16,
    fontWeight: "bold",
    padding: "0 2px",
    lineHeight: 1,
  };

  const addButtonStyle: React.CSSProperties = {
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 600,
    background: "#dfe6e9",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    marginRight: 6,
    marginTop: 4,
  };

  const toggleAdding = useCallback(
    (type: "spouse" | "parent" | "child") => {
      if (addingType === type) {
        setAddingType(null);
        setSelectedId("");
      } else {
        setAddingType(type);
        setSelectedId("");
      }
    },
    [addingType],
  );

  const renderDropdown = () => (
    <div
      style={{
        marginTop: 8,
        padding: 12,
        background: "#fafafa",
        borderRadius: 10,
        border: "2px solid #dfe6e9",
      }}
    >
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          fontSize: 16,
          border: "2px solid #dfe6e9",
          borderRadius: 8,
          marginBottom: 8,
        }}
      >
        <option value="">{t("action.selectPerson")}</option>
        {availablePeople.map((p) => (
          <option key={p.id} value={p.id}>
            {p.first_name} {p.middle_name ?? ""} {p.last_name ?? ""}
          </option>
        ))}
      </select>
      {addingType === "spouse" && (
        <>
          <label
            style={{
              display: "block",
              fontSize: 13,
              color: "#636e72",
              marginBottom: 4,
            }}
          >
            {t("relation.status")}
          </label>
          <select
            value={relationshipStatus}
            onChange={(e) =>
              setRelationshipStatus(e.target.value as MarriageStatus)
            }
            style={{
              width: "100%",
              padding: "10px 12px",
              fontSize: 16,
              border: "2px solid #dfe6e9",
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <option value="married">{t("relation.status.married")}</option>
            <option value="divorced">{t("relation.status.divorced")}</option>
            <option value="widowed">{t("relation.status.widowed")}</option>
          </select>
        </>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={handleAdd}
          disabled={!selectedId}
          style={{
            ...addButtonStyle,
            background: selectedId ? "#4a7c59" : "#b2bec3",
            color: "#fff",
          }}
        >
          {t("action.confirm")}
        </button>
        <button
          onClick={() => {
            setAddingType(null);
            setSelectedId("");
            setRelationshipStatus("married");
          }}
          style={addButtonStyle}
        >
          {t("action.cancel")}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "0 4px" }}>
      {/* Spouses */}
      <div style={sectionStyle}>
        <div style={headingStyle}>{t("relation.spouses")}</div>
        {personMarriages.length === 0 && (
          <div style={{ fontSize: 14, color: "#b2bec3" }}>
            {t("empty.noSpouses")}
          </div>
        )}
        {personMarriages.map((m) => {
          const spouseId =
            m.person1_id === person.id ? m.person2_id : m.person1_id;
          return (
            <span key={m.id} style={chipStyle}>
              <span
                onClick={() => onSelectPerson(spouseId)}
                style={{ cursor: "pointer", textDecoration: "underline" }}
              >
                {getPersonName(spouseId)}
              </span>
              <span style={{ fontSize: 12, color: "#7f8c8d" }}>
                {m.relationship_status === "divorced"
                  ? t("relation.status.divorced")
                  : m.relationship_status === "widowed"
                    ? t("relation.status.widowed")
                    : t("relation.status.married")}
              </span>
              {m.marriage_date && (
                <span style={{ fontSize: 12, color: "#7f8c8d" }}>
                  ({m.marriage_date})
                </span>
              )}
              <button
                style={removeButtonStyle}
                onClick={() => deleteMarriage(m.id)}
                title={t("action.delete")}
              >
                ×
              </button>
            </span>
          );
        })}
        <br />
        <button style={addButtonStyle} onClick={() => toggleAdding("spouse")}>
          + {t("action.addSpouse")}
        </button>
        {addingType === "spouse" && renderDropdown()}
      </div>

      {/* Parents */}
      <div style={sectionStyle}>
        <div style={headingStyle}>{t("relation.parents")}</div>
        {personParents.length === 0 && (
          <div style={{ fontSize: 14, color: "#b2bec3" }}>
            {t("empty.noParents")}
          </div>
        )}
        {personParents.map((pc) => (
          <span key={pc.id} style={chipStyle}>
            <span
              onClick={() => onSelectPerson(pc.parent_id)}
              style={{ cursor: "pointer", textDecoration: "underline" }}
            >
              {getPersonName(pc.parent_id)}
            </span>
            <button
              style={removeButtonStyle}
              onClick={() => deleteParentChild(pc.id)}
              title={t("action.delete")}
            >
              ×
            </button>
          </span>
        ))}
        <br />
        {personParents.length < 2 && (
          <>
            <button
              style={addButtonStyle}
              onClick={() => toggleAdding("parent")}
            >
              + {t("action.addParent")}
            </button>
            {addingType === "parent" && renderDropdown()}
          </>
        )}
      </div>

      {/* Children */}
      <div style={sectionStyle}>
        <div style={headingStyle}>{t("relation.children")}</div>
        {personChildren.length === 0 && (
          <div style={{ fontSize: 14, color: "#b2bec3" }}>
            {t("empty.noChildren")}
          </div>
        )}
        {personChildren.map((pc) => (
          <span key={pc.id} style={chipStyle}>
            <span
              onClick={() => onSelectPerson(pc.child_id)}
              style={{ cursor: "pointer", textDecoration: "underline" }}
            >
              {getPersonName(pc.child_id)}
            </span>
            <button
              style={removeButtonStyle}
              onClick={() => deleteParentChild(pc.id)}
              title={t("action.delete")}
            >
              ×
            </button>
          </span>
        ))}
        <br />
        <button style={addButtonStyle} onClick={() => toggleAdding("child")}>
          + {t("action.addChild")}
        </button>
        {addingType === "child" && renderDropdown()}
      </div>
    </div>
  );
}
