import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function PasswordField({
  value,
  onChange,
  label,
  autoComplete,
  hint,
  hintError,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  autoComplete: "current-password" | "new-password";
  hint?: string;
  hintError?: boolean;
}) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  return (
    <div className="field">
      <label htmlFor="password">{label}</label>
      <div className="pwfield">
        <input
          id="password"
          className="input pwfield__input"
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="button" className="pwfield__toggle" onClick={() => setShow((v) => !v)}>
          {show ? t("auth.hide") : t("auth.show")}
        </button>
      </div>
      {hint && (
        <span className="auth__hint" style={hintError ? { color: "var(--danger)" } : undefined}>
          {hint}
        </span>
      )}
    </div>
  );
}
