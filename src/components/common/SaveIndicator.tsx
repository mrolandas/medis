import { useTreeData } from "../../providers/TreeDataProvider";
import { useTranslation } from "../../hooks/useTranslation";

/** Small floating indicator showing auto-save status */
export function SaveIndicator() {
  const { t } = useTranslation();
  const { saveStatus } = useTreeData();

  if (saveStatus === "idle") return null;

  const config = {
    saving: { text: t("save.saving"), bg: "#f39c12", color: "#fff" },
    saved: { text: t("save.saved"), bg: "#27ae60", color: "#fff" },
    error: { text: t("save.error"), bg: "#e74c3c", color: "#fff" },
  }[saveStatus];

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "8px 20px",
        borderRadius: 20,
        background: config.bg,
        color: config.color,
        fontSize: 14,
        fontWeight: 600,
        zIndex: 500,
        boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
        transition: "opacity 0.3s",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {config.text}
    </div>
  );
}
