import { useState } from "react";
import {
  CalendarClock,
  Handshake,
  ArrowLeft,
  Link as LinkIcon,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AuthModal } from "../components/AuthModal";
import { EstablishmentModal } from "../components/EstablishmentModal";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { useAuth } from "../contexts/AuthContext";

const BENEFITS = [
  {
    icon: Users,
    title: "Mais clientes",
    description:
      "Apareça para pessoas buscando por serviços de bem-estar na sua região.",
  },
  {
    icon: CalendarClock,
    title: "Agenda organizada",
    description:
      "Gerencie seus horários e receba pedidos de agendamento em um só lugar.",
  },
  {
    icon: TrendingUp,
    title: "Cresça o seu negócio",
    description:
      "Acompanhe seus atendimentos e construa uma reputação sólida na plataforma.",
  },
  {
    icon: ShieldCheck,
    title: "Segurança e confiança",
    description:
      "Clientes verificados e pagamentos combinados diretamente com transparência.",
  },
];

const STEPS = [
  {
    title: "Cadastre seu estabelecimento",
    description:
      "Preencha seus dados, serviços oferecidos e horário de funcionamento.",
  },
  {
    title: "Configure sua agenda",
    description:
      "Defina os dias e horários disponíveis para receber agendamentos.",
  },
  {
    title: "Comece a atender",
    description:
      "Receba solicitações de clientes e gerencie tudo pelo painel do prestador.",
  },
];

export const ProviderSignupPage = () => {
  const navigate = useNavigate();
  const { session, login, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEstablishmentModalOpen, setIsEstablishmentModalOpen] =
    useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col bg-linear-to-b from-emerald-50 via-slate-50 to-white">
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
        onOpenEstablishmentRegistration={() =>
          setIsEstablishmentModalOpen(true)
        }
        onAuthChange={(nextSession) => {
          if (nextSession) {
            login(nextSession);
          }
          setIsAuthModalOpen(false);
        }}
      />

      <EstablishmentModal
        isOpen={isEstablishmentModalOpen}
        onClose={() => setIsEstablishmentModalOpen(false)}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onLoginSuccess={(nextSession) => {
          login(nextSession);
          setIsEstablishmentModalOpen(false);
        }}
      />

      <main className="flex-1">
        <section className="px-4 pt-14 pb-10 sm:px-6 sm:pt-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="fade-up-mount w-full flex justify-center md:justify-start mb-2 items-center">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 py-1 text-sm font-medium text-slate-600 transition-colors hover:text-emerald-700 hover:underline hover:underline-offset-4"
              >
                <ArrowLeft className="h-[15px] w-[15px]" aria-hidden="true" />
                Voltar para início
              </Link>
            </div>
            <p className="fade-up-mount mt-6 inline-block rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-800">
              <Handshake className="mr-1 inline h-4 w-4" strokeWidth={2} /> Para
              prestadores de serviço
            </p>

            <h1 className="fade-up-mount fade-up-mount-delay-1 mt-4 font-serif text-4xl font-semibold text-emerald-900 sm:text-5xl">
              Leve seu negócio para mais perto de quem procura{" "}
              <span className="text-amber-500 italic">bem-estar</span>
            </h1>

            <p className="fade-up-mount fade-up-mount-delay-2 mx-auto mt-4 max-w-2xl text-slate-600">
              Cadastre seu estabelecimento na LevveL e ganhe visibilidade,
              organize sua agenda e receba agendamentos de clientes de forma
              simples e segura.
            </p>

            <button
              type="button"
              onClick={() => setIsEstablishmentModalOpen(true)}
              className="fade-up-mount fade-up-mount-delay-3 mt-8 cursor-pointer rounded-md bg-emerald-700 px-6 py-3 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-lg active:translate-y-0"
            >
              Cadastrar meu estabelecimento
            </button>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <h2 className="fade-up-mount text-center font-serif text-2xl font-semibold text-emerald-900 sm:text-3xl">
              Por que anunciar seu Negócio na LevveL?
            </h2>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {BENEFITS.map((benefit, index) => (
                <div
                  key={benefit.title}
                  className={`fade-up-mount fade-up-mount-delay-${index + 1} rounded-2xl border border-emerald-100 bg-white p-5 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md`}
                >
                  <benefit.icon
                    className="mx-auto h-8 w-8 text-emerald-700"
                    strokeWidth={1.8}
                  />
                  <h3 className="mt-3 text-sm font-semibold text-slate-900">
                    {benefit.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6">
          <div className="fade-up-mount mx-auto max-w-4xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-10">
            <h2 className="text-center font-serif text-2xl font-semibold text-emerald-900 sm:text-3xl">
              Como se cadastrar
            </h2>

            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              {STEPS.map((step, index) => (
                <div
                  key={step.title}
                  className={`fade-up-mount fade-up-mount-delay-${index + 1} text-center`}
                >
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold text-white transition-transform duration-300 hover:scale-110">
                    {index + 1}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-slate-900">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-center">
              <LinkIcon className="h-4 w-4 text-emerald-700" strokeWidth={2} />
              <button
                type="button"
                onClick={() => setIsEstablishmentModalOpen(true)}
                className="cursor-pointer rounded-md border border-emerald-700 px-6 py-3 text-emerald-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 active:translate-y-0"
              >
                Iniciar cadastro de estabelecimento
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProviderSignupPage;
