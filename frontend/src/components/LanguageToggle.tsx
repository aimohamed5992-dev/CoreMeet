import { useLanguage } from "../lib/i18n/LanguageProvider";

export default function LanguageToggle({ className }: { className?: string }) {
  const { language, toggle } = useLanguage();
  const next = language === "ar" ? "English" : "العربية";
  return (
    <button
      type="button"
      onClick={toggle}
      className={`lang-toggle ${className ?? ""}`}
      aria-label={`Switch to ${next}`}
      title={next}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 38,
        height: 38,
        padding: "0 12px",
        borderRadius: "999px",
        fontWeight: 700,
        fontSize: "0.82rem",
        color: "var(--text-muted)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      {language === "ar" ? "EN" : "ع"}
    </button>
  );
}
