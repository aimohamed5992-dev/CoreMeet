import { Link } from "react-router-dom";
import Logo from "../components/Logo";

/**
 * Temporary scaffold screen. Each real page replaces this in its step:
 *  - Sign in / Register  → step 2
 *  - Dashboard / Join    → step 3
 *  - Meeting room        → step 4
 */
export default function PlaceholderPage({ title, step }: { title: string; step: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "radial-gradient(1200px 600px at 50% -10%, var(--brand-50), var(--bg))",
      }}
    >
      <div className="card" style={{ padding: 40, maxWidth: 440, textAlign: "center" }}>
        <Logo size={34} style={{ justifyContent: "center", marginBottom: 20 }} />
        <h1 style={{ fontSize: "1.5rem" }}>{title}</h1>
        <p style={{ color: "var(--text-muted)", marginTop: 10 }}>
          This screen is wired up in <strong>{step}</strong>. The routing, design
          system, and API client are already in place.
        </p>
        <Link to="/" className="btn btn--ghost" style={{ marginTop: 22 }}>
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
