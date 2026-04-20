import lt, { type TranslationKey } from "../locales/lt";

/** Simple translation hook for single-language (Lithuanian) app */
export function useTranslation() {
  function t(key: TranslationKey): string {
    return lt[key];
  }
  return { t };
}
