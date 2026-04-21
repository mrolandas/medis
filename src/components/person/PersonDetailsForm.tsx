import { useState, useCallback, useRef, useEffect } from "react";
import { useTreeData } from "../../providers/TreeDataProvider";
import { useTranslation } from "../../hooks/useTranslation";
import type { Person, Confidence, PersonInput } from "../../types";
import {
  isValidPartialDateInput,
  normalizePartialDateInput,
  normalizeTextInput,
} from "../../lib/inputValidation";

interface PersonDetailsFormProps {
  person: Person;
}

/** Debounced auto-save form for all person fields */
export function PersonDetailsForm({ person }: PersonDetailsFormProps) {
  const { t } = useTranslation();
  const { updatePerson } = useTreeData();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Local form state
  const [form, setForm] = useState<Partial<PersonInput>>({});
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<string, string>>
  >({});

  // Reset form when person changes
  useEffect(() => {
    setForm({});
    setFieldErrors({});
  }, [person.id]);

  // Merged view: local edits override DB values
  const val = useCallback(
    <K extends keyof PersonInput>(key: K): PersonInput[K] =>
      key in form
        ? (form[key] as PersonInput[K])
        : (person[key] as PersonInput[K]),
    [form, person],
  );

  const handleChange = useCallback(
    (key: keyof PersonInput, value: string | boolean | null) => {
      let nextValue: string | boolean | null = value;

      if (typeof nextValue === "string") {
        if (key === "birth_date" || key === "death_date") {
          if (!isValidPartialDateInput(nextValue)) {
            setFieldErrors((prev) => ({
              ...prev,
              [key]: t("validation.partialDateInvalid"),
            }));
            setForm((prev) => ({ ...prev, [key]: nextValue }));
            return;
          }

          nextValue = normalizePartialDateInput(nextValue);
        } else {
          nextValue = normalizeTextInput(nextValue);
        }
      }

      if (
        key === "first_name" &&
        (!nextValue || String(nextValue).trim() === "")
      ) {
        setFieldErrors((prev) => ({
          ...prev,
          first_name: t("validation.requiredFirstName"),
        }));
        setForm((prev) => ({ ...prev, first_name: String(value ?? "") }));
        return;
      }

      setFieldErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[key];
        return nextErrors;
      });

      setForm((prev) => ({ ...prev, [key]: nextValue }));
      // Debounced save
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        updatePerson(person.id, { [key]: nextValue });
      }, 600);
    },
    [person.id, updatePerson, t],
  );

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 16,
    border: "2px solid #dfe6e9",
    borderRadius: 8,
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    color: "#636e72",
    marginBottom: 4,
    marginTop: 16,
  };

  return (
    <div style={{ padding: "0 4px" }}>
      {/* First name — required */}
      <label style={labelStyle}>{t("person.firstName")} *</label>
      <input
        style={inputStyle}
        value={(val("first_name") as string) ?? ""}
        onChange={(e) => handleChange("first_name", e.target.value)}
        placeholder={t("person.firstName")}
      />
      {fieldErrors.first_name && (
        <div style={{ marginTop: 6, color: "#c0392b", fontSize: 13 }}>
          {fieldErrors.first_name}
        </div>
      )}

      {/* Last name */}
      <label style={labelStyle}>{t("person.lastName")}</label>
      <input
        style={inputStyle}
        value={(val("last_name") as string) ?? ""}
        onChange={(e) => handleChange("last_name", e.target.value || null)}
        placeholder={t("person.lastName")}
      />

      {/* Maiden name — only for females */}
      {val("gender") !== "M" && (
        <>
          <label style={labelStyle}>{t("person.maidenName")}</label>
          <input
            style={inputStyle}
            value={(val("maiden_name") as string) ?? ""}
            onChange={(e) =>
              handleChange("maiden_name", e.target.value || null)
            }
            placeholder={t("person.maidenName")}
          />
        </>
      )}

      {/* Gender */}
      <label style={labelStyle}>{t("person.gender")}</label>
      <select
        style={{ ...inputStyle, cursor: "pointer" }}
        value={(val("gender") as string) ?? ""}
        onChange={(e) => handleChange("gender", e.target.value || null)}
      >
        <option value="">{t("person.gender.unknown")}</option>
        <option value="M">{t("person.gender.male")}</option>
        <option value="F">{t("person.gender.female")}</option>
      </select>

      {/* Birth date */}
      <label style={labelStyle}>{t("person.birthDate")}</label>
      <input
        style={inputStyle}
        value={(val("birth_date") as string) ?? ""}
        onChange={(e) => handleChange("birth_date", e.target.value || null)}
        placeholder={t("date.hint")}
      />
      {fieldErrors.birth_date && (
        <div style={{ marginTop: 6, color: "#c0392b", fontSize: 13 }}>
          {fieldErrors.birth_date}
        </div>
      )}

      {/* Birth place */}
      <label style={labelStyle}>{t("person.birthPlace")}</label>
      <input
        style={inputStyle}
        value={(val("birth_place") as string) ?? ""}
        onChange={(e) => handleChange("birth_place", e.target.value || null)}
        placeholder={t("person.birthPlace")}
      />

      {/* Deceased checkbox */}
      <label
        style={{
          ...labelStyle,
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={(val("is_deceased") as boolean) ?? false}
          onChange={(e) => handleChange("is_deceased", e.target.checked)}
          style={{ width: 20, height: 20, cursor: "pointer" }}
        />
        {t("person.isDeceased")}
      </label>

      {/* Death date — only show if deceased */}
      {(val("is_deceased") || val("death_date")) && (
        <>
          <label style={labelStyle}>{t("person.deathDate")}</label>
          <input
            style={inputStyle}
            value={(val("death_date") as string) ?? ""}
            onChange={(e) => handleChange("death_date", e.target.value || null)}
            placeholder={t("date.hint")}
          />
          {fieldErrors.death_date && (
            <div style={{ marginTop: 6, color: "#c0392b", fontSize: 13 }}>
              {fieldErrors.death_date}
            </div>
          )}

          {/* Death place */}
          <label style={labelStyle}>{t("person.deathPlace")}</label>
          <input
            style={inputStyle}
            value={(val("death_place") as string) ?? ""}
            onChange={(e) =>
              handleChange("death_place", e.target.value || null)
            }
            placeholder={t("person.deathPlace")}
          />

          {/* Burial place */}
          <label style={labelStyle}>{t("person.burialPlace")}</label>
          <input
            style={inputStyle}
            value={(val("burial_place") as string) ?? ""}
            onChange={(e) =>
              handleChange("burial_place", e.target.value || null)
            }
            placeholder={t("person.burialPlace")}
          />

          {/* Cause of death */}
          <label style={labelStyle}>{t("person.causeOfDeath")}</label>
          <input
            style={inputStyle}
            value={(val("cause_of_death") as string) ?? ""}
            onChange={(e) =>
              handleChange("cause_of_death", e.target.value || null)
            }
            placeholder={t("person.causeOfDeath")}
          />
        </>
      )}

      {/* Occupation */}
      <label style={labelStyle}>{t("person.occupation")}</label>
      <input
        style={inputStyle}
        value={(val("occupation") as string) ?? ""}
        onChange={(e) => handleChange("occupation", e.target.value || null)}
        placeholder={t("person.occupation")}
      />

      {/* Confidence */}
      <label style={labelStyle}>{t("confidence")}</label>
      <select
        style={{ ...inputStyle, cursor: "pointer" }}
        value={(val("confidence") as Confidence) ?? "confirmed"}
        onChange={(e) => handleChange("confidence", e.target.value)}
      >
        <option value="confirmed">{t("confidence.confirmed")}</option>
        <option value="probable">{t("confidence.probable")}</option>
        <option value="uncertain">{t("confidence.uncertain")}</option>
        <option value="legendary">{t("confidence.legendary")}</option>
      </select>

      {/* Notes */}
      <label style={labelStyle}>{t("person.notes")}</label>
      <textarea
        style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
        value={(val("notes") as string) ?? ""}
        onChange={(e) => handleChange("notes", e.target.value || null)}
        placeholder={t("person.notes")}
      />
    </div>
  );
}
