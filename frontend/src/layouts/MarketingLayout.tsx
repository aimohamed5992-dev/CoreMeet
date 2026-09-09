import { Link, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "../components/Logo";
import Avatar from "../components/Avatar";
import ThemeToggle from "../components/ThemeToggle";
import LanguageToggle from "../components/LanguageToggle";
import { useAuth } from "../lib/auth/AuthContext";
import "./MarketingLayout.css";

export default function MarketingLayout() {
  const { status, user } = useAuth();
  const { t } = useTranslation();

  const footerCols = [
    {
      title: t("footer.product"),
      links: [
        { label: t("footer.links.features"), href: "/#features" },
        { label: t("footer.links.how"), href: "/#how" },
        { label: t("footer.links.security"), href: "/#security" },
      ],
    },
    {
      title: t("footer.getStarted"),
      links: [
        { label: t("footer.links.createAccount"), href: "/register" },
        { label: t("footer.links.signIn"), href: "/login" },
        { label: t("footer.links.joinMeeting"), href: "/" },
      ],
    },
    {
      title: t("footer.company"),
      links: [
        { label: t("footer.links.about"), href: "/#" },
        { label: t("footer.links.blog"), href: "/#" },
        { label: t("footer.links.contact"), href: "/#" },
      ],
    },
  ];

  return (
    <div className="marketing">
      <header className="marketing__header">
        <div className="container marketing__bar">
          <Link to="/" aria-label={t("brand.name")}>
            <Logo size={30} />
          </Link>
          <nav className="marketing__nav">
            <a href="/#features">{t("nav.features")}</a>
            <a href="/#how">{t("nav.how")}</a>
            <a href="/#security">{t("nav.security")}</a>
          </nav>
          <div className="marketing__actions">
            <LanguageToggle />
            <ThemeToggle />
            {status === "authenticated" && user ? (
              <Link to="/app" className="btn btn--primary marketing__account">
                <Avatar user={user} size={24} /> {t("nav.goToApp")}
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost">{t("nav.signIn")}</Link>
                <Link to="/register" className="btn btn--primary">{t("nav.getStarted")}</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="marketing__footer">
        <div className="container marketing__footer-inner">
          <div className="marketing__footer-brand">
            <Logo size={28} />
            <p>{t("brand.tagline")}</p>
            <span className="marketing__copy">{t("footer.rights", { year: new Date().getFullYear() })}</span>
          </div>
          <div className="marketing__footer-cols">
            {footerCols.map((col) => (
              <div key={col.title}>
                <h4>{col.title}</h4>
                <ul>
                  {col.links.map((l) => (
                    <li key={l.label}><a href={l.href}>{l.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
