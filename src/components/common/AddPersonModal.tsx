import { useState, useCallback } from "react";
import { useTreeData } from "../../providers/TreeDataProvider";
import { useTranslation } from "../../hooks/useTranslation";
import { useIsMobile } from "../../hooks/useIsMobile";
import type { PersonInput, Confidence } from "../../types";

interface AddPersonModalProps {
  onClose: () => void;
  onPersonAdded: (id: string) => void;
}

const defaultPerson: PersonInput = {
  first_name: "",
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
  const { addPerson } = useTreeData();
  const isMobile = useIsMobile();
  const [form, setForm] = useState<PersonInput>({ ...defaultPerson });
  const [saving, setSaving] = useState(false);

  const handleChange = useCallback(
    (key: keyof PersonInput, value: string | boolean | null) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.first_name.trim()) return;
      setSaving(true);
      const person = await addPerson(form);
      setSaving(false);
      if (person) {
        onPersonAdded(person.id);
        onClose();
      }
    },
    [form, addPerson, onPersonAdded, onClose],
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
