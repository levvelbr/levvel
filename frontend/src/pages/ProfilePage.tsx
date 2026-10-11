import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  CalendarDays,
  Check,
  ClockFading,
  Contact,
  Filter,
  ArrowLeft,
  RotateCcw,
  X,
  ZoomIn,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "../components/AuthModal";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { EstablishmentNavigation } from "../components/EstablishmentNavigation";
import Input from "../components/Input";
import {
  MultiValueInput,
  btnOutline,
  btnPrimary,
  ScheduleEditor,
} from "../components/ProviderProfileFields";
import {
  buildSchedulePayload,
  parseSchedulePayload,
  weekDays,
  type WeeklySchedule,
} from "../utils/schedule";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { maskCnpj, maskCpf, maskPhone } from "../utils/documentMasks";
import { getApiErrorMessage } from "../utils/apiErrors";
import api from "../services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClienteProfile {
  id: string;
  nome_usuario: string;
  nome_tratamento: string | null;
  cpf: string;
  data_nascimento: string;
  genero: string | null;
  email: string | null;
  forma_pagamento_preferida: string | null;
  localizacao_inicial: string | null;
  foto_perfil_url: string | null;
  criado_em: string;
}

interface EstabelecimentoProfile {
  id: string;
  nome_estabelecimento: string;
  responsavel: string;
  telefone: string;
  email: string;
  localizacao: string;
  foto_estabelecimento_url: string | null;
  tipo_pessoa?: "juridica" | "autonomo" | null;
  cpf?: string | null;
  cnpj: string | null;
  razao_social: string | null;
  categoria: string;
  instagram: string | null;
  servicos_oferecidos: string[];
  tecnicas_utilizadas: string[];
  produtos_aplicados: string[];
  profissionais_envolvidos: string[];
  horario_funcionamento?: Record<string, unknown> | null;
  ativo: boolean;
  criado_em: string;
}

interface Agendamento {
  id: string;
  estabelecimento_id: string;
  cliente_id: string;
  profissional_envolvido: string;
  tratamento: string;
  tecnica: string | null;
  produto: string | null;
  data_hora_inicio: string;
  duracao_estimada_minutos: number;
  status:
    | "pendente"
    | "confirmado"
    | "recusado"
    | "em_andamento"
    | "concluido"
    | "cancelado";
  motivo_recusa: string | null;
  custo_final: number;
  criado_em: string;
}

