import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { EstablishmentPublicPage } from "./pages/EstablishmentPublicPage";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route
            path="/estabelecimentos/:id"
            element={<EstablishmentPublicPage />}
          />
          <Route path="/nao-autorizado" element={<UnauthorizedPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/perfil" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
