import { useTranslation } from "../../hooks/useTranslation";
import { useTreeData } from "../../providers/TreeDataProvider";
import { SearchBar } from "../search/SearchBar";

interface HeaderProps {
  onAddPerson: () => void;
  onSelectPerson: (id: string) => void;
}

export function Header({ onAddPerson, onSelectPerson }: HeaderProps) {
  const { t } = useTranslation();
  const { saveStatus } = useTreeData();

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        height: 64,
        background: "#2d3436",
        color: "#fff",
        flexShrink: 0,
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Left: App title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 26, lineHeight: 1 }}>🌳</span>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          {t("app.title")}
        </h1>
      </div>

      {/* Center: Search */}
      <SearchBar onSelectPerson={onSelectPerson} />

      {/* Right: Add person + save status */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {saveStatus !== "idle" && (
          <span
            style={{
              fontSize: 13,
              padding: "4px 10px",
              borderRadius: 12,
              background:
                saveStatus === "saving"
                  ? "#f39c12"
                  : saveStatus === "saved"
                    ? "#27ae60"
                    : "#e74c3c",
              color: "#fff",
              fontWeight: 600,
            }}
          >
            {saveStatus === "saving" && t("save.saving")}
            {saveStatus === "saved" && t("save.saved")}
            {saveStatus === "error" && t("save.error")}
          </span>
        )}
        <button
          onClick={onAddPerson}
          style={{
            padding: "10px 20px",
            fontSize: 15,
            fontWeight: 600,
            background: "#4a7c59",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          + {t("action.addPerson")}
        </button>
      </div>
    </header>
  );
}
