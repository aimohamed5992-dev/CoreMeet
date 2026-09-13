import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import AuthShell from "./AuthShell";
import PasswordField from "./PasswordField";
import { useAuth } from "../../lib/auth/AuthContext";
import { errorMessage } from "../../lib/api";

type LocationState = { from?: { pathname: string } };

export default function LoginPage() {
  const { t } = useTranslation();
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as LocationState)?.from?.pathname ?? "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === "authenticated") return <Navigate to={redirectTo} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login({ email: email.trim(), password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(errorMessage(err, "errors.signInFailed", t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      footer={
        <>
          {t("auth.login.footerText")} <Link to="/register">{t("auth.login.footerLink")}</Link>
        </>
      }
    >
      <form className="auth__form" onSubmit={submit} noValidate>
        {error && <div className="auth__error" role="alert">{error}</div>}

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
          autoComplete="current-password"
        />

        <button className="btn btn--primary auth__submit" disabled={busy}>
          {busy ? t("auth.login.submitting") : t("auth.login.submit")}
        </button>
      </form>
    </AuthShell>
  );
}
