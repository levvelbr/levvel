import {
  Children,
  cloneElement,
  isValidElement,
  useRef,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, Play, X, type LucideIcon } from "lucide-react";
import { AuthModal } from "../components/AuthModal";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { EstablishmentModal } from "../components/EstablishmentModal";
import { Sidebar } from "../components/Sidebar";
import { BookingModal } from "../components/BookingModal";
import type { BookingEstablishment } from "../components/BookingForm";
import SearchBar from "../components/SearchBar";
import api from "../services/api";
import { getCategoryIcon } from "../utils/categoryIcons";

interface LayoutProps {
  children?: ReactNode;
  variant?: "home" | "services";
}

interface Establishment {
  id: string;
  categoria: string;
  ativo: boolean;
}

interface CategoryMeta {
  name: string;
  icon: LucideIcon;
  color: string;
}

interface ProviderBooking {
  id: string;
  tratamento: string;
  profissional_envolvido: string;
  data_hora_inicio: string;
  status:
    | "pendente"
    | "confirmado"
    | "recusado"
    | "em_andamento"
    | "concluido"
    | "cancelado";
}

interface ClienteSummary {
  nome_usuario: string;
  nome_tratamento: string | null;
  foto_perfil_url: string | null;
}

const PROVIDER_STATUS_LABELS: Record<ProviderBooking["status"], string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  recusado: "Recusado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const PROVIDER_STATUS_COLORS: Record<ProviderBooking["status"], string> = {
  pendente: "bg-amber-100 text-amber-800 ring-amber-200",
  confirmado: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  recusado: "bg-rose-100 text-rose-700 ring-rose-200",
  em_andamento: "bg-sky-100 text-sky-800 ring-sky-200",
  concluido: "bg-slate-100 text-slate-700 ring-slate-200",
  cancelado: "bg-rose-100 text-rose-700 ring-rose-200",
};

const PROVIDER_STATUS_PRIORITY: Record<ProviderBooking["status"], number> = {
  pendente: 0,
  confirmado: 1,
  em_andamento: 2,
  concluido: 3,
  cancelado: 0,
  recusado: 1,
};

const sortProviderBookings = (bookings: ProviderBooking[]) => {
  return [...bookings].sort((a, b) => {
    const priorityDiff =
      PROVIDER_STATUS_PRIORITY[a.status] - PROVIDER_STATUS_PRIORITY[b.status];

    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    return (
      new Date(b.data_hora_inicio).getTime() -
      new Date(a.data_hora_inicio).getTime()
    );
  });
};

const isProviderPendingBooking = (booking: ProviderBooking) =>
  booking.status === "pendente";

const isProviderCancelledBooking = (booking: ProviderBooking) =>
  booking.status === "cancelado" || booking.status === "recusado";

const getProviderBookingCardColors = (status: ProviderBooking["status"]) => {
  if (status === "pendente") {
    return "border-amber-200 bg-amber-50";
  }

  if (status === "cancelado" || status === "recusado") {
    return "border-rose-200 bg-rose-50";
  }

  if (status === "concluido") {
    return "border-emerald-200 bg-emerald-50";
  }

  return "border-slate-200 bg-white";
};

