import { useState, useCallback, type ReactNode } from "react";
import { useTranslation } from "../../hooks/useTranslation";

const SESSION_KEY = "medis_authenticated";
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD;

interface AuthGateProps {
  children: ReactNode;
}

/** Simple session-based password gate. Persists in sessionStorage (cleared on tab close). */
export function AuthGate({ children }: AuthGateProps) {
  const { t } = useTranslation();
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true",
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (password === APP_PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, "true");
        setAuthenticated(true);
        setError(false);
      } else {
        setError(true);
      }
    },
    [password],
  );

  if (authenticated) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#f8f9fa",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: "40px 48px",
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          textAlign: "center",
          width: 360,
          maxWidth: "90vw",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>🌳</div>
        <h1 style={{ margin: "0 0 8px", fontSize: 26, color: "#2d3436" }}>
          {t("app.title")}
        </h1>
        <p style={{ margin: "0 0 24px", fontSize: 16, color: "#636e72" }}>
          {t("auth.title")}
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          placeholder={t("auth.password")}
          autoFocus
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: 18,
            border: `2px solid ${error ? "#e74c3c" : "#dfe6e9"}`,
            borderRadius: 10,
            outline: "none",
            boxSizing: "border-box",
            marginBottom: 8,
          }}
        />

        {error && (
          <div style={{ color: "#e74c3c", fontSize: 14, marginBottom: 8 }}>
            {t("auth.error")}
          </div>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px 20px",
            fontSize: 17,
            fontWeight: 600,
            background: "#4a7c59",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            cursor: "pointer",
            marginTop: 8,
          }}
        >
          {t("auth.submit")}
        </button>
      </form>
    </div>
  );
}