interface ClienteAgenda {
  id: string;
  nome_usuario: string;
  nome_tratamento: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<Agendamento["status"], string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  recusado: "Recusado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

const STATUS_COLORS: Record<Agendamento["status"], string> = {
  pendente: "bg-amber-100 text-amber-800",
  confirmado: "bg-emerald-100 text-emerald-800",
  recusado: "bg-rose-100 text-rose-700",
  em_andamento: "bg-sky-100 text-sky-800",
  concluido: "bg-slate-100 text-slate-700",
  cancelado: "bg-slate-100 text-slate-400",
};

const PROVIDER_STATUS_COLORS: Record<Agendamento["status"], string> = {
  pendente: "bg-amber-100 text-amber-800",
  confirmado: "bg-emerald-100 text-emerald-800",
  recusado: "bg-rose-100 text-rose-700",
  em_andamento: "bg-sky-100 text-sky-800",
  concluido: "bg-slate-100 text-slate-700",
  cancelado: "bg-slate-100 text-slate-400",
};

const getProviderBookingCardColors = (status: Agendamento["status"]) => {
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

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: "Dinheiro",
  cartao_debito: "Cartão de débito",
  cartao_credito: "Cartão de crédito",
  pix: "PIX",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const inputClass =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200";

const groupedInputClass =
  "h-9 w-full border-0 bg-transparent px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-0";

const bookingStatuses: Array<Agendamento["status"]> = [
  "pendente",
  "confirmado",
  "recusado",
  "em_andamento",
  "concluido",
  "cancelado",
];

const statusOrder = new Map(
  bookingStatuses.map((status, index) => [status, index]),
);

const providerInitialStatusPriority: Record<Agendamento["status"], number> = {
  pendente: 0,
  em_andamento: 1,
  confirmado: 2,
  recusado: 2,
  cancelado: 2,
  concluido: 4,
};

const sectionClass = "rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 p-6";

// ─── Component ────────────────────────────────────────────────────────────────

interface ProfilePageProps {
  embedded?: boolean;
  initialTab?: "profile" | "bookings";
}

export const ProfilePage = ({
  embedded = false,
  initialTab,
}: ProfilePageProps) => {
  const { session, logout, updateSession } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const agendaStatusParam = searchParams.get("agendaStatus");
  const isEstablishment = session?.role === "estabelecimento";
  const accentButton = isEstablishment
    ? "bg-blue-700 hover:bg-blue-800"
    : "bg-emerald-700 hover:bg-emerald-800";

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<{
    url: string;
    alt: string;
  } | null>(null);
  const [isPhotoClosing, setIsPhotoClosing] = useState(false);
  useBodyScrollLock(photoPreview !== null);

  const closePhotoPreview = () => {
    setIsPhotoClosing(true);
    window.setTimeout(() => {
      setPhotoPreview(null);
      setIsPhotoClosing(false);
    }, 220);
  };

  const openPhotoPreview = (url: string, alt: string) => {
    setIsPhotoClosing(false);
    setPhotoPreview({ url, alt });
  };

  useEscapeKey(photoPreview !== null && !isPhotoClosing, closePhotoPreview);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "bookings">(
    () =>
      initialTab ??
      (searchParams.get("tab") === "bookings" ? "bookings" : "profile"),
  );
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoUploadLoading, setPhotoUploadLoading] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  // ── Client state ────────────────────────────────────────────────────────────
  const [clientProfile, setClientProfile] = useState<ClienteProfile | null>(
    null,
  );
  const [clientLoading, setClientLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [nomeTratamento, setNomeTratamento] = useState("");
  const [genero, setGenero] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [localizacao, setLocalizacao] = useState("");
  const [email, setEmail] = useState("");
  const [novaSenha, setNovaSenha] = useState("");

  // ── Establishment state ──────────────────────────────────────────────────────
  const [estabProfile, setEstabProfile] =
    useState<EstabelecimentoProfile | null>(null);
  const [estabLoading, setEstabLoading] = useState(false);
  const [isEstabEditing, setIsEstabEditing] = useState(false);
  const [isScheduleEditorOpen, setIsScheduleEditorOpen] = useState(false);
  const [estabSaving, setEstabSaving] = useState(false);
  const [estabError, setEstabError] = useState<string | null>(null);
  const [estabSuccess, setEstabSuccess] = useState(false);
  const [estabForm, setEstabForm] = useState({
    responsavel: "",
    telefone: "",
    instagram: "",
    servicos_oferecidos: [] as string[],
    tecnicas_utilizadas: [] as string[],
    produtos_aplicados: [] as string[],
    profissionais_envolvidos: [] as string[],
  });
  const [estabSchedule, setEstabSchedule] = useState<WeeklySchedule>(() =>
    parseSchedulePayload(null),
  );

  // ── Agendamentos state ───────────────────────────────────────────────────────
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [clientesAgenda, setClientesAgenda] = useState<
    Record<string, ClienteAgenda>
  >({});
  const [agendamentosLoading, setAgendamentosLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [bookingStatusFilter, setBookingStatusFilter] = useState(
    agendaStatusParam ?? "",
  );
  const [bookingProfessionalFilter, setBookingProfessionalFilter] =
    useState("");
  const [bookingClientFilter, setBookingClientFilter] = useState("");
  const [bookingStartDate, setBookingStartDate] = useState("");
  const [bookingEndDate, setBookingEndDate] = useState("");
  const [dateSortDirection, setDateSortDirection] = useState<"asc" | "desc">(
    "desc",
  );
  const [statusSortDirection, setStatusSortDirection] = useState<
    "asc" | "desc"
  >("asc");
  const [bookingSortField, setBookingSortField] = useState<"date" | "status">(
    "date",
  );

  // ── Data fetching ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!session) return;

    if (session.role === "cliente") {
      setClientLoading(true);
      api
        .get("/v1/clientes/me")
        .then((r) => {
          const p = r.data as ClienteProfile;
          setClientProfile(p);
          setNomeTratamento(p.nome_tratamento ?? "");
          setGenero(p.genero ?? "");
          setFormaPagamento(p.forma_pagamento_preferida ?? "");
          setLocalizacao(p.localizacao_inicial ?? "");
          setEmail(p.email ?? "");
          const preferredName = p.nome_tratamento?.trim() || p.nome_usuario;
          updateSession({
            nome: preferredName,
            foto_perfil_url: p.foto_perfil_url ?? null,
          });
        })
        .catch(() => {})
        .finally(() => setClientLoading(false));
    }

    if (session.role === "estabelecimento") {
      setEstabLoading(true);
      api
        .get("/v1/estabelecimentos/me")
        .then((r) => {
          const p = r.data as EstabelecimentoProfile;
          setEstabProfile(p);
          updateSession({
            nome: p.nome_estabelecimento,
            foto_perfil_url: p.foto_estabelecimento_url ?? null,
          });
        })
        .catch(() => {})
        .finally(() => setEstabLoading(false));
    }
  }, [session?.id, session?.role, updateSession]);

  useEffect(() => {
    if (embedded && initialTab) {
      setActiveTab(initialTab);
      return;
    }

    const tab = searchParams.get("tab") === "bookings" ? "bookings" : "profile";
    setActiveTab(tab);
  }, [embedded, initialTab, searchParams]);

  useEffect(() => {
    if (!session || activeTab !== "bookings") return;

    setAgendamentosLoading(true);
    const url =
      session.role === "cliente"
        ? `/v1/agendamentos/cliente/${session.id}`
        : `/v1/agendamentos/estabelecimento/${session.id}`;

    api
      .get(url)
      .then(async (r) => {
        const bookings = r.data as Agendamento[];
        setAgendamentos(bookings);

        if (session.role !== "estabelecimento") return;

        const clientIds = [
          ...new Set(bookings.map((booking) => booking.cliente_id)),
        ];
        const clientEntries = await Promise.all(
          clientIds.map(async (clientId) => {
            try {
              const clientResponse = await api.get(`/v1/clientes/${clientId}`);
              return [clientId, clientResponse.data as ClienteAgenda] as const;
            } catch {
              return null;
            }
          }),
        );

        setClientesAgenda(
          Object.fromEntries(
            clientEntries.filter(Boolean) as Array<
              readonly [string, ClienteAgenda]
            >,
          ),
        );
      })
      .catch(() => setAgendamentos([]))
      .finally(() => setAgendamentosLoading(false));
  }, [session?.id, session?.role, activeTab]);

  const resetBookingFilters = () => {
    setBookingStatusFilter("");
    setBookingProfessionalFilter("");
    setBookingClientFilter("");
    setBookingStartDate("");
    setBookingEndDate("");
    setDateSortDirection("desc");
    setStatusSortDirection("asc");
    setBookingSortField("date");
  };

  const professionalOptions = [
    ...new Set(agendamentos.map((booking) => booking.profissional_envolvido)),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));

