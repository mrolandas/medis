import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const AUTH_PASSWORD_SESSION_KEY = "medis_auth_password";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.",
  );
}

let cachedClient: SupabaseClient | null = null;
let cachedPassword: string | null = null;

/** Returns an authenticated Supabase client with request-level app password header. */
export function getSupabaseClient(): SupabaseClient {
  const password =
    typeof window === "undefined"
      ? ""
      : (sessionStorage.getItem(AUTH_PASSWORD_SESSION_KEY) ?? "");

  if (!password) {
    throw new Error("Not authenticated. Please sign in again.");
  }

  if (!cachedClient || cachedPassword !== password) {
    cachedPassword = password;
    cachedClient = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          "x-medis-password": password,
        },
      },
    });
  }

  return cachedClient;
}
