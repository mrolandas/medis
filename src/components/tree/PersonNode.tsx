import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { Person, Confidence } from "../../types";
import { NODE_WIDTH, NODE_HEIGHT } from "./useTreeLayout";

interface PersonNodeData {
  person: Person;
  isSelected: boolean;
  isHighlighted: boolean;
  isFocused: boolean;
  isDimmed: boolean;
  [key: string]: unknown;
}

/** Formats a partial date for display: "1850" | "1850-03" | "1850-03-15" */
function formatDate(date: string | null): string {
  if (!date) return "?";
  const normalized = date.trim().toLocaleLowerCase("lt");
  if (
    normalized === "" ||
    normalized === "unknown" ||
    normalized === "nezinoma" ||
    normalized === "nežinoma" ||
    normalized === "?"
  ) {
    return "?";
  }
  // If it's just a year
  if (/^\d{4}$/.test(date)) return date;
  // If year-month
  if (/^\d{4}-\d{2}$/.test(date)) {
    const [y, m] = date.split("-");
    return `${y}-${m}`;
  }
  // Full date
  return date;
}

/** Calculates display lifespan string */
function lifespan(person: Person): string {
  const birth = formatDate(person.birth_date);
  if (person.is_deceased || person.death_date) {
    const death = formatDate(person.death_date);
    return `${birth} – ${death}`;
  }
  return `${birth} –`;
}

/** Maps confidence to border style */
function confidenceBorder(confidence: Confidence): string {
  switch (confidence) {
    case "confirmed":
      return "2px solid #4a7c59";
    case "probable":
      return "2px dashed #b8860b";
    case "uncertain":
      return "2px dotted #c0392b";
    case "legendary":
      return "2px dotted #8e44ad";
  }
}

const CONFIDENCE_LABELS: Record<Confidence, string> = {
  confirmed: "✓",
  probable: "~",
  uncertain: "?",
  legendary: "★",
};

const CONFIDENCE_TITLES_LT: Record<Confidence, string> = {
  confirmed: "Patvirtinta",
  probable: "Tikėtina",
  uncertain: "Neaišku",
  legendary: "Legenda",
};

function PersonNodeComponent({ data }: NodeProps) {
  const { person, isSelected, isHighlighted, isFocused, isDimmed } =
    data as PersonNodeData;
  const displayName = person.maiden_name
    ? `${person.first_name} ${person.last_name ?? ""} (${person.maiden_name})`
    : `${person.first_name} ${person.last_name ?? ""}`;

  const glowing = isSelected || isHighlighted || isFocused;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ visibility: "hidden" }}
      />
      <div
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          background: isFocused ? "#fff4e8" : glowing ? "#fff8f0" : "#ffffff",
          border: isFocused
            ? "3px solid #e8915c"
            : isHighlighted
              ? "2px solid #3498db"
              : confidenceBorder(person.confidence),
          boxShadow: isFocused
            ? "0 0 0 5px rgba(232,145,92,0.22), 0 4px 14px rgba(0,0,0,0.18)"
            : isHighlighted
              ? "0 0 0 4px rgba(52,152,219,0.4), 0 2px 8px rgba(0,0,0,0.15)"
              : isSelected
                ? "0 0 0 3px #e8915c, 0 2px 8px rgba(0,0,0,0.15)"
                : "0 2px 6px rgba(0,0,0,0.1)",
          cursor: "pointer",
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          textAlign: "center",
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          position: "relative",
          opacity: isDimmed
            ? 0.26
            : person.confidence === "uncertain"
              ? 0.85
              : 1,
          transform: isFocused ? "scale(1.02)" : "scale(1)",
          transition:
            "opacity 160ms ease, box-shadow 160ms ease, transform 160ms ease, background 160ms ease",
        }}
      >
        {/* Confidence badge */}
        {person.confidence !== "confirmed" && (
          <span
            style={{
              position: "absolute",
              top: -8,
              right: -8,
              background:
                person.confidence === "probable"
                  ? "#f0d060"
                  : person.confidence === "uncertain"
                    ? "#e74c3c"
                    : "#9b59b6",
              color: "#fff",
              borderRadius: "50%",
              width: 22,
              height: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: "bold",
            }}
            title={CONFIDENCE_TITLES_LT[person.confidence]}
          >
            {CONFIDENCE_LABELS[person.confidence]}
          </span>
        )}

        {/* Photo thumbnail */}
        {person.photo_url && (
          <img
            src={person.photo_url}
            alt={displayName}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              objectFit: "cover",
              marginBottom: 4,
            }}
          />
        )}

        {/* Name */}
        <div
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#2c3e50",
            lineHeight: 1.2,
            fontStyle: person.confidence === "legendary" ? "italic" : "normal",
          }}
        >
          {displayName.trim()}
        </div>

        {/* Lifespan */}
        <div
          style={{
            fontSize: 13,
            color: "#7f8c8d",
            marginTop: 2,
            whiteSpace: "nowrap",
          }}
        >
          {lifespan(person)}
        </div>

        {/* Deceased ribbon — dark diagonal line across top-right corner */}
        {person.is_deceased && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 28,
              height: 28,
              overflow: "hidden",
              borderTopRightRadius: 10,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 5,
                right: -8,
                width: 40,
                height: 3,
                background: "#555",
                transform: "rotate(45deg)",
              }}
            />
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ visibility: "hidden" }}
      />
    </>
  );
}

export const PersonNode = memo(PersonNodeComponent);
