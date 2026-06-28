import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/Layout/Layout";
import { useParticipantContext } from "./context/ParticipantContext";
import AdminPage from "./pages/AdminPage";
import BracketPage from "./pages/BracketPage";
import HistoryPage from "./pages/HistoryPage";
import RulesPage from "./pages/RulesPage";
import StandingsPage from "./pages/StandingsPage";
import WelcomePage from "./pages/WelcomePage";

function ProtectedRoute({ children }) {
  const { participant, loading } = useParticipantContext();
  const location = useLocation();

  if (loading) return <div className="page-loader">Cargando torneo...</div>;
  if (!participant) return <Navigate to="/welcome" state={{ from: location }} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<WelcomePage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<BracketPage />} />
        <Route path="posiciones" element={<StandingsPage />} />
        <Route path="historial" element={<HistoryPage />} />
        <Route path="reglas" element={<RulesPage />} />
      </Route>
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