  const clientOptions = [
    ...new Map(
      agendamentos.map((booking) => {
        const client = clientesAgenda[booking.cliente_id];
        return [
          booking.cliente_id,
          {
            id: booking.cliente_id,
            name:
              client?.nome_tratamento?.trim() ||
              client?.nome_usuario ||
              booking.cliente_id,
          },
        ] as const;
      }),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const filteredAgendamentos = agendamentos
    .filter((booking) => {
      const bookingDate = new Date(booking.data_hora_inicio);
      const startDate = bookingStartDate
        ? new Date(`${bookingStartDate}T00:00:00`)
        : null;
      const endDate = bookingEndDate
        ? new Date(`${bookingEndDate}T23:59:59.999`)
        : null;

      return (
        (!bookingStatusFilter ||
          (bookingStatusFilter === "upcoming"
            ? booking.status === "em_andamento" ||
              booking.status === "confirmado"
            : booking.status === bookingStatusFilter)) &&
        (!bookingProfessionalFilter ||
          booking.profissional_envolvido === bookingProfessionalFilter) &&
        (!bookingClientFilter || booking.cliente_id === bookingClientFilter) &&
        (!startDate || bookingDate >= startDate) &&
        (!endDate || bookingDate <= endDate)
      );
    })
    .sort((bookingA, bookingB) => {
      if (bookingSortField === "date") {
        if (isEstablishment) {
          const statusDifference =
            providerInitialStatusPriority[bookingA.status] -
            providerInitialStatusPriority[bookingB.status];

          if (statusDifference !== 0) {
            return statusDifference;
          }
        }

        const difference =
          new Date(bookingA.data_hora_inicio).getTime() -
          new Date(bookingB.data_hora_inicio).getTime();
        return dateSortDirection === "desc" ? -difference : difference;
      }

      const difference =
        (statusOrder.get(bookingA.status) ?? 0) -
        (statusOrder.get(bookingB.status) ?? 0);
      return statusSortDirection === "desc" ? -difference : difference;
    });

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleClientUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(false);

    const body: Record<string, string | null> = {
      nome_tratamento: nomeTratamento || null,
      genero: genero || null,
      forma_pagamento_preferida: formaPagamento || null,
      localizacao_inicial: localizacao || null,
      email: email || null,
    };
    if (novaSenha) body.senha = novaSenha;

    try {
      const r = await api.patch("/v1/clientes/me/update", body);
      const updatedProfile = r.data as ClienteProfile;
      setClientProfile(updatedProfile);
      updateSession({
        nome:
          updatedProfile.nome_tratamento?.trim() || updatedProfile.nome_usuario,
      });
      setEditSuccess(true);
      setIsEditing(false);
      setNovaSenha("");
    } catch (err: unknown) {
      setEditError(
        err instanceof Error ? err.message : "Erro ao atualizar perfil.",
      );
    } finally {
      setEditLoading(false);
    }
  };

  const startEstabEdit = () => {
    if (!estabProfile) return;
    setEstabForm({
      responsavel: estabProfile.responsavel ?? "",
      telefone: maskPhone(estabProfile.telefone ?? ""),
      instagram: estabProfile.instagram ?? "",
      servicos_oferecidos: [...(estabProfile.servicos_oferecidos ?? [])],
      tecnicas_utilizadas: [...(estabProfile.tecnicas_utilizadas ?? [])],
      produtos_aplicados: [...(estabProfile.produtos_aplicados ?? [])],
      profissionais_envolvidos: [
        ...(estabProfile.profissionais_envolvidos ?? []),
      ],
    });
    setEstabSchedule(parseSchedulePayload(estabProfile.horario_funcionamento));
    setEstabError(null);
    setEstabSuccess(false);
    setIsScheduleEditorOpen(false);
    setIsEstabEditing(true);
  };

  const handleEstabUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstabError(null);
    setEstabSuccess(false);

    if (isScheduleEditorOpen) {
      setEstabError(
        "Salve a edição dos horários de funcionamento antes de salvar o perfil.",
      );
      return;
    }

    const responsavel = estabForm.responsavel.trim();
    if (responsavel.length < 2) {
      setEstabError("Informe o nome do responsável.");
      return;
    }
    if (!estabForm.telefone.trim()) {
      setEstabError("Telefone é obrigatório.");
      return;
    }
    if (!estabForm.profissionais_envolvidos.length) {
      setEstabError("Informe ao menos um profissional envolvido.");
      return;
    }
    if (!weekDays.some((day) => estabSchedule[day.key].ativo)) {
      setEstabError("Defina ao menos um dia de funcionamento.");
      return;
    }

    const payload = {
      responsavel,
      telefone: estabForm.telefone.trim(),
      instagram: estabForm.instagram.trim() || null,
      servicos_oferecidos: estabForm.servicos_oferecidos,
      tecnicas_utilizadas: estabForm.tecnicas_utilizadas,
      produtos_aplicados: estabForm.produtos_aplicados,
      profissionais_envolvidos: estabForm.profissionais_envolvidos,
      horario_funcionamento: buildSchedulePayload(estabSchedule),
    };

    if (estabProfile) {
      const original = {
        responsavel: (estabProfile.responsavel ?? "").trim(),
        telefone: maskPhone(estabProfile.telefone ?? "").trim(),
        instagram: (estabProfile.instagram ?? "").trim() || null,
        servicos_oferecidos: estabProfile.servicos_oferecidos ?? [],
        tecnicas_utilizadas: estabProfile.tecnicas_utilizadas ?? [],
        produtos_aplicados: estabProfile.produtos_aplicados ?? [],
        profissionais_envolvidos: estabProfile.profissionais_envolvidos ?? [],
        horario_funcionamento: buildSchedulePayload(
          parseSchedulePayload(estabProfile.horario_funcionamento),
        ),
      };
      if (JSON.stringify(original) === JSON.stringify(payload)) {
        setIsEstabEditing(false);
        return;
      }
    }

    setEstabSaving(true);
    try {
      const r = await api.patch("/v1/estabelecimentos/me/update", payload);
      setEstabProfile((prev) => ({
        ...(prev as EstabelecimentoProfile),
        ...(r.data as Partial<EstabelecimentoProfile>),
      }));
      setEstabSuccess(true);
      setIsEstabEditing(false);
    } catch (err: unknown) {
      setEstabError(
        getApiErrorMessage(err, "Não foi possível atualizar o perfil."),
      );
    } finally {
      setEstabSaving(false);
    }
  };

