import { Navigate, Route, Routes, useParams } from "react-router-dom";
import MarketingLayout from "./layouts/MarketingLayout";
import LandingPage from "./pages/LandingPage";
import PlaceholderPage from "./pages/PlaceholderPage";

function JoinRedirect() {
  const { code } = useParams();
  return <PlaceholderPage title={`Joining ${code ?? ""}`} step="step 3" />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route index element={<LandingPage />} />
      </Route>

      <Route path="/login" element={<PlaceholderPage title="Sign in" step="step 2" />} />
      <Route path="/register" element={<PlaceholderPage title="Create your account" step="step 2" />} />
      <Route path="/app" element={<PlaceholderPage title="Your meetings" step="step 3" />} />
      <Route path="/join/:code" element={<JoinRedirect />} />
      <Route path="/meeting/:code" element={<PlaceholderPage title="Meeting room" step="step 4" />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
