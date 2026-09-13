import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthShell from "./AuthShell";
import PasswordField from "./PasswordField";
import { useAuth } from "../../lib/auth/AuthContext";
import { errorMessage } from "../../lib/api";

export default function RegisterPage() {
  const { t } = useTranslation();
  const { status, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === "authenticated") return <Navigate to="/app" replace />;

  const pwTooShort = password.length > 0 && password.length < 8;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t("errors.pwTooShort"));
      return;
    }
    setBusy(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      navigate("/app", { replace: true });
    } catch (err) {
      setError(errorMessage(err, "errors.createFailed", t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={t("auth.register.title")}
      subtitle={t("auth.register.subtitle")}
      footer={
        <>
          {t("auth.register.footerText")} <Link to="/login">{t("auth.register.footerLink")}</Link>
        </>
      }
    >
      <form className="auth__form" onSubmit={submit} noValidate>
        {error && <div className="auth__error" role="alert">{error}</div>}

        <div className="field">
          <label htmlFor="name">{t("auth.fullName")}</label>
          <input
            id="name"
            className="input"
            autoComplete="name"
            required
            minLength={2}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="email">{t("auth.email")}</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <PasswordField
          value={password}
          onChange={setPassword}
          label={t("auth.password")}
          autoComplete="new-password"
          hint={t("auth.register.pwHint")}
          hintError={pwTooShort}
        />

        <button className="btn btn--primary auth__submit" disabled={busy}>
          {busy ? t("auth.register.submitting") : t("auth.register.submit")}
        </button>
      </form>
    </AuthShell>
  );
}
