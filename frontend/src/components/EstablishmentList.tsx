import { useEffect, useState } from "react";
import api from "../services/api";
import EstablishmentCard from "./EstablishmentCard";

interface Establishment {
  id: string;
  nome_estabelecimento: string;
  responsavel: string;
  telefone: string;
  email: string;
  localizacao: string;
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

interface EstablishmentListProps {
  selectedCategory?: string | null;
  searchQuery?: string;
  onRequestLogin?: () => void;
}

export const EstablishmentList = ({
  selectedCategory,
  searchQuery,
  onRequestLogin,
}: EstablishmentListProps) => {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEstablishments = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(
          "/v1/estabelecimentos/listar_estabelecimentos",
        );
        const data = response.data as unknown;

        const establishments = Array.isArray(data)
          ? data
          : ((data as { data?: Establishment[] }).data ?? []);

        const activeEstablishments = establishments.filter(
          (item) => item.ativo,
        );

        setEstablishments(activeEstablishments);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(`Falha ao carregar estabelecimentos: ${message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchEstablishments();
  }, []);

  const normalizeText = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const normalizedSearch = normalizeText(searchQuery ?? "").trim();

  const filteredEstablishments = establishments.filter((item) => {
    const matchesCategoryFilter = selectedCategory
      ? item.categoria?.toLowerCase() === selectedCategory.toLowerCase()
      : true;

    const matchesSearch = normalizedSearch
      ? normalizeText(item.nome_estabelecimento).includes(normalizedSearch) ||
        normalizeText(item.categoria).includes(normalizedSearch)
      : true;

    return matchesCategoryFilter && matchesSearch;
  });

  const titleSuffix = selectedCategory ? selectedCategory : "ativos";
  const hasSearch = normalizedSearch.length > 0;

  return (
    <section className="mb-2 rounded-3xl bg-white/95 p-4 shadow-md ring-1 ring-slate-200 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Estabelecimentos {titleSuffix}
          </h2>
          <p className="text-sm text-slate-600">
            Listagem filtrada por {titleSuffix}
            {hasSearch ? ` e busca por "${searchQuery}".` : "."}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Carregando estabelecimentos...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : filteredEstablishments.length === 0 ? (
        <p className="text-sm text-slate-600">
          Nenhum estabelecimento encontrado para os filtros aplicados.
        </p>
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
          {filteredEstablishments.map((establishment) => (
            <EstablishmentCard
              key={establishment.id}
              nome_estabelecimento={establishment.nome_estabelecimento}
              telefone={establishment.telefone}
              localizacao={establishment.localizacao}
              categoria={establishment.categoria}
              cnpj={establishment.cnpj}
              servicos_oferecidos={establishment.servicos_oferecidos ?? []}
              tecnicas_utilizadas={establishment.tecnicas_utilizadas ?? []}
              produtos_aplicados={establishment.produtos_aplicados ?? []}
              profissionais_envolvidos={
                establishment.profissionais_envolvidos ?? []
              }
              onRequestLogin={() => onRequestLogin?.()}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default EstablishmentList;