const formatBookingDate = (iso: string) => {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const DashboardLayout = ({
  children,
  variant = "home",
}: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isAuthenticated, login, logout, updateSession } = useAuth();
  const isProviderView = isAuthenticated && session?.role === "estabelecimento";
  const isServicesPage = variant === "services";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isEstablishmentModalOpen, setIsEstablishmentModalOpen] =
    useState(false);
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [bookingEstablishment, setBookingEstablishment] =
    useState<BookingEstablishment | null>(null);
  const [pendingEstablishment, setPendingEstablishment] =
    useState<BookingEstablishment | null>(null);
  const [providerBookings, setProviderBookings] = useState<ProviderBooking[]>(
    [],
  );
  const [providerBookingsLoading, setProviderBookingsLoading] = useState(false);
  const [providerStatusUpdating, setProviderStatusUpdating] = useState<
    string | null
  >(null);
  const fixedSearchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isProviderView) {
      setEstablishments([]);
      return;
    }

    const fetchEstablishments = async () => {
      try {
        const response = await api.get(
          "/v1/estabelecimentos/listar_estabelecimentos",
        );
        const data = response.data as unknown;
        const items = Array.isArray(data)
          ? data
          : ((data as { data?: Establishment[] }).data ?? []);

        setEstablishments(items.filter((item) => item.ativo));
      } catch {
        setEstablishments([]);
      }
    };

    fetchEstablishments();
  }, [isProviderView]);

  useEffect(() => {
    if (!isProviderView || !session?.id) {
      setProviderBookings([]);
      return;
    }

    const fetchProviderBookings = async () => {
      setProviderBookingsLoading(true);

      try {
        const response = await api.get(
          `/v1/agendamentos/estabelecimento/${session.id}`,
        );
        const bookings = Array.isArray(response.data)
          ? (response.data as ProviderBooking[])
          : [];

        setProviderBookings(sortProviderBookings(bookings));
      } catch {
        setProviderBookings([]);
      } finally {
        setProviderBookingsLoading(false);
      }
    };

    fetchProviderBookings();
  }, [isProviderView, session?.id]);

  useEffect(() => {
    if (!isAuthenticated || session?.role !== "cliente") {
      return;
    }

    const hydrateClientSession = async () => {
      try {
        const response = await api.get("/v1/clientes/me");
        const client = response.data as ClienteSummary;

        const preferredName =
          client.nome_tratamento?.trim() || client.nome_usuario;

        updateSession({
          nome: preferredName,
          foto_perfil_url: client.foto_perfil_url ?? null,
        });
      } catch {
        // ignore
      }
    };

    hydrateClientSession();
  }, [isAuthenticated, session?.id, session?.role, updateSession]);

  useEffect(() => {
    const state = location.state as {
      openLogin?: boolean;
    } | null;

    if (state?.openLogin) {
      setIsAuthModalOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const searchElement = fixedSearchRef.current;

      if (!searchElement) {
        setShowHeaderSearch(false);
        return;
      }

      const rect = searchElement.getBoundingClientRect();
      setShowHeaderSearch(rect.bottom <= 80);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleProviderBookingStatusUpdate = async (
    bookingId: string,
    nextStatus: ProviderBooking["status"],
  ) => {
    setProviderStatusUpdating(bookingId);

    try {
      const payload: {
        status: ProviderBooking["status"];
        motivo_recusa?: string | null;
      } = {
        status: nextStatus,
      };

      if (nextStatus === "recusado") {
        payload.motivo_recusa = "Recusado pelo estabelecimento.";
      }

      await api.patch(`/v1/agendamentos/${bookingId}/status`, payload);

      setProviderBookings((currentBookings) => {
        const updated = currentBookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: nextStatus }
            : booking,
        );

        return sortProviderBookings(updated);
      });
    } catch {
      // ignore
    } finally {
      setProviderStatusUpdating(null);
    }
  };

  const handleProviderBookingFinalize = async (bookingId: string) => {
    setProviderStatusUpdating(bookingId);

    try {
      await api.post(
        `/v1/agendamentos/${bookingId}/encerrar`,
        {},
        {
          params: {
            custo_final: 0,
          },
        },
      );

      setProviderBookings((currentBookings) => {
        const updated = currentBookings.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: "concluido" as const }
            : booking,
        );

        return sortProviderBookings(updated);
      });
    } catch {
      // ignore
    } finally {
      setProviderStatusUpdating(null);
    }
  };

  const serviceCategories = useMemo(() => {
    const categories = Array.from(
      new Set(
        establishments
          .map((item) => item.categoria?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((a, b) => a.localeCompare(b));

    const categoryStyles: Record<string, Omit<CategoryMeta, "icon">> = {
      Beleza: { name: "Beleza", color: "from-pink-500 to-rose-500" },
      "Bem-estar": {
        name: "Bem-estar",
        color: "from-emerald-500 to-teal-500",
      },
      Saúde: { name: "Saúde", color: "from-sky-500 to-cyan-500" },
      Massagens: {
        name: "Massagens",
        color: "from-amber-500 to-orange-500",
      },
      Pets: { name: "Pets", color: "from-lime-500 to-green-500" },
      Moda: {
        name: "Moda",
        color: "from-violet-500 to-fuchsia-500",
      },
    };

    return categories.map((category) => {
      const fallback = {
        name: category,
        color: "from-slate-500 to-slate-600",
      };

      return {
        ...(categoryStyles[category] ?? fallback),
        icon: getCategoryIcon(category),
      };
    });
  }, [establishments]);

  const toggleCategory = (categoryName: string) => {
    setActiveCategory((current) =>
      current === categoryName ? null : categoryName,
    );

    requestAnimationFrame(() => {
      const establishmentSection = document.getElementById("categories-title");
      if (establishmentSection) {
        establishmentSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  };

  const content = Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child;
    }

    return cloneElement(
      child as ReactElement<{
        selectedCategory?: string | null;
        searchQuery?: string;
        onRequestBooking?: (data: BookingEstablishment) => void;
      }>,
      {
        selectedCategory: activeCategory,
        searchQuery,
        onRequestBooking: (est: BookingEstablishment) => {
          if (!isAuthenticated) {
            setPendingEstablishment(est);
            setIsAuthModalOpen(true);
            return;
          }
          if (session?.role === "estabelecimento") {
            navigate("/perfil");
            return;
          }
          setBookingEstablishment(est);
        },
      },
    );
  });

  const providerBookingColumns = useMemo(() => {
    const pending = providerBookings.filter(isProviderPendingBooking);
    const cancelled = providerBookings.filter(isProviderCancelledBooking);
    const active = providerBookings.filter(
      (booking) =>
        booking.status === "confirmado" || booking.status === "em_andamento",
    );
    const completed = providerBookings.filter(
      (booking) => booking.status === "concluido",
    );

    return {
      left: {
        pending: sortProviderBookings(pending),
        cancelled: sortProviderBookings(cancelled),
      },
      right: {
        active: sortProviderBookings(active),
        completed: sortProviderBookings(completed),
      },
    };
  }, [providerBookings]);

  const renderProviderBookingCard = (booking: ProviderBooking) => (
    <div
      key={booking.id}
      className={`rounded-2xl border p-4 ${getProviderBookingCardColors(booking.status)}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            {booking.tratamento}
          </p>
          <p className="text-sm text-slate-600">
            {booking.profissional_envolvido}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatBookingDate(booking.data_hora_inicio)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${PROVIDER_STATUS_COLORS[booking.status]}`}
          >
            {PROVIDER_STATUS_LABELS[booking.status]}
          </span>

          {booking.status === "pendente" ? (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={providerStatusUpdating === booking.id}
                onClick={() =>
                  handleProviderBookingStatusUpdate(booking.id, "recusado")
                }
                aria-label="Recusar agendamento"
                title="Recusar agendamento"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
              <button
                type="button"
                disabled={providerStatusUpdating === booking.id}
                onClick={() =>
                  handleProviderBookingStatusUpdate(booking.id, "confirmado")
                }
                aria-label="Confirmar agendamento"
                title="Confirmar agendamento"
                className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          ) : booking.status === "confirmado" ? (
            <button
              type="button"
              disabled={providerStatusUpdating === booking.id}
              onClick={() =>
                handleProviderBookingStatusUpdate(booking.id, "em_andamento")
              }
              className="flex items-center gap-1 rounded-md bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
            >
              <Play className="h-3.5 w-3.5" strokeWidth={2} />
              Iniciar atendimento
            </button>
          ) : booking.status === "em_andamento" ? (
            <button
              type="button"
              disabled={providerStatusUpdating === booking.id}
              onClick={() => handleProviderBookingFinalize(booking.id)}
              className="rounded-md bg-sky-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
            >
              {providerStatusUpdating === booking.id
                ? "Finalizando..."
                : "Finalizar"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Passamos a função de abrir para o Header */}
      <Header
        onOpenMenu={() => setIsSidebarOpen(true)}
        loggedClientName={session?.nome ?? null}
        loggedClientPhotoUrl={session?.foto_perfil_url ?? null}
        loggedClientRole={session?.role ?? null}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onLogout={() => {
          logout();
          navigate("/");
        }}
        showSearchBar={showHeaderSearch}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        hideMobileSearchToggle={isServicesPage}
        compactUserProfile={isServicesPage && showHeaderSearch}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthChange={(nextSession) => {
          if (nextSession) {
            login(nextSession);
            setIsAuthModalOpen(false);
            if (nextSession.role === "cliente" && pendingEstablishment) {
              setBookingEstablishment(pendingEstablishment);
            }
            setPendingEstablishment(null);
          }
        }}
      />

      <EstablishmentModal
        isOpen={isEstablishmentModalOpen}
        onClose={() => setIsEstablishmentModalOpen(false)}
        onOpenLogin={() => setIsAuthModalOpen(true)}
      />

      <BookingModal
        isOpen={Boolean(bookingEstablishment)}
        onClose={() => setBookingEstablishment(null)}
        establishment={bookingEstablishment}
      />

      {/* Passamos o estado e a função de fechar para o Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenLogin={() => setIsAuthModalOpen(true)}
      />

      {/* O conteúdo da página */}
      <main className="flex-1">
        {isProviderView ? (
          <section className="bg-linear-to-b from-blue-50 to-white px-4 py-10 sm:py-14">
            <div className="mx-auto grid w-full max-w-5xl gap-6">
              <div className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                  Painel do Prestador
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-blue-950 sm:text-4xl">
                  Bem-vindo, {session?.nome}
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
                  Aqui você acompanha seus agendamentos e mantém seu perfil
                  atualizado. A listagem e busca de estabelecimentos fica oculta
                  no acesso de prestador.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/perfil?tab=bookings"
                    className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                  >
                    Abrir agenda
                  </Link>
                  <Link
                    to="/perfil"
                    className="rounded-md border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                  >
                    Ver meu perfil
                  </Link>
                </div>
              </div>

              <div className="hidden gap-4 sm:grid-cols-2">
                <Link
                  to="/perfil?tab=bookings"
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <p className="text-sm font-semibold text-slate-900">Agenda</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Visualize solicitações pendentes e atualize status dos
                    atendimentos.
                  </p>
                </Link>

                <Link
                  to="/perfil"
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:bg-slate-50"
                >
                  <p className="text-sm font-semibold text-slate-900">Perfil</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Atualize seus dados e foto para manter sua apresentação em
                    dia.
                  </p>
                </Link>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Agenda
                    </p>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Próximos agendamentos
                    </h2>
                  </div>
                  <Link
                    to="/perfil?tab=bookings"
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Ver todos
                  </Link>
                </div>

                {providerBookingsLoading ? (
                  <p className="text-sm text-slate-500">
                    Carregando agendamentos...
                  </p>
                ) : providerBookings.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nenhum agendamento encontrado no momento.
                  </p>
                ) : (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-4">
                      <section className="flex h-80 flex-col rounded-2xl border border-slate-200 bg-white p-4">
                        <h3 className="text-sm font-semibold text-amber-900">
                          Pendentes de aprovação
                        </h3>
                        <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                          {providerBookingColumns.left.pending.length ? (
                            providerBookingColumns.left.pending.map(
                              renderProviderBookingCard,
                            )
                          ) : (
                            <p className="text-sm text-slate-500">
                              Nenhum agendamento pendente.
                            </p>
                          )}
                        </div>
                      </section>

                      <section className="flex h-80 flex-col rounded-2xl border border-slate-200 bg-white p-4">
                        <h3 className="text-sm font-semibold text-rose-900">
                          Cancelados
                        </h3>
                        <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                          {providerBookingColumns.left.cancelled.length ? (
                            providerBookingColumns.left.cancelled.map(
                              renderProviderBookingCard,
                            )
                          ) : (
                            <p className="text-sm text-slate-500">
                              Nenhum agendamento cancelado.
                            </p>
                          )}
                        </div>
                      </section>
                    </div>

                    <div className="space-y-4">
                      <section className="flex h-80 flex-col rounded-2xl border border-slate-200 bg-white p-4">
                        <h3 className="text-sm font-semibold text-sky-900">
                          A serem realizados
                        </h3>
                        <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                          {providerBookingColumns.right.active.length ? (
                            providerBookingColumns.right.active.map(
                              renderProviderBookingCard,
                            )
                          ) : (
                            <p className="text-sm text-slate-500">
                              Nenhum agendamento a realizar.
                            </p>
                          )}
                        </div>
                      </section>

                      <section className="flex h-80 flex-col rounded-2xl border border-slate-200 bg-white p-4">
                        <h3 className="text-sm font-semibold text-emerald-900">
                          Concluídos
                        </h3>
                        <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                          {providerBookingColumns.right.completed.length ? (
                            providerBookingColumns.right.completed.map(
                              renderProviderBookingCard,
                            )
                          ) : (
                            <p className="text-sm text-slate-500">
                              Nenhum agendamento concluído.
                            </p>
                          )}
                        </div>
                      </section>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : isServicesPage ? (
          <section className="bg-linear-to-b from-emerald-50 via-slate-50 to-white px-4 py-10 sm:py-14">
            <div className="mx-auto w-full max-w-6xl">
              <div className="mb-8 grid gap-6 border-b border-emerald-100 pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)] lg:items-end">
                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    Catálogo de serviços
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold text-emerald-950 sm:text-4xl">
                    Encontre o atendimento ideal
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    Pesquise por serviço, estabelecimento, categoria ou
                    localização e compare os profissionais disponíveis.
                  </p>
                </div>

                <div ref={fixedSearchRef}>
                  <SearchBar
                    value={searchQuery}
                    onSearch={setSearchQuery}
                    autoFocusInput
                  />
                </div>
              </div>

              <div className="mb-8">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2
                    id="categories-title"
                    className="text-base font-semibold text-slate-900"
                  >
                    Filtrar por categoria
                  </h2>
                  {activeCategory ? (
                    <button
                      type="button"
                      onClick={() => setActiveCategory(null)}
                      className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Limpar filtro
                    </button>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {serviceCategories.map((category) => {
                    const isActive = activeCategory === category.name;

                    return (
                      <button
                        key={category.name}
                        type="button"
                        onClick={() => toggleCategory(category.name)}
                        className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                          isActive
                            ? "border-emerald-600 bg-emerald-700 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                        }`}
                      >
                        <category.icon className="h-4 w-4" strokeWidth={2} />
                        {category.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid w-full gap-8">{content}</div>
            </div>
          </section>
        ) : (
          <>
            <section className="bg-linear-to-b from-gray-100 to-white pt-20 pb-10">
              <div className="container mx-auto px-4 text-center">
                <p className="inline-block bg-emerald-100 text-emerald-800 rounded-full px-3 py-1 text-sm mb-6">
                  <span className="text-amber-500">✦</span> Leve uma vida Leve
                </p>

                <h1 className="text-4xl md:text-6xl font-serif font-semibold text-emerald-900 mb-4">
                  Encontre o seu momento de{" "}
                  <span className="text-amber-500 italic">bem-estar</span>
                </h1>

                <p className="text-slate-600 max-w-2xl mx-auto mb-6">
                  Conectamos voce aos melhores profissionais. Explore servicos e
                  conheca as descricoes de cada atendimento antes do login.
                </p>

                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => navigate("/servicos")}
                    className="bg-emerald-700 text-white rounded-md px-6 py-3 hover:bg-emerald-800 cursor-pointer"
                  >
                    Explorar Serviços
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEstablishmentModalOpen(true)}
                    className="border border-emerald-700 text-emerald-700 rounded-md px-6 py-3 hover:bg-emerald-50 cursor-pointer"
                  >
                    Sou Prestador
                  </button>
                </div>

                <div
                  ref={fixedSearchRef}
                  className="mx-auto mt-8 max-w-5xl hidden md:block"
                >
                  <SearchBar value={searchQuery} onSearch={setSearchQuery} />
                </div>

                <div className="mt-10 mb-5 mx-auto max-w-5/6">
                  <h2
                    className="text-2xl md:text-3xl font-serif font-semibold text-emerald-900 mb-2"
                    id="categories-title"
                  >
                    Categorias
                  </h2>
                  <div className="w-full overflow-x-auto pb-2 pt-5 scrollbar-none">
                    <div
                      className="mx-auto flex w-max items-center justify-center gap-3 snap-x snap-mandatory scroll-px-4"
                      id="services"
                    >
                      {serviceCategories.map((category) => {
                        const isActive = activeCategory === category.name;

                        return (
                          <button
                            key={category.name}
                            type="button"
                            onClick={() => toggleCategory(category.name)}
                            className={`flex h-26 w-26 min-w-22 shrink-0 snap-start flex-col items-center justify-center rounded-2xl border p-2 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                              isActive
                                ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
                                : "cursor-pointer border-emerald-100 bg-white/90"
                            }`}
                          >
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br ${category.color} text-white shadow-sm`}
                            >
                              <category.icon
                                className="h-4 w-4"
                                strokeWidth={2}
                              />
                            </div>
                            <p
                              className={`mt-2 text-[11px] font-semibold leading-tight truncate ${
                                isActive ? "text-emerald-800" : "text-slate-800"
                              }`}
                            >
                              {category.name}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div
              id="establishment-list"
              className="p-4 flex justify-center items-center"
            >
              <div className="grid w-full gap-8 ">{content}</div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
