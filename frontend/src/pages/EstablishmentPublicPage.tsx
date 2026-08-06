import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "../components/AuthModal";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { BookingForm } from "../components/BookingForm";
import api from "../services/api";

interface Establishment {
  id: string;
  nome_estabelecimento: string;
  responsavel: string;
  telefone: string;
  email: string;
  localizacao: string;
  foto_estabelecimento_url: string | null;
  cnpj: string;
  razao_social: string;
  categoria: string;
  instagram: string;
  servicos_oferecidos: string[];
  tecnicas_utilizadas: string[];
  produtos_aplicados: string[];
  profissionais_envolvidos: string[];
  horario_funcionamento: Record<string, unknown>;
  ativo: boolean;
  criado_em: string;
}

const EMPTY_LIST_MESSAGE = "Informacao nao cadastrada";

const formatList = (values: string[]) => {
  if (!values.length) {
    return EMPTY_LIST_MESSAGE;
  }

  return values.join(", ");
};

export const EstablishmentPublicPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, session, login, logout } = useAuth();
  const [establishment, setEstablishment] = useState<Establishment | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    const fetchEstablishment = async () => {
      if (!id) {
        setError("Estabelecimento invalido.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await api.get(
          "/v1/estabelecimentos/listar_estabelecimentos",
        );
        const data = response.data as unknown;
        const items = Array.isArray(data)
          ? data
          : ((data as { data?: Establishment[] }).data ?? []);

        const selected = items.find((item) => item.id === id && item.ativo);

        if (!selected) {
          setError("Estabelecimento nao encontrado ou indisponivel.");
          setEstablishment(null);
          return;
        }

        setEstablishment(selected);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(`Falha ao carregar detalhes: ${message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEstablishment();
  }, [id]);

  const fullServices = useMemo(
    () => formatList(establishment?.servicos_oferecidos ?? []),
    [establishment],
  );
  const fullTechniques = useMemo(
    () => formatList(establishment?.tecnicas_utilizadas ?? []),
    [establishment],
  );
  const fullProducts = useMemo(
    () => formatList(establishment?.produtos_aplicados ?? []),
    [establishment],
  );
  const fullProfessionals = useMemo(
    () => formatList(establishment?.profissionais_envolvidos ?? []),
    [establishment],
  );

  const handleRequestBooking = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    if (session?.role === "estabelecimento") {
      navigate("/perfil");
      return;
    }
    setShowBookingForm(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
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
        <main className="flex-1 px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">
              Carregando detalhes do estabelecimento...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !establishment) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
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
        <main className="flex-1 px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-rose-700">
              {error ?? "Estabelecimento nao encontrado."}
            </p>
            <Link
              to="/"
              className="mt-4 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Voltar para a home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
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
            setIsAuthModalOpen(false);
            if (nextSession.role === "cliente") {
              setShowBookingForm(true);
            }
          }
        }}
      />

      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-6xl">
          <div className="establishment-mount mb-4">
            <Link
              to="/"
              className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              ← Voltar
            </Link>
          </div>

          <article className="establishment-mount establishment-mount-delay-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {/* Hero image — always visible */}
            <div className="relative h-64 w-full bg-slate-100 sm:h-80 lg:h-96">
              {establishment.foto_estabelecimento_url ? (
                <img
                  src={establishment.foto_estabelecimento_url}
                  alt={`Foto de ${establishment.nome_estabelecimento}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-200 via-slate-100 to-emerald-100 text-sm font-semibold text-slate-500">
                  Sem foto
                </div>
              )}
            </div>

            {/* Content — toggles between details and booking form */}
            <div className="establishment-mount establishment-mount-delay-2 space-y-6 p-5 sm:p-8">
              {!showBookingForm ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                        {establishment.nome_estabelecimento}
                      </h1>
                      <p className="mt-2 text-sm text-slate-600 sm:text-base">
                        {establishment.localizacao}
                      </p>
                    </div>

                    {isAuthenticated && session?.role === "cliente" ? (
                      <button
                        type="button"
                        onClick={handleRequestBooking}
                        className="shrink-0 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                      >
                        Solicitar agendamento
                      </button>
                    ) : !isAuthenticated ? (
                      <button
                        type="button"
                        onClick={handleRequestBooking}
                        className="shrink-0 rounded-md border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                      >
                        Entrar para agendar
                      </button>
                    ) : null}
                  </div>

                  {!isAuthenticated && (
                    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      Faca login para solicitar um agendamento neste
                      estabelecimento.
                    </p>
                  )}

                  <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
                    <p>
                      <span className="font-semibold text-slate-900">
                        Categoria:{" "}
                      </span>
                      {establishment.categoria}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">
                        Telefone:{" "}
                      </span>
                      {establishment.telefone}
                    </p>
                    {establishment.cnpj && (
                      <p>
                        <span className="font-semibold text-slate-900">
                          CNPJ:{" "}
                        </span>
                        {establishment.cnpj}
                      </p>
                    )}
                    {establishment.razao_social && (
                      <p>
                        <span className="font-semibold text-slate-900">
                          Razao social:{" "}
                        </span>
                        {establishment.razao_social}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold text-slate-900">
                        Responsavel:{" "}
                      </span>
                      {establishment.responsavel}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">
                        Instagram:{" "}
                      </span>
                      {establishment.instagram || EMPTY_LIST_MESSAGE}
                    </p>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <h2 className="text-sm font-semibold text-slate-900">
                        Servicos oferecidos
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">
                        {fullServices}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <h2 className="text-sm font-semibold text-slate-900">
                        Tecnicas utilizadas
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">
                        {fullTechniques}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <h2 className="text-sm font-semibold text-slate-900">
                        Produtos aplicados
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">
                        {fullProducts}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <h2 className="text-sm font-semibold text-slate-900">
                        Profissionais envolvidos
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-slate-700">
                        {fullProfessionals}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                /* Inline booking form */
                <div>
                  <div className="mb-6 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setShowBookingForm(false)}
                      className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      ← Voltar aos detalhes
                    </button>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        Solicitar agendamento
                      </h2>
                      <p className="text-sm text-slate-500">
                        {establishment.nome_estabelecimento}
                      </p>
                    </div>
                  </div>

                  <BookingForm
                    establishment={{
                      id: establishment.id,
                      nome_estabelecimento: establishment.nome_estabelecimento,
                      profissionais_envolvidos:
                        establishment.profissionais_envolvidos,
                      servicos_oferecidos: establishment.servicos_oferecidos,
                      tecnicas_utilizadas: establishment.tecnicas_utilizadas,
                      produtos_aplicados: establishment.produtos_aplicados,
                    }}
                    onSuccess={() => setShowBookingForm(false)}
                    onCancel={() => setShowBookingForm(false)}
                  />
                </div>
              )}
            </div>
          </article>
        </div>
      </main>
    </div>
  );
};

export default EstablishmentPublicPage;
