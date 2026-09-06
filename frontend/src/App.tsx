import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import MarketingLayout from "./layouts/MarketingLayout";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Logo from "./components/Logo";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";

// The meeting room pulls in SignalR + WebRTC + framer-motion — load it on demand.
const MeetingRoute = lazy(() => import("./pages/meeting/MeetingRoute"));

function JoinRedirect() {
  const { code = "" } = useParams();
  return <Navigate to={`/meeting/${code}`} replace />;
}

function RouteFallback() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--room-bg)" }}>
      <Logo size={30} />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route index element={<LandingPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/join/:code" element={<JoinRedirect />} />

      {/* Meetings are open to guests — sign-in is only required to create one. */}
      <Route
        path="/meeting/:code"
        element={
          <Suspense fallback={<RouteFallback />}>
            <MeetingRoute />
          </Suspense>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/app" element={<DashboardPage />} />
          <Route path="/settings" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
