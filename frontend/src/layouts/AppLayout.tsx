import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import Avatar from "../components/Avatar";
import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../lib/auth/AuthContext";
import "./AppLayout.css";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;

  const signOut = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__bar">
          <Link to="/app" aria-label="CoreMeet home">
            <Logo size={28} />
          </Link>

          <div className="app-shell__right">
            <ThemeToggle />
            <div className="app-shell__account" ref={menuRef}>
              <button className="app-shell__account-btn" onClick={() => setMenuOpen((v) => !v)}>
                <Avatar user={user} size={34} />
              </button>
              {menuOpen && (
                <div className="app-shell__menu card" role="menu">
                  <div className="app-shell__menu-head">
                    <Avatar user={user} size={40} />
                    <div>
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </div>
                  </div>
                  <Link
                    className="app-shell__menu-item"
                    role="menuitem"
                    to="/settings"
                    onClick={() => setMenuOpen(false)}
                  >
                    Profile &amp; photo
                  </Link>
                  <button className="app-shell__menu-item" role="menuitem" onClick={signOut}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="app-shell__main">
        <Outlet />
      </main>
    </div>
  );
}
