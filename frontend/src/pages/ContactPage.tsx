import { useState } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AuthModal } from "../components/AuthModal";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";

export const ContactPage = () => {
  const navigate = useNavigate();
  const { session, login, logout } = useAuth();
  const isEstablishment = session?.role === "estabelecimento";
  const accentText = isEstablishment ? "text-blue-700" : "text-emerald-700";
  const accentBorderHover = isEstablishment
    ? "hover:border-blue-300"
    : "hover:border-emerald-300";
  const accentBackgroundHover = isEstablishment
    ? "hover:bg-blue-50"
    : "hover:bg-emerald-50";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div
      className={`flex h-full min-h-0 flex-col bg-linear-to-b ${isEstablishment ? "from-blue-50" : "from-emerald-50"} via-slate-50 to-white`}
    >
      <Header
        onOpenMenu={() => setIsSidebarOpen(true)}
        loggedClientName={session?.nome ?? null}
        loggedClientPhotoUrl={session?.foto_perfil_url ?? null}
        loggedClientRole={session?.role ?? null}
        loggedClientPersonType={session?.tipo_pessoa}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onLogout={() => {
          navigate("/", { replace: true, state: null });
          logout();
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
            className={`inline-flex items-center gap-1.5 py-1 text-sm font-medium text-slate-600 transition-colors ${isEstablishment ? "hover:text-blue-700" : "hover:text-emerald-700"} hover:underline hover:underline-offset-4`}
          >
            <ArrowLeft className="h-[15px] w-[15px]" aria-hidden="true" />
            Voltar para início
          </Link>

          <section
            className={`fade-up-mount mt-4 border-b ${isEstablishment ? "border-blue-100" : "border-emerald-100"} pb-5`}
          >
            <p className={`text-sm font-semibold ${accentText}`}>Contato</p>
            <h1
              className={`mt-2 text-3xl font-semibold ${isEstablishment ? "text-blue-950" : "text-emerald-950"} sm:text-4xl`}
            >
              Fale com a LevveL
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Estamos disponíveis para tirar dúvidas e ajudar com a sua
              experiência na plataforma.
            </p>
          </section>

          <section className="mt-5 grid gap-3">
            <a
              href="mailto:levvel@mail.com"
              className={`fade-up-mount fade-up-mount-delay-1 group flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${accentBorderHover} ${accentBackgroundHover}`}
            >
              <Mail className={`h-6 w-6 ${accentText}`} strokeWidth={1.8} />
              <div className="mt-5">
                <h2 className="text-lg font-semibold text-slate-900">E-mail</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Envie sua mensagem para nossa equipe.
                </p>
                <p className={`mt-3 font-semibold ${accentText}`}>
                  levvel@mail.com
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
