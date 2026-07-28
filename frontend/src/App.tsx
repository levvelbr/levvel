import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AppLayout } from "./layouts/AppLayout";
import { ClientBookingPage } from "./pages/ClientBookingPage";
import { EstablishmentAgendaPage } from "./pages/EstablishmentAgendaPage";
import { EstablishmentPublicPage } from "./pages/EstablishmentPublicPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RoleRoute } from "./routes/RoleRoute";

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/estabelecimentos/:id"
            element={<EstablishmentPublicPage />}
          />
          <Route path="/nao-autorizado" element={<UnauthorizedPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="/" replace />} />

              <Route element={<RoleRoute allowedRoles={["cliente"]} />}>
                <Route
                  path="agendamentos/novo"
                  element={<ClientBookingPage />}
                />
              </Route>

              <Route element={<RoleRoute allowedRoles={["estabelecimento"]} />}>
                <Route path="agenda" element={<EstablishmentAgendaPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
