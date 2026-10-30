import { useEffect, useRef, useState } from "react";
import { getCurrentPosition, getGeolocationErrorMessage, type Coordinates } from "../utils/geolocation";
import api from "../services/api";
import EstablishmentCard from "./EstablishmentCard";
import type { BookingEstablishment } from "./BookingForm";

interface Establishment {
  distancia_km?: number | null;
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

interface EstablishmentListProps {
  selectedCategory?: string | null;
  searchQuery?: string;
  onRequestBooking?: (data: BookingEstablishment) => void;
  onClearCategoryFilter?: () => void;
}

export const EstablishmentList = ({
  selectedCategory,
  searchQuery,
  onRequestBooking,
  onClearCategoryFilter,
}: EstablishmentListProps) => {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [position, setPosition] = useState<Coordinates | null>(null);
  const [radius, setRadius] = useState(10);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const locationRequest = useRef(0);
  useEffect(() => () => { locationRequest.current += 1; }, []);
  const locate = async () => {
    const request = ++locationRequest.current;
    setLocating(true);
    setLocationError(null);
    try {
      const coords = await getCurrentPosition();
      if (request === locationRequest.current) setPosition(coords);
    } catch (err) {
      if (request === locationRequest.current) setLocationError(getGeolocationErrorMessage(err));
    } finally {
      if (request === locationRequest.current) setLocating(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const fetchEstablishments = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get(
          "/v1/estabelecimentos/listar_estabelecimentos",
          { signal: controller.signal, params: position ? { ...position, raio_km: radius } : undefined },
        );
        const data = response.data as unknown;

        const establishments = Array.isArray(data)
          ? data
          : ((data as { data?: Establishment[] }).data ?? []);

        const activeEstablishments = establishments.filter(
          (item) => item.ativo,
        );

        if (!controller.signal.aborted) setEstablishments(activeEstablishments);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(`Falha ao carregar estabelecimentos: ${message}`);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void fetchEstablishments();
    return () => controller.abort();
  }, [position, radius]);

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
        normalizeText(item.categoria).includes(normalizedSearch) ||
        normalizeText(item.localizacao).includes(normalizedSearch) ||
        item.servicos_oferecidos?.some((service) =>
          normalizeText(service).includes(normalizedSearch),
        )
      : true;

    return matchesCategoryFilter && matchesSearch;
  });

  const titleSuffix = selectedCategory ? selectedCategory : "ativos";
  const hasSearch = normalizedSearch.length > 0;
  const listTransitionKey = `${selectedCategory ?? "all"}|${normalizedSearch}|${filteredEstablishments
    .map((item) => item.id)
    .join(",")}`;

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
        {selectedCategory && onClearCategoryFilter ? (
          <button
            type="button"
            onClick={onClearCategoryFilter}
            className="shrink-0 text-sm font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-4 transition-colors hover:text-emerald-900"
          >
            Limpar filtro
          </button>
        ) : null}
      </div>

      <div className="mb-5 space-y-2 rounded-xl bg-slate-50 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => void locate()} disabled={locating} className="rounded-lg border border-emerald-700 px-3 py-2 text-sm text-emerald-800 disabled:opacity-50">
            {locating ? "Obtendo localização..." : position ? "Atualizar minha posição" : "Buscar perto de mim"}
          </button>
          {position && <>
            <label className="text-sm">Raio da busca <select value={radius} onChange={(event) => setRadius(Number(event.target.value))} className="ml-2 rounded border p-2">
              {[1, 5, 10, 25, 50, 100].map((km) => <option key={km} value={km}>{km} km</option>)}
            </select></label>
            <button type="button" className="text-sm underline" onClick={() => { locationRequest.current += 1; setLocating(false); setPosition(null); setLocationError(null); }}>Ver todos</button>
          </>}
        </div>
        <p className="text-sm text-slate-600">{position ? "Distâncias em linha reta. A busca por raio inclui apenas estabelecimentos com posição cadastrada." : "Use sua localização para encontrar estabelecimentos próximos. Sua posição é usada somente nesta busca."}</p>
        {locationError && <p role="alert" className="text-sm text-rose-700">{locationError}</p>}
      </div>
      {loading ? (
        <p className="text-sm text-slate-600">Carregando estabelecimentos...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : filteredEstablishments.length === 0 ? (
        <p className="establishment-mount text-sm text-slate-600">
          {position ? "Nenhum estabelecimento com posição cadastrada encontrado neste raio. Amplie o raio ou selecione Ver todos." : "Nenhum estabelecimento encontrado para os filtros aplicados."}
        </p>
      ) : (
        <div
          key={listTransitionKey}
          className="grid gap-3 sm:gap-4 md:grid-cols-2"
        >
          {filteredEstablishments.map((establishment, index) => (
            <div
              key={establishment.id}
              className="establishment-mount min-w-0 max-w-full"
              style={{ animationDelay: `${Math.min(index, 7) * 60}ms` }}
            >
              <EstablishmentCard
                distancia_km={establishment.distancia_km}
                id={establishment.id}
                nome_estabelecimento={establishment.nome_estabelecimento}
                telefone={establishment.telefone}
                localizacao={establishment.localizacao}
                foto_estabelecimento_url={
                  establishment.foto_estabelecimento_url ?? null
                }
                categoria={establishment.categoria}
                servicos_oferecidos={establishment.servicos_oferecidos ?? []}
                tecnicas_utilizadas={establishment.tecnicas_utilizadas ?? []}
                produtos_aplicados={establishment.produtos_aplicados ?? []}
                profissionais_envolvidos={
                  establishment.profissionais_envolvidos ?? []
                }
                onRequestBooking={(data) => onRequestBooking?.(data)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default EstablishmentList;

