import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "../../components/Logo";
import BrandImage from "../../components/BrandImage";
import ThemeToggle from "../../components/ThemeToggle";
import LanguageToggle from "../../components/LanguageToggle";
import { ShieldIcon, BoltIcon, UsersIcon } from "../../components/icons";
import "./AuthShell.css";

const pointIcons = [
  <BoltIcon width={16} height={16} />,
  <UsersIcon width={16} height={16} />,
  <ShieldIcon width={16} height={16} />,
];

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const { t } = useTranslation();
  const points = t("auth.shellPoints", { returnObjects: true }) as string[];

  return (
    <div className="auth">
      <aside className="auth__brand">
        <BrandImage name="home_office" alt="" loading="eager" className="auth__brand-photo" />
        <span className="auth__brand-scrim" aria-hidden />
        <Link to="/" className="auth__brand-logo">
          <Logo size={30} tone="mono-light" />
        </Link>
        <div className="auth__brand-body">
          <h2>{t("auth.shellHeading")}</h2>
          <ul>
            {points.map((p, i) => (
              <li key={p}>
                <span className="auth__brand-icon">{pointIcons[i]}</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="auth__panel">
        <div className="auth__toggles">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <div className="auth__card">
          <Link to="/" className="auth__panel-logo">
            <Logo size={28} />
          </Link>
          <h1>{title}</h1>
          <p className="auth__subtitle">{subtitle}</p>
          {children}
          <div className="auth__footer">{footer}</div>
        </div>
      </main>
    </div>
  );
}
