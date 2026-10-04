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
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Check,
  CircleUser,
  IdCardLanyard,
  Loader2,
  Maximize2,
  Play,
  X,
} from "lucide-react";
import { AuthModal } from "../components/AuthModal";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { EstablishmentModal } from "../components/EstablishmentModal";
import { Sidebar } from "../components/Sidebar";
import { BookingModal } from "../components/BookingModal";
import type { BookingEstablishment } from "../components/BookingForm";
import SearchBar from "../components/SearchBar";
import api from "../services/api";
import {
  CATEGORY_OPTIONS,
  getCategoryColor,
  getCategoryIcon,
} from "../utils/categoryIcons";
import { EstablishmentNavigation } from "../components/EstablishmentNavigation";
import { ProfilePage } from "../pages/ProfilePage";

interface LayoutProps {
  children?: ReactNode;
  variant?: "home" | "services";
}

interface Establishment {
  id: string;
  categoria: string;
  ativo: boolean;
}

interface ProviderBooking {
  id: string;
  cliente_id?: string;
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
  em_andamento: 0,
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

  if (status === "confirmado") {
    return "border-emerald-200 bg-emerald-50";
  }

  if (status === "em_andamento") {
    return "border-slate-200 bg-white";
  }

  if (status === "concluido") {
    return "border-blue-200 bg-blue-50";
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

const GOOGLE_CALENDAR_PENDING_KEY = "googleCalendarConnecting";
const getGoogleCalendarStorageKey = (establishmentId: string) =>
  `googleCalendarConnected:${establishmentId}`;

export const DashboardLayout = ({
  children,
  variant = "home",
}: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    session,
    isAuthenticated,
    isLoggingOut,
    login,
    logout,
    completeLogout,
    updateSession,
  } = useAuth();
  const isProviderView = isAuthenticated && session?.role === "estabelecimento";
  const providerTab = new URLSearchParams(location.search).get("providerTab");
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
  const [providerClientNames, setProviderClientNames] = useState<
    Record<string, string>
  >({});
  const [providerBookingsLoading, setProviderBookingsLoading] = useState(false);
  const [providerStatusUpdating, setProviderStatusUpdating] = useState<
    string | null
  >(null);
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] =
    useState(false);
  const [isConnectingGoogleCalendar, setIsConnectingGoogleCalendar] =
    useState(false);
  const [googleCalendarError, setGoogleCalendarError] = useState<string | null>(
    null,
  );
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

        const clientIds = Array.from(
          new Set(
            bookings
              .map((booking) => booking.cliente_id)
              .filter((id): id is string => Boolean(id)),
          ),
        );

        const clientNames = await Promise.all(
          clientIds.map(async (clientId) => {
            try {
              const clientResponse = await api.get(`/v1/clientes/${clientId}`);
              const client = clientResponse.data as ClienteSummary;
              const resolvedName =
                client.nome_tratamento?.trim() || client.nome_usuario;
              return [clientId, resolvedName] as const;
            } catch {
              return [clientId, "Cliente não identificado"] as const;
            }
          }),
        );

