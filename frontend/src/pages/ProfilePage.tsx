import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { AuthModal } from "../components/AuthModal";
import { Header } from "../components/Header";
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
  cnpj: string | null;
  razao_social: string | null;
  categoria: string;
  instagram: string | null;
  servicos_oferecidos: string[];
  tecnicas_utilizadas: string[];
  produtos_aplicados: string[];
  profissionais_envolvidos: string[];
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
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200";

const sectionClass = "rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 p-6";

// ─── Component ────────────────────────────────────────────────────────────────

export const ProfilePage = () => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "bookings">("profile");

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

  // ── Agendamentos state ───────────────────────────────────────────────────────
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [agendamentosLoading, setAgendamentosLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

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
        })
        .catch(() => {})
        .finally(() => setClientLoading(false));
    }

    if (session.role === "estabelecimento") {
      setEstabLoading(true);
      api
        .get("/v1/estabelecimentos/me")
        .then((r) => setEstabProfile(r.data as EstabelecimentoProfile))
        .catch(() => {})
        .finally(() => setEstabLoading(false));
    }
  }, [session]);

  useEffect(() => {
    if (!session || activeTab !== "bookings") return;

    setAgendamentosLoading(true);
    const url =
      session.role === "cliente"
        ? `/v1/agendamentos/cliente/${session.id}`
        : `/v1/agendamentos/estabelecimento/${session.id}`;

    api
      .get(url)
      .then((r) => setAgendamentos(r.data as Agendamento[]))
      .catch(() => setAgendamentos([]))
      .finally(() => setAgendamentosLoading(false));
  }, [session, activeTab]);

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
      setClientProfile(r.data as ClienteProfile);
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

  const handleStatusUpdate = async (
    id: string,
    status: Agendamento["status"],
  ) => {
    setStatusUpdating(id);
    try {
      await api.patch(`/v1/agendamentos/${id}/status`, { status });
      setAgendamentos((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
    } catch {
      // ignore
    } finally {
      setStatusUpdating(null);
    }
  };

  if (!session) return null;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header
        onOpenMenu={() => {}}
        loggedClientName={session.nome}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onLogout={() => {
          logout();
          navigate("/");
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthChange={() => setIsAuthModalOpen(false)}
      />

      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Tabs */}
          <div className="flex w-fit gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
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
              onClick={() => setActiveTab("bookings")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === "bookings"
                  ? "bg-emerald-700 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {session.role === "cliente" ? "Meus agendamentos" : "Agenda"}
            </button>
          </div>

          {/* ── Profile tab ── */}
          {activeTab === "profile" && session.role === "cliente" && (
            <div className="space-y-6">
              {/* Profile info */}
              <div className={sectionClass}>
                <div className="mb-4 flex items-start justify-between">
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
                  <div className="flex items-start gap-4">
                    {estabProfile.foto_estabelecimento_url ? (
                      <img
                        src={estabProfile.foto_estabelecimento_url}
                        alt={estabProfile.nome_estabelecimento}
                        className="h-16 w-16 rounded-2xl object-cover"
                      />
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

                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-slate-900">
                        Responsável
                      </dt>
                      <dd className="text-slate-600">
                        {estabProfile.responsavel}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-900">Telefone</dt>
                      <dd className="text-slate-600">
                        {estabProfile.telefone}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-900">E-mail</dt>
                      <dd className="text-slate-600">{estabProfile.email}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-900">
                        Localização
                      </dt>
                      <dd className="text-slate-600">
                        {estabProfile.localizacao}
                      </dd>
                    </div>
                    {estabProfile.cnpj && (
                      <div>
                        <dt className="font-semibold text-slate-900">CNPJ</dt>
                        <dd className="text-slate-600">{estabProfile.cnpj}</dd>
                      </div>
                    )}
                    {estabProfile.instagram && (
                      <div>
                        <dt className="font-semibold text-slate-900">
                          Instagram
                        </dt>
                        <dd className="text-slate-600">
                          {estabProfile.instagram}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {estabProfile.servicos_oferecidos.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Serviços
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {estabProfile.servicos_oferecidos.join(", ")}
                      </p>
                    </div>
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
              {agendamentosLoading ? (
                <div className={sectionClass}>
                  <p className="text-sm text-slate-500">
                    Carregando agendamentos...
                  </p>
                </div>
              ) : agendamentos.length === 0 ? (
                <div className={sectionClass}>
                  <p className="text-sm text-slate-500">
                    Nenhum agendamento encontrado.
                  </p>
                </div>
              ) : (
                agendamentos.map((ag) => (
                  <div
                    key={ag.id}
                    className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {ag.tratamento}
                        </p>
                        <p className="text-sm text-slate-500">
                          {ag.profissional_envolvido}
                        </p>
                        {ag.tecnica && (
                          <p className="text-sm text-slate-500">
                            Técnica: {ag.tecnica}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[ag.status]}`}
                      >
                        {STATUS_LABELS[ag.status]}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                      <span>{formatDate(ag.data_hora_inicio)}</span>
                      <span>{ag.duracao_estimada_minutos} min</span>
                      {ag.custo_final > 0 && (
                        <span>
                          R${" "}
                          {ag.custo_final.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      )}
                    </div>

                    {ag.motivo_recusa && (
                      <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                        Motivo da recusa: {ag.motivo_recusa}
                      </p>
                    )}

                    {/* Establishment status actions */}
                    {session.role === "estabelecimento" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {ag.status === "pendente" && (
                          <>
                            <button
                              type="button"
                              disabled={statusUpdating === ag.id}
                              onClick={() =>
                                handleStatusUpdate(ag.id, "confirmado")
                              }
                              className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                            >
                              Confirmar
                            </button>
                            <button
                              type="button"
                              disabled={statusUpdating === ag.id}
                              onClick={() =>
                                handleStatusUpdate(ag.id, "recusado")
                              }
                              className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                            >
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
                              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
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
                          <span className="rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                            Atendimento em andamento
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
