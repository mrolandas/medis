import { useState, useCallback, useEffect, type ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import { useTranslation } from "../../hooks/useTranslation";
import { AUTH_PASSWORD_SESSION_KEY } from "../../lib/supabase";

const SESSION_KEY = "medis_authenticated";
const FAILED_ATTEMPTS_KEY = "medis_failed_attempts";
const LOCK_UNTIL_KEY = "medis_lock_until";
const BASE_LOCK_SECONDS = 2;
const MAX_LOCK_SECONDS = 10 * 60;
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
  const [lockUntilMs, setLockUntilMs] = useState(() => {
    const raw = localStorage.getItem(LOCK_UNTIL_KEY);
    const value = raw ? Number(raw) : 0;
    return Number.isFinite(value) ? value : 0;
  });

  const nowMs = Date.now();
  const isLocked = lockUntilMs > nowMs;
  const remainingSeconds = Math.max(0, Math.ceil((lockUntilMs - nowMs) / 1000));

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
      if (Date.now() < lockUntilMs) return;

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
        localStorage.removeItem(FAILED_ATTEMPTS_KEY);
        localStorage.removeItem(LOCK_UNTIL_KEY);
        setLockUntilMs(0);
        setAuthenticated(true);
        setError(false);
        // Reload to ensure all data clients are re-created with auth headers.
        window.location.reload();
      } else {
        const previous = Number(
          localStorage.getItem(FAILED_ATTEMPTS_KEY) ?? "0",
        );
        const failedAttempts = Number.isFinite(previous) ? previous + 1 : 1;
        localStorage.setItem(FAILED_ATTEMPTS_KEY, String(failedAttempts));

        const lockSeconds = Math.min(
          MAX_LOCK_SECONDS,
          BASE_LOCK_SECONDS * 2 ** Math.max(0, failedAttempts - 1),
        );
        const nextLockUntil = Date.now() + lockSeconds * 1000;
        localStorage.setItem(LOCK_UNTIL_KEY, String(nextLockUntil));
        setLockUntilMs(nextLockUntil);

        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(AUTH_PASSWORD_SESSION_KEY);
        setError(true);
      }
    },
    [password, validatePassword, lockUntilMs],
  );

  useEffect(() => {
    if (!isLocked) return;
    const interval = window.setInterval(() => {
      const latest = Number(localStorage.getItem(LOCK_UNTIL_KEY) ?? "0");
      setLockUntilMs(Number.isFinite(latest) ? latest : 0);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isLocked]);

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
          disabled={submitting || isLocked}
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

        {isLocked && (
          <div style={{ color: "#d35400", fontSize: 14, marginBottom: 8 }}>
            {t("auth.lockedPrefix")} {remainingSeconds} {t("auth.lockedSuffix")}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || isLocked}
          style={{
            width: "100%",
            padding: "12px 20px",
            fontSize: 17,
            fontWeight: 600,
            background: submitting || isLocked ? "#95a5a6" : "#4a7c59",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            cursor: submitting || isLocked ? "not-allowed" : "pointer",
            marginTop: 8,
          }}
        >
          {t("auth.submit")}
        </button>
      </form>
    </div>
  );
}