        setProviderClientNames(Object.fromEntries(clientNames));
        setProviderBookings(sortProviderBookings(bookings));
      } catch {
        setProviderBookings([]);
        setProviderClientNames({});
      } finally {
        setProviderBookingsLoading(false);
      }
    };

    fetchProviderBookings();
  }, [isProviderView, session?.id]);

  useEffect(() => {
    if (!isProviderView || !session?.id) {
      setIsGoogleCalendarConnected(false);
      return;
    }

    const pendingEstablishmentId = window.sessionStorage.getItem(
      GOOGLE_CALENDAR_PENDING_KEY,
    );

    if (pendingEstablishmentId === session.id) {
      window.sessionStorage.removeItem(GOOGLE_CALENDAR_PENDING_KEY);
      window.localStorage.setItem(
        getGoogleCalendarStorageKey(session.id),
        "true",
      );
    }

    setIsGoogleCalendarConnected(
      window.localStorage.getItem(getGoogleCalendarStorageKey(session.id)) ===
        "true",
    );
  }, [isProviderView, session?.id]);

  const handleConnectGoogleCalendar = async () => {
    if (!session?.id) {
      return;
    }

    setIsConnectingGoogleCalendar(true);
    setGoogleCalendarError(null);

    try {
      const response = await api.get(
        "/v1/estabelecimentos/google-calendar/conectar",
      );
      const data = response.data as { authorization_url?: string };

      if (!data.authorization_url) {
        throw new Error("URL de autorização não recebida.");
      }

      window.sessionStorage.setItem(GOOGLE_CALENDAR_PENDING_KEY, session.id);
      window.location.href = data.authorization_url;
    } catch {
      setGoogleCalendarError(
        "Não foi possível iniciar a conexão com o Google Calendar. Tente novamente.",
      );
      setIsConnectingGoogleCalendar(false);
    }
  };

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
    if (isLoggingOut && location.pathname === "/") {
      completeLogout();
      return;
    }

    const state = location.state as {
      openLogin?: boolean;
    } | null;

    if (state?.openLogin) {
      setIsAuthModalOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [
    completeLogout,
    isLoggingOut,
    location.pathname,
    location.state,
    navigate,
  ]);

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
    const availableCategories = new Set(
      establishments.map((item) => item.categoria?.trim()),
    );

    return CATEGORY_OPTIONS.filter((category) =>
      availableCategories.has(category),
    ).map((category) => ({
      name: category,
      color: getCategoryColor(category),
      icon: getCategoryIcon(category),
    }));
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
        onClearCategoryFilter?: () => void;
      }>,
      {
        selectedCategory: activeCategory,
        searchQuery,
        onClearCategoryFilter: () => setActiveCategory(null),
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
      className={`relative flex h-28 shrink-0 flex-col justify-between rounded-2xl border p-3 max-md:h-32 ${getProviderBookingCardColors(booking.status)}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 max-md:pr-24">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-800">
              {booking.tratamento}
            </p>
            {booking.cliente_id && (
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <span className="font-medium">
                  <CircleUser
                    className="h-4 w-4 text-slate-700"
                    strokeWidth={1.5}
                  />
                </span>
                <span className="font-medium text-slate-700">
                  {providerClientNames[booking.cliente_id] ||
                    "Cliente não identificado"}
                </span>
              </div>
            )}
          </div>

          <p className="mt-1 flex gap-1 text-xs text-slate-500">
            <CalendarDays
              className="h-4 w-4 text-slate-500"
              strokeWidth={1.5}
            />{" "}
            {formatBookingDate(booking.data_hora_inicio)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5 max-md:w-full max-md:pt-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 max-md:absolute max-md:right-3 max-md:top-3 ${PROVIDER_STATUS_COLORS[booking.status]}`}
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
                className="flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 disabled:opacity-60"
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
                className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-60"
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
              className="flex items-center gap-1 rounded-md bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60 max-md:w-full max-md:justify-center"
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

      <div className="flex items-center justify-end gap-1 text-right text-xs">
        <span className="font-medium text-slate-500">
          <IdCardLanyard className="h-4 w-4 text-slate-500" strokeWidth={1.5} />
        </span>
        <span className="font-medium text-slate-500">
          {booking.profissional_envolvido}
        </span>
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
        loggedClientPersonType={session?.tipo_pessoa}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onLogout={() => {
          navigate("/", { replace: true, state: null });
          logout();
        }}
        showSearchBar={showHeaderSearch}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
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
        onLoginSuccess={(nextSession) => {
          login(nextSession);
          setIsEstablishmentModalOpen(false);
        }}
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
              <div className="flex flex-wrap items-center gap-3">
                <EstablishmentNavigation />
                {providerTab === "agenda" && isGoogleCalendarConnected ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                    <Check className="h-3.5 w-3.5" strokeWidth={2} />
                    Sincronizado com Google Calendar
                  </span>
                ) : null}
              </div>

              {!isGoogleCalendarConnected ? (
                <div className="flex flex-col gap-4 rounded-3xl border border-blue-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Calendar className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Google Calendar
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Autorize a Levvel a criar eventos na agenda Google deste
                        estabelecimento.
                      </p>
                      {googleCalendarError ? (
                        <p className="mt-1 text-xs font-medium text-rose-600">
                          {googleCalendarError}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConnectGoogleCalendar}
                    disabled={isConnectingGoogleCalendar}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isConnectingGoogleCalendar ? (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        strokeWidth={2}
                      />
                    ) : null}
                    Conectar Google Calendar
                  </button>
                </div>
              ) : null}

              {providerTab === "profile" || providerTab === "agenda" ? (
                <ProfilePage
                  embedded
                  initialTab={providerTab === "agenda" ? "bookings" : "profile"}
                />
              ) : null}
              {providerTab !== "profile" && providerTab !== "agenda" ? (
                <div className="fade-up-mount rounded-3xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    Painel do Prestador
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold text-blue-950 sm:text-4xl">
                    Bem-vindo, {session?.nome}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
                    Aqui você acompanha seus agendamentos e mantém seu perfil
                    atualizado. A listagem e busca de estabelecimentos fica
                    oculta no acesso de prestador.
                  </p>
                </div>
              ) : null}

              {providerTab !== "profile" && providerTab !== "agenda" ? (
                <>
                  <div className="fade-up-mount fade-up-mount-delay-1 hidden gap-4 sm:grid-cols-2">
                    <Link
                      to="/?providerTab=agenda"
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        Agenda
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Visualize solicitações pendentes e atualize status dos
                        atendimentos.
                      </p>
                    </Link>

                    <Link
                      to="/?providerTab=profile"
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        Perfil
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Atualize seus dados e foto para manter sua apresentação
                        em dia.
                      </p>
                    </Link>
                  </div>

                  <div className="fade-up-mount fade-up-mount-delay-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-lg font-semibold uppercase tracking-wide text-slate-900">
                            Agenda
                          </p>
                          {isGoogleCalendarConnected ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                              <Check className="h-3 w-3" strokeWidth={2} />
                              Sincronizado com Google Calendar
                            </span>
                          ) : null}
                        </div>
                        <h2 className="text-sm font-medium text-slate-500">
                          Próximos agendamentos
                        </h2>
                      </div>
                      <Link
                        to="/?providerTab=agenda"
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
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-semibold text-amber-900">
                                Pendentes de aprovação
                              </h3>
                              <Link
                                to="/?providerTab=agenda&agendaStatus=pendente"
                                aria-label="Abrir pendentes de aprovação na agenda"
                                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                              >
                                <Maximize2
                                  className="h-4 w-4"
                                  strokeWidth={1.8}
                                />
                              </Link>
                            </div>
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
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-semibold text-rose-900">
                                Cancelados
                              </h3>
                              <Link
                                to="/?providerTab=agenda&agendaStatus=cancelado"
                                aria-label="Abrir cancelados na agenda"
                                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                              >
                                <Maximize2
                                  className="h-4 w-4"
                                  strokeWidth={1.8}
                                />
                              </Link>
                            </div>
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
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-semibold text-sky-900">
                                Próximos agendamentos
                              </h3>
                              <Link
                                to="/?providerTab=agenda&agendaStatus=upcoming"
                                aria-label="Abrir próximos agendamentos na agenda"
                                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                              >
                                <Maximize2
                                  className="h-4 w-4"
                                  strokeWidth={1.8}
                                />
                              </Link>
                            </div>
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
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-semibold text-blue-900">
                                Concluídos
                              </h3>
                              <Link
                                to="/?providerTab=agenda&agendaStatus=concluido"
                                aria-label="Abrir concluídos na agenda"
                                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                              >
                                <Maximize2
                                  className="h-4 w-4"
                                  strokeWidth={1.8}
                                />
                              </Link>
                            </div>
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
                </>
              ) : null}
            </div>
          </section>
        ) : isServicesPage ? (
          <section className="bg-linear-to-b from-emerald-50 via-slate-50 to-white px-4 py-10 sm:py-14">
            <div className="mx-auto w-full max-w-6xl">
              <div className="mb-8 grid gap-6 border-b border-emerald-100 sm:pb-8 pb-2 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)] lg:items-end">
                <div>
                  <Link
                    to="/"
                    className="mb-5 inline-flex items-center gap-1.5 py-1 text-sm font-medium text-slate-600 transition-colors hover:text-emerald-700 hover:underline hover:underline-offset-4"
                  >
                    <ArrowLeft size={15} aria-hidden="true" />
                    Voltar para início
                  </Link>
                  <p className="fade-up-mount text-sm font-semibold text-emerald-700">
                    Catálogo de serviços
                  </p>
                  <h1 className="fade-up-mount fade-up-mount-delay-1 mt-2 text-3xl font-semibold text-emerald-950 sm:text-4xl">
                    Encontre o atendimento ideal
                  </h1>
                  <p className="fade-up-mount fade-up-mount-delay-2 mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    Pesquise por serviço, estabelecimento, categoria ou
                    localização e compare os profissionais disponíveis.
                  </p>
                </div>

                <div
                  className="fade-up-mount fade-up-mount-delay-2"
                  ref={fixedSearchRef}
                >
                  <SearchBar
                    value={searchQuery}
                    onSearch={setSearchQuery}
                    className="sm:block hidden"
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
                <p className="fade-up-mount inline-block bg-emerald-100 text-emerald-800 rounded-full px-3 py-1 text-sm mb-6">
                  <span className="text-amber-500">✦</span> Leve uma vida Leve
                </p>

                <h1 className="fade-up-mount fade-up-mount-delay-1 text-4xl md:text-6xl font-serif font-semibold text-emerald-900 mb-4">
                  Encontre o seu momento de{" "}
                  <span className="text-amber-500 italic">bem-estar</span>
                </h1>

                <p className="fade-up-mount fade-up-mount-delay-2 text-slate-600 max-w-2xl mx-auto mb-6">
                  Conectamos voce aos melhores profissionais. Explore servicos e
                  conheca as descricoes de cada atendimento antes do login.
                </p>

                <div className="fade-up-mount fade-up-mount-delay-3 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => navigate("/servicos")}
                    className="bg-emerald-700 text-white rounded-md px-6 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-lg cursor-pointer"
                  >
                    Explorar Serviços
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/sou-prestador")}
                    className="border border-emerald-700 text-emerald-700 rounded-md px-6 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 cursor-pointer"
                  >
                    Sou Prestador
                  </button>
                </div>

                <div
                  ref={fixedSearchRef}
                  className="fade-up-mount fade-up-mount-delay-4 mx-auto mt-8 max-w-5xl hidden md:block"
                >
                  <SearchBar value={searchQuery} onSearch={setSearchQuery} />
                </div>

                <div
                  className="fade-up-mount fade-up-mount-delay-4 mx-auto mt-10 mb-5 max-w-5xl px-2"
                  id="services"
                >
                  <div className="mb-4 flex items-center justify-center">
                    <h2
                      className="text-2xl font-serif font-semibold text-emerald-900 md:text-3xl"
                      id="categories-title"
                    >
                      Categorias
                    </h2>
                  </div>
                  <div className="overflow-x-auto snap-x snap-mandatory scrollbar-none sm:overflow-visible">
                    <div className="flex w-max min-w-full snap-x snap-mandatory gap-3 pb-2 sm:grid sm:w-full sm:grid-cols-3 sm:pb-0 lg:grid-cols-5">
                      {serviceCategories.map((category) => {
                        const isActive = activeCategory === category.name;

                        return (
                          <button
                            key={category.name}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => toggleCategory(category.name)}
                            className={`group flex min-h-32 w-36 shrink-0 snap-start flex-col items-center justify-start gap-3 rounded-2xl border px-3 pt-5 pb-4 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:w-auto sm:shrink ${
                              isActive
                                ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
                                : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
                            }`}
                          >
                            <span
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${category.color} text-white shadow-md transition-transform group-hover:scale-105`}
                            >
                              <category.icon
                                className="h-5 w-5"
                                strokeWidth={2}
                                aria-hidden="true"
                              />
                            </span>
                            <span
                              className={`flex min-h-10 w-full items-center justify-center text-xs font-semibold leading-snug ${
                                isActive
                                  ? "text-emerald-900"
                                  : "text-slate-700"
                              }`}
                            >
                              {category.name}
                            </span>
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
