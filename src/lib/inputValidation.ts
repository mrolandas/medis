import type { PersonInput } from "../types";

const PARTIAL_DATE_PATTERN =
  /^(unknown|\d{4}|\d{4}-(0[1-9]|1[0-2])|\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))$/;

const UNKNOWN_TOKENS = new Set(["unknown", "nezinoma", "ne\u017einoma", "?"]);

export function normalizeTextInput(value: string | null): string | null {
  if (value == null) return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizePartialDateInput(value: string | null): string | null {
  const normalized = normalizeTextInput(value);
  if (!normalized) return "unknown";

  const lowered = normalized.toLocaleLowerCase();
  if (UNKNOWN_TOKENS.has(lowered)) {
    return "unknown";
  }

  return normalized;
}

export function isValidPartialDateInput(value: string | null): boolean {
  const normalized = normalizePartialDateInput(value);
  if (!normalized) return true;
  return PARTIAL_DATE_PATTERN.test(normalized);
}

export function sanitizePersonInput<T extends Partial<PersonInput>>(
  input: T,
): T {
  const sanitized = { ...input } as T;
  const mutable = sanitized as Record<string, unknown>;

  const textFields: Array<keyof PersonInput> = [
    "first_name",
    "last_name",
    "maiden_name",
    "birth_place",
    "death_place",
    "burial_place",
    "cause_of_death",
    "occupation",
    "notes",
    "photo_url",
  ];

  for (const field of textFields) {
    if (field in mutable) {
      const value = mutable[field];
      if (typeof value === "string" || value === null) {
        mutable[field] = normalizeTextInput(value);
      }
    }
  }

  const dateFields: Array<keyof PersonInput> = ["birth_date", "death_date"];
  for (const field of dateFields) {
    if (field in mutable) {
      const value = mutable[field];
      if (typeof value === "string" || value === null) {
        mutable[field] = normalizePartialDateInput(value);
      }
    }
  }

  return sanitized;
}
