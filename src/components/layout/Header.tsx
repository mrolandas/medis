import { useState } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { useTreeData } from "../../providers/TreeDataProvider";
import { useIsMobile } from "../../hooks/useIsMobile";
import { SearchBar } from "../search/SearchBar";

interface HeaderProps {
  onAddPerson: () => void;
  onOpenFamilyMembers: () => void;
  onSelectPerson: (id: string) => void;
}

export function Header({
  onAddPerson,
  onOpenFamilyMembers,
  onSelectPerson,
}: HeaderProps) {
  const { t } = useTranslation();
  const { saveStatus } = useTreeData();
  const isMobile = useIsMobile();
  const [showSearch, setShowSearch] = useState(false);

  if (isMobile) {
    return (
      <header
        style={{
          background: "#2d3436",
          color: "#fff",
          flexShrink: 0,
          fontFamily: "'Segoe UI', system-ui, sans-serif",
        }}
      >
        {/* Top row: title + actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 12px",
            height: 52,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>🌳</span>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              {t("app.title")}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {saveStatus !== "idle" && (
              <span
                style={{
                  fontSize: 12,
                  padding: "3px 8px",
                  borderRadius: 10,
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
              onClick={() => setShowSearch((v) => !v)}
              style={{
                background: "none",
                border: "none",
                color: "#fff",
                fontSize: 22,
                cursor: "pointer",
                padding: "4px 8px",
                minHeight: 36,
              }}
              title={t("search.placeholder")}
            >
              🔍
            </button>
            <button
              onClick={onOpenFamilyMembers}
              style={{
                padding: "8px 12px",
                fontSize: 13,
                fontWeight: 600,
                background: "#0984e3",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {t("action.familyMembers")}
            </button>
            <button
              onClick={onAddPerson}
              style={{
                padding: "8px 14px",
                fontSize: 14,
                fontWeight: 600,
                background: "#4a7c59",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              + {t("action.addPerson")}
            </button>
          </div>
        </div>

        {/* Expandable search row */}
        {showSearch && (
          <div style={{ padding: "0 12px 10px" }}>
            <SearchBar
              onSelectPerson={(id) => {
                onSelectPerson(id);
                setShowSearch(false);
              }}
              fullWidth
            />
          </div>
        )}
      </header>
    );
  }

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
          onClick={onOpenFamilyMembers}
          style={{
            padding: "10px 16px",
            fontSize: 15,
            fontWeight: 600,
            background: "#0984e3",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {t("action.familyMembers")}
        </button>
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
