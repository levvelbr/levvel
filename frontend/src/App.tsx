import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Footer } from "./components/Footer";
import { AuthProvider } from "./contexts/AuthContext";
import { EstablishmentPublicPage } from "./pages/EstablishmentPublicPage";
import { ContactPage } from "./pages/ContactPage";
import { HomePage } from "./pages/HomePage";
import { ProfilePage } from "./pages/ProfilePage";
import { ServicesPage } from "./pages/ServicesPage";
import { TermsPrivacyPage } from "./pages/TermsPrivacyPage";
import { UnauthorizedPage } from "./pages/UnauthorizedPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex min-h-screen flex-col">
          <div className="min-h-0 flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/servicos" element={<ServicesPage />} />
              <Route path="/contato" element={<ContactPage />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route
                path="/estabelecimentos/:id"
                element={<EstablishmentPublicPage />}
              />
              <Route
                path="/termos-e-privacidade"
                element={<TermsPrivacyPage />}
              />
              <Route path="/nao-autorizado" element={<UnauthorizedPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/perfil" element={<ProfilePage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};