  const handleStatusUpdate = async (
    id: string,
    status: Agendamento["status"],
  ) => {
    setStatusUpdating(id);
    try {
      const payload: {
        status: Agendamento["status"];
        motivo_recusa?: string | null;
      } = {
        status,
      };

      if (status === "recusado") {
        payload.motivo_recusa = "Recusado pelo estabelecimento.";
      }

      await api.patch(`/v1/agendamentos/${id}/status`, payload);

      setAgendamentos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
    } catch {
      // ignore
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleFinalizeBooking = async (id: string) => {
    setStatusUpdating(id);

    try {
      await api.post(
        `/v1/agendamentos/${id}/encerrar`,
        {},
        {
          params: {
            custo_final: 0,
          },
        },
      );

      setAgendamentos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "concluido" } : a)),
      );
    } catch {
      // ignore
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleChangeTab = (tab: "profile" | "bookings") => {
    setActiveTab(tab);

    if (tab === "bookings") {
      setSearchParams({ tab: "bookings" }, { replace: true });
      return;
    }

    setSearchParams({}, { replace: true });
  };

  const handlePhotoUpload = async () => {
    if (!session || !selectedPhotoFile) {
      return;
    }

    setPhotoUploadError(null);
    setPhotoUploadLoading(true);

    const formData = new FormData();
    formData.append("file", selectedPhotoFile);

    try {
      if (session.role === "cliente") {
        const response = await api.post(
          "/v1/clientes/me/foto-perfil",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        const updatedProfile = response.data as ClienteProfile;
        setClientProfile(updatedProfile);
        updateSession({
          foto_perfil_url: updatedProfile.foto_perfil_url ?? null,
        });
      } else {
        const response = await api.post(
          "/v1/estabelecimentos/me/foto-perfil",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        const updatedProfile = response.data as EstabelecimentoProfile;
        setEstabProfile(updatedProfile);
        updateSession({
          foto_perfil_url: updatedProfile.foto_estabelecimento_url ?? null,
        });
      }

      setSelectedPhotoFile(null);
    } catch (err: unknown) {
      setPhotoUploadError(
        err instanceof Error
          ? err.message
          : "Nao foi possível enviar a foto de perfil.",
      );
    } finally {
      setPhotoUploadLoading(false);
    }
  };

  if (!session) return null;

  const photoModal = photoPreview ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Foto de perfil ampliada"
      onClick={closePhotoPreview}
      className={`auth-modal-overlay fixed inset-0 z-100 flex items-center justify-center bg-slate-900/80 p-4 ${isPhotoClosing ? "auth-modal-overlay-exit" : "auth-modal-overlay-enter"}`}
    >
      <button
        type="button"
        onClick={closePhotoPreview}
        aria-label="Fechar"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 hover:bg-white"
      >
        <X className="h-5 w-5" strokeWidth={2} />
      </button>
      <img
        src={photoPreview.url}
        alt={photoPreview.alt}
        onClick={(event) => event.stopPropagation()}
        className={`auth-modal-panel max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl ${isPhotoClosing ? "auth-modal-panel-exit" : "auth-modal-panel-enter"}`}
      />
    </div>
  ) : null;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className={
        embedded ? "bg-transparent" : "flex min-h-screen flex-col bg-slate-50"
      }
    >
      {photoModal ? createPortal(photoModal, document.body) : null}
      {!embedded ? (
        <Header
          onOpenMenu={() => setIsSidebarOpen(true)}
          loggedClientName={session.nome}
          loggedClientPhotoUrl={session.foto_perfil_url ?? null}
          loggedClientRole={session.role}
          onOpenLogin={() => setIsAuthModalOpen(true)}
          loggedClientPersonType={session?.tipo_pessoa}
          onLogout={() => {
            navigate("/", { replace: true, state: null });
            logout();
          }}
        />
      ) : null}

      {!embedded ? (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthChange={() => setIsAuthModalOpen(false)}
        />
      ) : null}

      {!embedded ? (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenLogin={() => setIsAuthModalOpen(true)}
        />
      ) : null}

      <main className={embedded ? "px-0 py-0" : "flex-1 px-4 py-8 sm:px-6"}>
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Tabs */}
          {!embedded ? (
            <div className="flex flex-wrap items-center gap-3">
              {isEstablishment ? <EstablishmentNavigation /> : null}

              {!isEstablishment ? (
                <div className="flex flex-col items-start gap-2">
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 py-1 text-sm font-medium text-slate-600 transition-colors hover:text-emerald-700 hover:underline hover:underline-offset-4"
                  >
                    <ArrowLeft
                      className="h-[15px] w-[15px]"
                      aria-hidden="true"
                    />
                    Voltar para início
                  </Link>
                  <div className="flex w-fit gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
                    <button
                      type="button"
                      onClick={() => handleChangeTab("profile")}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                        activeTab === "profile"
                          ? "bg-emerald-700 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Meu perfil
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChangeTab("bookings")}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                        activeTab === "bookings"
                          ? "bg-emerald-700 text-white"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Meus agendamentos
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* ── Profile tab ── */}
          {activeTab === "profile" && session.role === "cliente" && (
            <div className="space-y-6">
              {/* Profile info */}
              <div className={sectionClass}>
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {clientProfile?.foto_perfil_url ? (
                      <button
                        type="button"
                        onClick={() =>
                          openPhotoPreview(
                            clientProfile.foto_perfil_url as string,
                            "Foto de perfil",
                          )
                        }
                        aria-label="Ampliar foto de perfil"
                        className="group relative shrink-0 cursor-zoom-in overflow-hidden rounded-2xl"
                      >
                        <img
                          src={clientProfile.foto_perfil_url}
                          alt="Foto de perfil"
                          className="h-16 w-16 rounded-2xl object-cover"
                        />
                        <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                          <ZoomIn
                            className="h-6 w-6 text-white"
                            strokeWidth={2}
                          />
                        </span>
                      </button>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-lg font-semibold text-slate-500">
                        {session.nome.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h1 className="text-xl font-semibold text-slate-900">
                        {clientLoading
                          ? "Carregando..."
                          : clientProfile?.nome_usuario}
                      </h1>
                      <p className="text-sm text-slate-500">
                        {clientProfile?.email ?? session.email_ou_cpf}
                      </p>
                    </div>
                  </div>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditSuccess(false);
                        setEditError(null);
                        setIsEditing(true);
                      }}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      Editar
                    </button>
                  )}
                </div>

                <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    Foto de perfil
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Envie uma imagem para aparecer no seu perfil e no cabeçalho.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setSelectedPhotoFile(file);
                        setPhotoUploadError(null);
                      }}
                      className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-800"
                    />
                    <button
                      type="button"
                      disabled={!selectedPhotoFile || photoUploadLoading}
                      onClick={handlePhotoUpload}
                      className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                    >
                      {photoUploadLoading ? "Enviando..." : "Salvar foto"}
                    </button>
                  </div>
                  {photoUploadError ? (
                    <p className="mt-2 text-sm text-rose-700">
                      {photoUploadError}
                    </p>
                  ) : null}
                </div>

                {clientProfile && !isEditing && (
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-slate-900">
                        Como prefere ser chamado
                      </dt>
                      <dd className="text-slate-600">
                        {clientProfile.nome_tratamento ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-900">CPF</dt>
                      <dd className="text-slate-600">
                        {clientProfile.cpf.replace(
                          /(\d{3})(\d{3})(\d{3})(\d{2})/,
                          "$1.$2.$3-$4",
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-900">
                        Data de nascimento
                      </dt>
                      <dd className="text-slate-600">
                        {new Date(
                          clientProfile.data_nascimento + "T00:00:00",
                        ).toLocaleDateString("pt-BR")}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-900">Gênero</dt>
                      <dd className="text-slate-600">
                        {clientProfile.genero ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-900">
                        Pagamento preferido
                      </dt>
                      <dd className="text-slate-600">
                        {PAYMENT_LABELS[
                          clientProfile.forma_pagamento_preferida ?? ""
                        ] ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-900">
                        Localização
                      </dt>
                      <dd className="text-slate-600">
                        {clientProfile.localizacao_inicial ?? "—"}
                      </dd>
                    </div>
                  </dl>
                )}
              </div>

              {/* Edit form */}
              {isEditing && (
                <div className={sectionClass}>
                  <h2 className="mb-4 text-lg font-semibold text-slate-900">
                    Editar perfil
                  </h2>

                  {editError && (
                    <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {editError}
                    </div>
                  )}

                  <form onSubmit={handleClientUpdate} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Como prefere ser chamado
                        </label>
                        <input
                          value={nomeTratamento}
                          onChange={(e) => setNomeTratamento(e.target.value)}
                          placeholder="Apelido ou forma de tratamento"
                          className={inputClass}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Gênero
                        </label>
                        <input
                          value={genero}
                          onChange={(e) => setGenero(e.target.value)}
                          placeholder="Ex: Feminino, Masculino, Outro"
                          className={inputClass}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Pagamento preferido
                        </label>
                        <select
                          value={formaPagamento}
                          onChange={(e) => setFormaPagamento(e.target.value)}
                          className={inputClass}
                        >
                          <option value="">Selecione</option>
                          <option value="dinheiro">Dinheiro</option>
                          <option value="cartao_debito">
                            Cartão de débito
                          </option>
                          <option value="cartao_credito">
                            Cartão de crédito
                          </option>
                          <option value="pix">PIX</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Localização
                        </label>
                        <input
                          value={localizacao}
                          onChange={(e) => setLocalizacao(e.target.value)}
                          placeholder="Bairro ou cidade"
                          className={inputClass}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          E-mail
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com"
                          className={inputClass}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          Nova senha{" "}
                          <span className="font-normal text-slate-400">
                            (deixe em branco para manter)
                          </span>
                        </label>
                        <input
                          type="password"
                          value={novaSenha}
                          onChange={(e) => setNovaSenha(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          minLength={6}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={editLoading}
                        className="flex-1 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                      >
                        {editLoading ? "Salvando..." : "Salvar alterações"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {editSuccess && !isEditing && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                  Perfil atualizado com sucesso.
                </div>
              )}
            </div>
          )}

          {activeTab === "profile" && session.role === "estabelecimento" && (
            <div className={sectionClass}>
              {estabLoading ? (
                <p className="text-sm text-slate-500">Carregando perfil...</p>
              ) : estabProfile ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {estabProfile.foto_estabelecimento_url ? (
                        <button
                          type="button"
                          onClick={() =>
                            openPhotoPreview(
                              estabProfile.foto_estabelecimento_url as string,
                              estabProfile.nome_estabelecimento,
                            )
                          }
                          aria-label="Ampliar foto de perfil"
                          className="group relative shrink-0 cursor-zoom-in overflow-hidden rounded-2xl"
                        >
                          <img
                            src={estabProfile.foto_estabelecimento_url}
                            alt={estabProfile.nome_estabelecimento}
                            className="h-16 w-16 rounded-2xl object-cover"
                          />
                          <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/50 opacity-0 transition-opacity duration-100 group-hover:opacity-100 group-focus-visible:opacity-100">
                            <ZoomIn
                              className="h-6 w-6 text-white"
                              strokeWidth={2}
                            />
                          </span>
                        </button>
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xs font-semibold text-slate-400">
                          Sem foto
                        </div>
                      )}
                      <div>
                        <h1 className="text-xl font-semibold text-slate-900">
                          {estabProfile.nome_estabelecimento}
                        </h1>
                        <p className="text-sm text-slate-500">
                          {estabProfile.categoria}
                        </p>
                      </div>
                    </div>
                    {!isEstabEditing && (
                      <button
                        type="button"
                        className={`${btnOutline} !px-4 !py-2 !text-sm shrink-0`}
                        onClick={startEstabEdit}
                      >
                        Editar perfil
                      </button>
                    )}
                  </div>

                  {isEstabEditing && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        Foto de perfil
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Envie uma imagem para representar seu perfil de
                        prestador.
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;
                            setSelectedPhotoFile(file);
                            setPhotoUploadError(null);
                          }}
                          className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-800"
                        />
                        <button
                          type="button"
                          disabled={!selectedPhotoFile || photoUploadLoading}
                          onClick={handlePhotoUpload}
                          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${accentButton} disabled:opacity-60`}
                        >
                          {photoUploadLoading ? "Enviando..." : "Salvar foto"}
                        </button>
                      </div>
                      {photoUploadError ? (
                        <p className="mt-2 text-sm text-rose-700">
                          {photoUploadError}
                        </p>
                      ) : null}
                    </div>
                  )}

                  {estabSuccess && !isEstabEditing && (
                    <p className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                      Perfil atualizado com sucesso.
                    </p>
                  )}

                  {isEstabEditing ? (
                    <form
                      onSubmit={handleEstabUpdate}
                      className="grid gap-4 md:grid-cols-2"
                    >
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">
                          Responsável *
                        </span>
                        <Input
                          className="focus:ring-blue-300!"
                          value={estabForm.responsavel}
                          onChange={(e) =>
                            setEstabForm((prev) => ({
                              ...prev,
                              responsavel: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-slate-700">
                          Telefone *
                        </span>
                        <Input
                          className="focus:ring-blue-300!"
                          inputMode="tel"
                          value={estabForm.telefone}
                          onChange={(e) =>
                            setEstabForm((prev) => ({
                              ...prev,
                              telefone: maskPhone(e.target.value),
                            }))
                          }
                        />
                      </label>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-slate-700">
                          Instagram
                        </span>
                        <Input
                          className="focus:ring-blue-300!"
                          value={estabForm.instagram}
                          placeholder="@seu_instagram"
                          onChange={(e) =>
                            setEstabForm((prev) => ({
                              ...prev,
                              instagram: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <MultiValueInput
                        id="perfil-servicos"
                        label="Serviços oferecidos"
                        placeholder="Digite um serviço e adicione"
                        values={estabForm.servicos_oferecidos}
                        onChange={(values) =>
                          setEstabForm((prev) => ({
                            ...prev,
                            servicos_oferecidos: values,
                          }))
                        }
                      />
                      <MultiValueInput
                        id="perfil-tecnicas"
                        label="Técnicas utilizadas"
                        placeholder="Digite uma técnica e adicione"
                        values={estabForm.tecnicas_utilizadas}
                        onChange={(values) =>
                          setEstabForm((prev) => ({
                            ...prev,
                            tecnicas_utilizadas: values,
                          }))
                        }
                      />
                      <MultiValueInput
                        id="perfil-produtos"
                        label="Produtos aplicados"
                        placeholder="Digite um produto e adicione"
                        values={estabForm.produtos_aplicados}
                        onChange={(values) =>
                          setEstabForm((prev) => ({
                            ...prev,
                            produtos_aplicados: values,
                          }))
                        }
                      />
                      <MultiValueInput
                        id="perfil-profissionais"
                        label="Profissionais envolvidos"
                        placeholder="Digite um profissional e adicione"
                        values={estabForm.profissionais_envolvidos}
                        onChange={(values) =>
                          setEstabForm((prev) => ({
                            ...prev,
                            profissionais_envolvidos: values,
                          }))
                        }
                      />
                      <ScheduleEditor
                        schedule={estabSchedule}
                        onChange={setEstabSchedule}
                        onOpenChange={setIsScheduleEditorOpen}
                      />

                      {estabError && (
                        <div
                          role="alert"
                          className="flex items-start justify-between gap-3 rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700 md:col-span-2"
                        >
                          <p>{estabError}</p>
                          <button
                            type="button"
                            aria-label="Fechar alerta"
                            onClick={() => setEstabError(null)}
                            className="shrink-0 rounded-md p-0.5 text-rose-700 transition-colors hover:bg-rose-100"
                          >
                            <X className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </div>
                      )}

                      <div className="sticky bottom-0 z-30 -mx-6 -mb-6 flex gap-3 rounded-b-3xl border-t border-slate-200 bg-white/95 px-6 py-4 shadow-[0_-6px_20px_rgba(15,23,42,0.08)] backdrop-blur-sm md:col-span-2">
                        <button
                          type="submit"
                          disabled={estabSaving}
                          className={btnPrimary}
                        >
                          {estabSaving ? "Salvando..." : "Salvar alterações"}
                        </button>
                        <button
                          type="button"
                          className={`${btnOutline} !px-4 !py-2 !text-sm`}
                          disabled={estabSaving}
                          onClick={() => {
                            setIsEstabEditing(false);
                            setEstabError(null);
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <dl className="grid gap-3 text-sm sm:grid-cols-2">
                        {(
                          [
                            ["Responsável", estabProfile.responsavel],
                            [
                              "Telefone",
                              maskPhone(estabProfile.telefone ?? ""),
                            ],
                            ["E-mail", estabProfile.email],
                            ["Localização", estabProfile.localizacao],
                            [
                              "Tipo de pessoa",
                              estabProfile.tipo_pessoa === "juridica"
                                ? "Pessoa jurídica"
                                : estabProfile.tipo_pessoa === "autonomo"
                                  ? "Autônomo"
                                  : null,
                            ],
                            [
                              "CPF",
                              estabProfile.cpf
                                ? maskCpf(estabProfile.cpf)
                                : null,
                            ],
                            [
                              "CNPJ",
                              estabProfile.cnpj
                                ? maskCnpj(estabProfile.cnpj)
                                : null,
                            ],
                            ["Razão social", estabProfile.razao_social],
                            ["Categoria", estabProfile.categoria],
                          ] as Array<[string, string | null | undefined]>
                        )
                          .filter(
                            ([label, value]) =>
                              value ||
                              !["CPF", "CNPJ", "Razão social"].includes(label),
                          )
                          .map(([label, value]) => (
                            <div key={label}>
                              <dt className="font-semibold text-slate-900">
                                {label}
                              </dt>
                              <dd className="text-slate-600">
                                {value || "Não informado"}
                              </dd>
                            </div>
                          ))}
                        <div>
                          <dt className="font-semibold text-slate-900">
                            Instagram
                          </dt>
                          <dd className="text-slate-600">
                            {estabProfile.instagram ? (
                              <a
                                href={`https://instagram.com/${estabProfile.instagram.replace(/^@/, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-700 hover:underline"
                              >
                                {estabProfile.instagram.startsWith("@")
                                  ? estabProfile.instagram
                                  : `@${estabProfile.instagram}`}
                              </a>
                            ) : (
                              "Não informado"
                            )}
                          </dd>
                        </div>
                      </dl>

                      {(
                        [
                          [
                            "Serviços oferecidos",
                            estabProfile.servicos_oferecidos,
                          ],
                          [
                            "Técnicas utilizadas",
                            estabProfile.tecnicas_utilizadas,
                          ],
                          [
                            "Produtos aplicados",
                            estabProfile.produtos_aplicados,
                          ],
                          [
                            "Profissionais envolvidos",
                            estabProfile.profissionais_envolvidos,
                          ],
                        ] as Array<[string, string[] | undefined]>
                      ).map(([label, items]) => (
                        <div key={label}>
                          <p className="text-sm font-semibold text-slate-900">
                            {label}
                          </p>
                          {items?.length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {items.map((item) => (
                                <span
                                  key={item}
                                  className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800"
                                >
                                  {item}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-1 text-sm text-slate-500">
                              Não informado
                            </p>
                          )}
                        </div>
                      ))}

                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Horário de funcionamento
                        </p>
                        {(() => {
                          const parsed = parseSchedulePayload(
                            estabProfile.horario_funcionamento,
                          );
                          const todayKey =
                            weekDays[(new Date().getDay() + 6) % 7].key;
                          if (!weekDays.some((day) => parsed[day.key].ativo)) {
                            return (
                              <p className="mt-1 text-sm text-slate-500">
                                Não informado
                              </p>
                            );
                          }
                          return (
                            <ul className="mt-2 space-y-2">
                              {weekDays.map((day) => {
                                const { ativo, faixas } = parsed[day.key];
                                return (
                                  <li
                                    key={day.key}
                                    className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 ${
                                      ativo
                                        ? "border-blue-100 bg-blue-50/60"
                                        : "border-slate-200 bg-slate-50"
                                    }`}
                                  >
                                    <span
                                      className={`w-32 text-sm font-semibold ${ativo ? "text-blue-900" : "text-slate-400"}`}
                                    >
                                      {day.label}
                                      {day.key === todayKey ? (
                                        <span className="ml-2 rounded-full bg-blue-700 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                                          Hoje
                                        </span>
                                      ) : null}
                                    </span>
                                    {ativo ? (
                                      faixas.map((r) => (
                                        <span
                                          key={`${r.inicio}-${r.fim}`}
                                          className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900"
                                        >
                                          {r.inicio} às {r.fim}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-500">
                                        Fechado
                                      </span>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          );
                        })()}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-rose-600">
                  Não foi possível carregar o perfil.
                </p>
              )}
            </div>
          )}

          {/* ── Bookings tab ── */}
          {activeTab === "bookings" && (
            <div className="space-y-4">
              {isEstablishment && (
                <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Filter
                        className="h-4 w-4 text-blue-700"
                        strokeWidth={2}
                      />
                      <h2 className="text-base font-semibold text-slate-900">
                        Filtros
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={resetBookingFilters}
                      className="inline-flex items-center gap-2 rounded-lg border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700 hover:cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
                      Limpar filtros
                    </button>
                  </div>
                  <div className="mt-3 grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.8fr_0.8fr_0.7fr]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                        <span className="w-9 shrink-0" aria-hidden="true" />
                        <span className="min-w-0 flex-1">De</span>
                        <span className="min-w-0 flex-1">Até</span>
                      </div>
                      <div className="mt-1 flex min-w-0 items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <button
                          type="button"
                          title={`Ordenação por data: ${dateSortDirection === "desc" ? "mais recentes primeiro" : "mais antigas primeiro"}`}
                          aria-label={`Ordenar por data: ${dateSortDirection === "desc" ? "mais recentes primeiro" : "mais antigas primeiro"}`}
                          onClick={() => {
                            setBookingSortField("date");
                            setDateSortDirection((direction) =>
                              direction === "desc" ? "asc" : "desc",
                            );
                          }}
                          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${bookingSortField === "date" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                        >
                          {dateSortDirection === "desc" ? (
                            <ArrowDownWideNarrow
                              className="h-4 w-4"
                              strokeWidth={2}
                            />
                          ) : (
                            <ArrowUpWideNarrow
                              className="h-4 w-4"
                              strokeWidth={2}
                            />
                          )}
                        </button>
                        <input
                          aria-label="Data inicial"
                          type="date"
                          value={bookingStartDate}
                          onChange={(event) =>
                            setBookingStartDate(event.target.value)
                          }
                          className={`${groupedInputClass} min-w-0 flex-1 border-r border-slate-200`}
                        />
                        <input
                          aria-label="Data final"
                          type="date"
                          value={bookingEndDate}
                          onChange={(event) =>
                            setBookingEndDate(event.target.value)
                          }
                          className={`${groupedInputClass} min-w-0 flex-1`}
                        />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-slate-600">
                        Status
                      </div>
                      <div className="mt-1 flex min-w-0 items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <button
                          type="button"
                          title={`Ordenação por status: ${statusSortDirection === "asc" ? "menor para maior" : "maior para menor"}`}
                          aria-label={`Ordenar por status: ${statusSortDirection === "asc" ? "menor para maior" : "maior para menor"}`}
                          onClick={() => {
                            setBookingSortField("status");
                            setStatusSortDirection((direction) =>
                              direction === "asc" ? "desc" : "asc",
                            );
                          }}
                          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${bookingSortField === "status" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                        >
                          {statusSortDirection === "asc" ? (
                            <ArrowDownWideNarrow
                              className="h-4 w-4"
                              strokeWidth={2}
                            />
                          ) : (
                            <ArrowUpWideNarrow
                              className="h-4 w-4"
                              strokeWidth={2}
                            />
                          )}
                        </button>
                        <select
                          value={bookingStatusFilter}
                          onChange={(event) =>
                            setBookingStatusFilter(event.target.value)
                          }
                          className={`${groupedInputClass} min-w-0 flex-1`}
                        >
                          <option value="">Todos os status</option>
                          <option value="upcoming">
                            Próximos agendamentos
                          </option>
                          {bookingStatuses.map((status) => (
                            <option key={status} value={status}>
                              {STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-slate-600">
                        Profissional
                      </div>
                      <div className="mt-1 flex min-w-0 items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <select
                          value={bookingProfessionalFilter}
                          onChange={(event) =>
                            setBookingProfessionalFilter(event.target.value)
                          }
                          className={`${groupedInputClass} min-w-0 flex-1`}
                        >
                          <option value="">Todos os profissionais</option>
                          {professionalOptions.map((professional) => (
                            <option key={professional} value={professional}>
                              {professional}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-slate-600">
                        Cliente
                      </div>
                      <div className="mt-1 flex min-w-0 items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <select
                          value={bookingClientFilter}
                          onChange={(event) =>
                            setBookingClientFilter(event.target.value)
                          }
                          className={`${groupedInputClass} min-w-0 flex-1`}
                        >
                          <option value="">Todos os clientes</option>
                          {clientOptions.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className="mx-auto w-full max-w-3xl space-y-4">
                {agendamentosLoading ? (
                  <div className={sectionClass}>
                    <p className="text-sm text-slate-500">
                      Carregando agendamentos...
                    </p>
                  </div>
                ) : filteredAgendamentos.length === 0 ? (
                  <div className={sectionClass}>
                    <p className="text-sm text-slate-500">
                      Nenhum agendamento encontrado para os filtros aplicados.
                    </p>
                  </div>
                ) : (
                  filteredAgendamentos.map((ag) => (
                    <div
                      key={ag.id}
                      className={`${isEstablishment ? "flex min-h-44 flex-col justify-between gap-2 rounded-2xl border p-4 max-md:min-h-48" : "rounded-3xl border p-5"} shadow-sm ${isEstablishment ? getProviderBookingCardColors(ag.status) : "border-slate-200 bg-white"}`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 space-y-2">
                          <p className="font-semibold text-slate-900">
                            {ag.tratamento}
                          </p>

                          {isEstablishment && (
                            <div className="flex flex-wrap items-center rounded-2xl gap-2 text-sm">
                              <span className="text-xs font-medium text-slate-500">
                                <Contact className="h-5 w-5 text-slate-600" />
                              </span>
                              <span className="text-sm font-medium text-slate-700">
                                {clientesAgenda[
                                  ag.cliente_id
                                ]?.nome_tratamento?.trim() ||
                                  clientesAgenda[ag.cliente_id]?.nome_usuario ||
                                  "Cliente não identificado"}
                              </span>
                            </div>
                          )}

                          {ag.tecnica && (
                            <div className="hidden flex-wrap items-center gap-2 text-sm">
                              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                                Técnica
                              </span>
                              <span className="text-slate-500">
                                {ag.tecnica}
                              </span>
                            </div>
                          )}
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${isEstablishment ? PROVIDER_STATUS_COLORS[ag.status] : STATUS_COLORS[ag.status]}`}
                        >
                          {STATUS_LABELS[ag.status]}
                        </span>
                      </div>

                      <div
                        className={`${isEstablishment ? "mt-2" : "mt-3"} flex items-end justify-between gap-3`}
                      >
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4 text-slate-600" />
                            {formatDate(ag.data_hora_inicio)}
                          </span>
                          <span className="flex items-center gap-1">
                            {" "}
                            <ClockFading className="h-4 w-4 text-slate-600" />{" "}
                            {ag.duracao_estimada_minutos} min
                          </span>
                          {ag.custo_final > 0 && (
                            <span>
                              R${" "}
                              {ag.custo_final.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          )}
                        </div>

                        <div className="ml-auto flex shrink-0 flex-col items-end text-right">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                            Profissional responsável
                          </span>
                          <span className="text-sm font-medium text-slate-700">
                            {ag.profissional_envolvido}
                          </span>
                        </div>
                      </div>

                      {ag.motivo_recusa && (
                        <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                          Motivo da recusa: {ag.motivo_recusa}
                        </p>
                      )}

                      {/* Establishment status actions */}
                      {session.role === "estabelecimento" && (
                        <div
                          className={`${isEstablishment ? "mt-2" : "mt-3"} flex flex-wrap gap-2`}
                        >
                          {ag.status === "pendente" && (
                            <>
                              <button
                                type="button"
                                disabled={statusUpdating === ag.id}
                                onClick={() =>
                                  handleStatusUpdate(ag.id, "confirmado")
                                }
                                className="flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                              >
                                <Check
                                  className="h-3.5 w-3.5"
                                  strokeWidth={2}
                                />
                                Confirmar
                              </button>
                              <button
                                type="button"
                                disabled={statusUpdating === ag.id}
                                onClick={() =>
                                  handleStatusUpdate(ag.id, "recusado")
                                }
                                className="flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                              >
                                <X className="h-3.5 w-3.5" strokeWidth={2} />
                                Recusar
                              </button>
                            </>
                          )}
                          {ag.status === "confirmado" && (
                            <>
                              <button
                                type="button"
                                disabled={statusUpdating === ag.id}
                                onClick={() =>
                                  handleStatusUpdate(ag.id, "em_andamento")
                                }
                                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                              >
                                Iniciar atendimento
                              </button>
                              <button
                                type="button"
                                disabled={statusUpdating === ag.id}
                                onClick={() =>
                                  handleStatusUpdate(ag.id, "cancelado")
                                }
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                          {ag.status === "em_andamento" && (
                            <button
                              type="button"
                              disabled={statusUpdating === ag.id}
                              onClick={() => handleFinalizeBooking(ag.id)}
                              className="rounded-lg bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-800 disabled:opacity-60"
                            >
                              {statusUpdating === ag.id
                                ? "Finalizando..."
                                : "Finalizar atendimento"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
