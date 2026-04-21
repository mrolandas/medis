import { useState, useCallback, useMemo } from "react";
import { useTreeData } from "../../providers/TreeDataProvider";
import { useTranslation } from "../../hooks/useTranslation";
import { useIsMobile } from "../../hooks/useIsMobile";
import type { PersonInput, Confidence } from "../../types";
import {
  isValidPartialDateInput,
  sanitizePersonInput,
} from "../../lib/inputValidation";

interface AddPersonModalProps {
  onClose: () => void;
  onPersonAdded: (id: string) => void;
}

const defaultPerson: PersonInput = {
  first_name: "",
  middle_name: null,
  last_name: null,
  maiden_name: null,
  gender: null,
  birth_date: null,
  birth_place: null,
  death_date: null,
  death_place: null,
  burial_place: null,
  cause_of_death: null,
  occupation: null,
  notes: null,
  confidence: "confirmed",
  is_deceased: false,
  photo_url: null,
};

export function AddPersonModal({
  onClose,
  onPersonAdded,
}: AddPersonModalProps) {
  const { t } = useTranslation();
  const { people, addPerson, addParentChild, addMarriage } = useTreeData();
  const isMobile = useIsMobile();
  const [form, setForm] = useState<PersonInput>({ ...defaultPerson });
  const [selectedSpouseIds, setSelectedSpouseIds] = useState<string[]>([]);
  const [selectedParentIds, setSelectedParentIds] = useState<string[]>([]);
  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);

  const selectablePeople = useMemo(
    () =>
      [...people].sort((a, b) => {
        const left =
          `${a.first_name} ${a.middle_name ?? ""} ${a.last_name ?? ""}`
            .trim()
            .toLocaleLowerCase("lt");
        const right =
          `${b.first_name} ${b.middle_name ?? ""} ${b.last_name ?? ""}`
            .trim()
            .toLocaleLowerCase("lt");
        if (left < right) return -1;
        if (left > right) return 1;
        return a.id.localeCompare(b.id);
      }),
    [people],
  );

  const personLabel = useCallback(
    (id: string) => {
      const person = people.find((p) => p.id === id);
      if (!person) return "?";
      return `${person.first_name} ${person.middle_name ?? ""} ${person.last_name ?? ""}`.trim();
    },
    [people],
  );

  const toggleParent = useCallback((id: string) => {
    setSelectedParentIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
    // One person cannot be both parent and child of the same new node.
    setSelectedChildIds((prev) => prev.filter((value) => value !== id));
  }, []);

  const toggleChild = useCallback((id: string) => {
    setSelectedChildIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
    setSelectedParentIds((prev) => prev.filter((value) => value !== id));
  }, []);

  const toggleSpouse = useCallback((id: string) => {
    setSelectedSpouseIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    );
  }, []);

  const handleChange = useCallback(
    (key: keyof PersonInput, value: string | boolean | null) => {
      setForm((prev) => ({ ...prev, [key]: value }));

      if (key === "first_name") {
        const ok = typeof value === "string" && value.trim().length > 0;
        setNameError(ok ? null : t("validation.requiredFirstName"));
      }

      if (key === "birth_date") {
        const date = typeof value === "string" ? value : null;
        setBirthDateError(
          isValidPartialDateInput(date)
            ? null
            : t("validation.partialDateInvalid"),
        );
      }
    },
    [t],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const normalized = sanitizePersonInput(form);
      const hasName = !!normalized.first_name;
      const birthDateOk = isValidPartialDateInput(normalized.birth_date);

      setNameError(hasName ? null : t("validation.requiredFirstName"));
      setBirthDateError(
        birthDateOk ? null : t("validation.partialDateInvalid"),
      );

      if (!hasName || !birthDateOk) return;

      setSaving(true);
      try {
        const person = await addPerson(normalized);
        if (person) {
          await Promise.all(
            selectedSpouseIds.map((spouseId, index) =>
              addMarriage({
                person1_id: person.id,
                person2_id: spouseId,
                relationship_status: "married",
                marriage_date: null,
                divorce_date: null,
                marriage_place: null,
                order_index: index,
              }),
            ),
          );

          await Promise.all([
            ...selectedParentIds.map((parentId) =>
              addParentChild(parentId, person.id),
            ),
            ...selectedChildIds.map((childId) =>
              addParentChild(person.id, childId),
            ),
          ]);

          onPersonAdded(person.id);
          onClose();
        }
      } finally {
        setSaving(false);
      }
    },
    [
      form,
      addPerson,
      addParentChild,
      addMarriage,
      selectedSpouseIds,
      selectedParentIds,
      selectedChildIds,
      onPersonAdded,
      onClose,
      t,
    ],
  );

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 16,
    border: "2px solid #dfe6e9",
    borderRadius: 8,
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    color: "#636e72",
    marginBottom: 4,
    marginTop: 14,
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 300,
        }}
      />
      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: isMobile ? 0 : "50%",
          left: isMobile ? 0 : "50%",
          transform: isMobile ? "none" : "translate(-50%, -50%)",
          background: "#fff",
          borderRadius: isMobile ? 0 : 16,
          padding: isMobile ? "20px 16px" : "28px 32px",
          width: isMobile ? "100%" : 440,
          maxWidth: isMobile ? "100%" : "90vw",
          height: isMobile ? "100%" : undefined,
          maxHeight: isMobile ? "100%" : "85vh",
          overflowY: "auto",
          zIndex: 301,
          boxShadow: isMobile ? "none" : "0 8px 30px rgba(0,0,0,0.2)",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        <h2 style={{ margin: "0 0 8px", fontSize: 24, color: "#2d3436" }}>
          {t("action.addPerson")}
        </h2>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>{t("person.firstName")} *</label>
          <input
            style={inputStyle}
            value={form.first_name}
            onChange={(e) => handleChange("first_name", e.target.value)}
            placeholder={t("person.firstName")}
            autoFocus
          />
          {nameError && (
            <div style={{ marginTop: 6, color: "#c0392b", fontSize: 13 }}>
              {nameError}
            </div>
          )}

          <label style={labelStyle}>{t("person.middleName")}</label>
          <input
            style={inputStyle}
            value={form.middle_name ?? ""}
            onChange={(e) =>
              handleChange("middle_name", e.target.value || null)
            }
            placeholder={t("person.middleName")}
          />

          <label style={labelStyle}>{t("person.lastName")}</label>
          <input
            style={inputStyle}
            value={form.last_name ?? ""}
            onChange={(e) => handleChange("last_name", e.target.value || null)}
            placeholder={t("person.lastName")}
          />

          <label style={labelStyle}>{t("person.gender")}</label>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={form.gender ?? ""}
            onChange={(e) => handleChange("gender", e.target.value || null)}
          >
            <option value="">{t("person.gender.unknown")}</option>
            <option value="M">{t("person.gender.male")}</option>
            <option value="F">{t("person.gender.female")}</option>
          </select>

          <label style={labelStyle}>{t("person.birthDate")}</label>
          <input
            style={inputStyle}
            value={form.birth_date ?? ""}
            onChange={(e) => handleChange("birth_date", e.target.value || null)}
            placeholder={t("date.hint")}
          />
          {birthDateError && (
            <div style={{ marginTop: 6, color: "#c0392b", fontSize: 13 }}>
              {birthDateError}
            </div>
          )}

          <label style={labelStyle}>{t("relation.spouses")}</label>
          <div
            style={{
              ...inputStyle,
              padding: "8px 10px",
              minHeight: 80,
              maxHeight: 140,
              overflowY: "auto",
            }}
          >
            {selectablePeople.length === 0 ? (
              <div style={{ color: "#7f8c8d", fontSize: 14 }}>
                {t("familyMembers.none")}
              </div>
            ) : (
              selectablePeople.map((person) => (
                <label
                  key={`spouse-${person.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 14,
                    color: "#2d3436",
                    padding: "4px 0",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedSpouseIds.includes(person.id)}
                    onChange={() => toggleSpouse(person.id)}
                  />
                  {personLabel(person.id)}
                </label>
              ))
            )}
          </div>

          <label style={labelStyle}>{t("relation.parents")}</label>
          <div
            style={{
              ...inputStyle,
              padding: "8px 10px",
              minHeight: 80,
              maxHeight: 140,
              overflowY: "auto",
            }}
          >
            {selectablePeople.length === 0 ? (
              <div style={{ color: "#7f8c8d", fontSize: 14 }}>
                {t("familyMembers.none")}
              </div>
            ) : (
              selectablePeople.map((person) => (
                <label
                  key={`parent-${person.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 14,
                    color: "#2d3436",
                    padding: "4px 0",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedParentIds.includes(person.id)}
                    onChange={() => toggleParent(person.id)}
                  />
                  {personLabel(person.id)}
                </label>
              ))
            )}
          </div>

          <label style={labelStyle}>{t("relation.children")}</label>
          <div
            style={{
              ...inputStyle,
              padding: "8px 10px",
              minHeight: 80,
              maxHeight: 140,
              overflowY: "auto",
            }}
          >
            {selectablePeople.length === 0 ? (
              <div style={{ color: "#7f8c8d", fontSize: 14 }}>
                {t("familyMembers.none")}
              </div>
            ) : (
              selectablePeople.map((person) => (
                <label
                  key={`child-${person.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 14,
                    color: "#2d3436",
                    padding: "4px 0",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedChildIds.includes(person.id)}
                    onChange={() => toggleChild(person.id)}
                  />
                  {personLabel(person.id)}
                </label>
              ))
            )}
          </div>

          <label style={labelStyle}>{t("confidence")}</label>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={form.confidence}
            onChange={(e) =>
              handleChange("confidence", e.target.value as Confidence)
            }
          >
            <option value="confirmed">{t("confidence.confirmed")}</option>
            <option value="probable">{t("confidence.probable")}</option>
            <option value="uncertain">{t("confidence.uncertain")}</option>
            <option value="legendary">{t("confidence.legendary")}</option>
          </select>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <button
              type="submit"
              disabled={!form.first_name.trim() || saving}
              style={{
                flex: 1,
                padding: "12px 20px",
                fontSize: 16,
                fontWeight: 600,
                background: form.first_name.trim() ? "#4a7c59" : "#b2bec3",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                cursor: form.first_name.trim() ? "pointer" : "default",
              }}
            >
              {saving ? t("save.saving") : t("action.add")}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px 20px",
                fontSize: 16,
                fontWeight: 600,
                background: "#dfe6e9",
                color: "#2d3436",
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              {t("action.cancel")}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
