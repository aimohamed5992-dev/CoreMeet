import { Link, NavLink, Outlet } from "react-router-dom";
import Logo from "../components/Logo";
import "./MarketingLayout.css";

export default function MarketingLayout() {
  return (
    <div className="marketing">
      <header className="marketing__header">
        <div className="container marketing__bar">
          <Link to="/" aria-label="CoreMeet home">
            <Logo size={30} />
          </Link>
          <nav className="marketing__nav">
            <NavLink to="/#features">Features</NavLink>
            <NavLink to="/#how">How it works</NavLink>
            <NavLink to="/#security">Security</NavLink>
          </nav>
          <div className="marketing__actions">
            <Link to="/login" className="btn btn--ghost">Sign in</Link>
            <Link to="/register" className="btn btn--primary">Get started</Link>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="marketing__footer">
        <div className="container marketing__footer-inner">
          <Logo size={26} />
          <p>Secure video meetings for everyone. Built with WebRTC.</p>
          <span className="marketing__copy">© {new Date().getFullYear()} CoreMeet</span>
        </div>
      </footer>
    </div>
  );
}
