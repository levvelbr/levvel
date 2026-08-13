import { useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AuthModal } from "../components/AuthModal";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";

export const ContactPage = () => {
  const navigate = useNavigate();
  const { session, login, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col bg-linear-to-b from-emerald-50 via-slate-50 to-white">
      <Header
        onOpenMenu={() => setIsSidebarOpen(true)}
        loggedClientName={session?.nome ?? null}
        loggedClientPhotoUrl={session?.foto_perfil_url ?? null}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onLogout={() => {
          logout();
          navigate("/");
        }}
      />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenLogin={() => setIsAuthModalOpen(true)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthChange={(nextSession) => {
          if (nextSession) {
            login(nextSession);
          }
          setIsAuthModalOpen(false);
        }}
      />

      <main className="flex min-h-0 flex-1 px-4 py-5 sm:px-6 sm:py-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Voltar para a home
          </Link>

          <section className="mt-4 border-b border-emerald-100 pb-5">
            <p className="text-sm font-semibold text-emerald-700">Contato</p>
            <h1 className="mt-2 text-3xl font-semibold text-emerald-950 sm:text-4xl">
              Fale com a LevveL
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Estamos disponíveis para tirar dúvidas e ajudar com a sua
              experiência na plataforma.
            </p>
          </section>

          <section className="mt-5 grid gap-3 sm:grid-cols-2">
            <a
              href="mailto:levvel@mail.com"
              className="group flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50"
            >
              <Mail className="h-6 w-6 text-emerald-700" strokeWidth={1.8} />
              <div className="mt-5">
                <h2 className="text-lg font-semibold text-slate-900">E-mail</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Envie sua mensagem para nossa equipe.
                </p>
                <p className="mt-3 font-semibold text-emerald-700">
                  levvel@mail.com
                </p>
              </div>
            </a>

            <a
              href="https://wa.me/55999999999"
              target="_blank"
              rel="noreferrer"
              className="group flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-50"
            >
              <MessageCircle
                className="h-6 w-6 text-emerald-700"
                strokeWidth={1.8}
              />
              <div className="mt-5">
                <h2 className="text-lg font-semibold text-slate-900">
                  WhatsApp
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Converse com a gente pelo WhatsApp.
                </p>
                <p className="mt-3 font-semibold text-emerald-700">
                  (55) 9 9999-9999
                </p>
              </div>
            </a>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ContactPage;
