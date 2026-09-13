import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import i18n, { dirFor, LANGUAGES, readStoredLanguage, STORAGE_KEY, type Language } from "./index";

type LanguageState = {
  language: Language;
  dir: "rtl" | "ltr";
  isRTL: boolean;
  setLanguage: (l: Language) => void;
  toggle: () => void;
  languages: readonly Language[];
};

const LanguageCtx = createContext<LanguageState | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>(readStoredLanguage);

  useEffect(() => {
    const dir = dirFor(language);
    document.documentElement.setAttribute("lang", language);
    document.documentElement.setAttribute("dir", dir);
    if (i18n.language !== language) i18n.changeLanguage(language);
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      /* ignore */
    }
  }, [language]);

  const setLanguage = useCallback((l: Language) => setLang(l), []);
  const toggle = useCallback(() => setLang((l) => (l === "ar" ? "en" : "ar")), []);

  const value = useMemo<LanguageState>(
    () => ({
      language,
      dir: dirFor(language),
      isRTL: language === "ar",
      setLanguage,
      toggle,
      languages: LANGUAGES,
    }),
    [language, setLanguage, toggle],
  );

  return <LanguageCtx.Provider value={value}>{children}</LanguageCtx.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageCtx);
  if (!ctx) throw new Error("useLanguage must be used within <LanguageProvider>");
  return ctx;
}

/** Convenience: the i18next `t` plus current language info. */
export function useI18n() {
  const { t } = useTranslation();
  const lang = useLanguage();
  return { t, ...lang };
}
