import { Link, Outlet } from "react-router-dom";
import Logo from "../components/Logo";
import Avatar from "../components/Avatar";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../lib/auth/AuthContext";
import "./MarketingLayout.css";

const footerCols = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how" },
      { label: "Security", href: "/#security" },
    ],
  },
  {
    title: "Get started",
    links: [
      { label: "Create an account", href: "/register" },
      { label: "Sign in", href: "/login" },
      { label: "Join a meeting", href: "/" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#" },
      { label: "Blog", href: "/#" },
      { label: "Contact", href: "/#" },
    ],
  },
];

export default function MarketingLayout() {
  const { status, user } = useAuth();

  return (
    <div className="marketing">
      <header className="marketing__header">
        <div className="container marketing__bar">
          <Link to="/" aria-label="CoreMeet home">
            <Logo size={30} />
          </Link>
          <nav className="marketing__nav">
            <a href="/#features">Features</a>
            <a href="/#how">How it works</a>
            <a href="/#security">Security</a>
          </nav>
          <div className="marketing__actions">
            <ThemeToggle />
            {status === "authenticated" && user ? (
              <Link to="/app" className="btn btn--primary marketing__account">
                <Avatar user={user} size={24} /> Go to app
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost">Sign in</Link>
                <Link to="/register" className="btn btn--primary">Get started</Link>
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
            <p>Secure, instant video meetings in your browser. Built with WebRTC.</p>
            <span className="marketing__copy">© {new Date().getFullYear()} CoreMeet</span>
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
