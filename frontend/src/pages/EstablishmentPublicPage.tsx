import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
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
  const { isAuthenticated, session } = useAuth();
  const [establishment, setEstablishment] = useState<Establishment | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (isAuthenticated && session?.role === "estabelecimento") {
      navigate("/app/agenda");
      return;
    }

    navigate("/app/agendamentos/novo");
  };

  if (loading) {
    return (
      <section className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-600">
            Carregando detalhes do estabelecimento...
          </p>
        </div>
      </section>
    );
  }

  if (error || !establishment) {
    return (
      <section className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
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
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Voltar para a home
          </Link>
          <button
            type="button"
            onClick={handleRequestBooking}
            className="inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Solicitar agendamento
          </button>
        </div>

        {!isAuthenticated ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Para concluir o agendamento, faca login.
          </p>
        ) : null}

        <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
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

          <div className="space-y-6 p-5 sm:p-8">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                {establishment.nome_estabelecimento}
              </h1>
              <p className="mt-2 text-sm text-slate-600 sm:text-base">
                {establishment.localizacao}
              </p>
            </div>

            <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
              <p>
                <span className="font-semibold text-slate-900">
                  Categoria:{" "}
                </span>
                {establishment.categoria}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Telefone: </span>
                {establishment.telefone}
              </p>
              <p>
                <span className="font-semibold text-slate-900">CNPJ: </span>
                {establishment.cnpj}
              </p>
              <p>
                <span className="font-semibold text-slate-900">
                  Razao social:{" "}
                </span>
                {establishment.razao_social}
              </p>
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
          </div>
        </article>
      </div>
    </section>
  );
};

export default EstablishmentPublicPage;
