import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Logo from "../../components/Logo";
import BrandImage from "../../components/BrandImage";
import { ShieldIcon, BoltIcon, UsersIcon } from "../../components/icons";
import "./AuthShell.css";

const points = [
  { icon: <BoltIcon width={16} height={16} />, text: "Start a meeting in one click" },
  { icon: <UsersIcon width={16} height={16} />, text: "Group video over WebRTC" },
  { icon: <ShieldIcon width={16} height={16} />, text: "Private rooms, host-controlled" },
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
  return (
    <div className="auth">
      <aside className="auth__brand">
        <BrandImage name="home_office" alt="" loading="eager" className="auth__brand-photo" />
        <span className="auth__brand-scrim" aria-hidden />
        <Link to="/" className="auth__brand-logo">
          <Logo size={30} tone="mono-light" />
        </Link>
        <div className="auth__brand-body">
          <h2>Meetings that start the moment you do.</h2>
          <ul>
            {points.map((p) => (
              <li key={p.text}>
                <span className="auth__brand-icon">{p.icon}</span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="auth__panel">
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
