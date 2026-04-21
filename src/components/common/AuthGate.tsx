import { useState, useCallback, useEffect, type ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import { useTranslation } from "../../hooks/useTranslation";
import { AUTH_PASSWORD_SESSION_KEY } from "../../lib/supabase";

const SESSION_KEY = "medis_authenticated";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface AuthGateProps {
  children: ReactNode;
}

/** Simple session-based password gate. Persists in sessionStorage (cleared on tab close). */
export function AuthGate({ children }: AuthGateProps) {
  const { t } = useTranslation();
  const [authenticated, setAuthenticated] = useState(() => {
    const hasSessionFlag = sessionStorage.getItem(SESSION_KEY) === "true";
    const hasPasswordToken = !!sessionStorage.getItem(
      AUTH_PASSWORD_SESSION_KEY,
    );

    // Backward compatibility: clear stale sessions from older auth flow.
    if (hasSessionFlag && !hasPasswordToken) {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }

    return hasSessionFlag && hasPasswordToken;
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validatePassword = useCallback(async (candidate: string) => {
    if (!SUPABASE_URL || !SUPABASE_KEY) return false;

    const testClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: {
        headers: {
          "x-medis-password": candidate,
        },
      },
    });

    const { data, error: rpcError } = await testClient.rpc(
      "medis_is_authorized",
    );
    if (rpcError) return false;
    return data === true;
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!password.trim()) {
        setError(true);
        return;
      }

      setSubmitting(true);
      const isValid = await validatePassword(password);
      setSubmitting(false);

      if (isValid) {
        sessionStorage.setItem(SESSION_KEY, "true");
        sessionStorage.setItem(AUTH_PASSWORD_SESSION_KEY, password);
        setAuthenticated(true);
        setError(false);
        // Reload to ensure all data clients are re-created with auth headers.
        window.location.reload();
      } else {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(AUTH_PASSWORD_SESSION_KEY);
        setError(true);
      }
    },
    [password, validatePassword],
  );

  useEffect(() => {
    if (!authenticated) return;

    const hasPasswordToken = !!sessionStorage.getItem(
      AUTH_PASSWORD_SESSION_KEY,
    );
    if (hasPasswordToken) return;

    sessionStorage.removeItem(SESSION_KEY);
    setAuthenticated(false);
  }, [authenticated]);

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
          disabled={submitting}
          style={{
            width: "100%",
            padding: "12px 20px",
            fontSize: 17,
            fontWeight: 600,
            background: submitting ? "#95a5a6" : "#4a7c59",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            cursor: submitting ? "not-allowed" : "pointer",
            marginTop: 8,
          }}
        >
          {t("auth.submit")}
        </button>
      </form>
    </div>
  );
}
