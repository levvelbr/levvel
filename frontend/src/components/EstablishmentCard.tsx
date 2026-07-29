import CategoryIcon from "./CategoryIcon";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { BookingEstablishment } from "./BookingForm";

interface EstablishmentCardProps {
  id: string;
  nome_estabelecimento: string;
  telefone: string;
  localizacao: string;
  foto_estabelecimento_url: string | null;
  categoria: string;
  servicos_oferecidos: string[];
  tecnicas_utilizadas: string[];
  produtos_aplicados: string[];
  profissionais_envolvidos: string[];
  onRequestBooking: (data: BookingEstablishment) => void;
}

export const EstablishmentCard = ({
  id,
  nome_estabelecimento,
  telefone,
  localizacao,
  foto_estabelecimento_url,
  categoria,
  servicos_oferecidos,
  tecnicas_utilizadas,
  produtos_aplicados,
  profissionais_envolvidos,
  onRequestBooking,
}: EstablishmentCardProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, session } = useAuth();
  const services = servicos_oferecidos.length
    ? servicos_oferecidos
    : ["Serviço a confirmar pelo estabelecimento"];
  const servicesLine = services.join(", ");

  const handleOpenDetails = () => {
    navigate(`/estabelecimentos/${encodeURIComponent(id)}`);
  };

  return (
    <article
      className="flex h-full w-full min-w-0 cursor-pointer flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
      onClick={handleOpenDetails}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleOpenDetails();
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={`Abrir detalhes de ${nome_estabelecimento}`}
    >
      <div className="relative h-52 w-full overflow-hidden bg-slate-100 sm:h-56">
        {foto_estabelecimento_url ? (
          <img
            src={foto_estabelecimento_url}
            alt={`Foto de ${nome_estabelecimento}`}
            className="h-full w-full object-cover transition duration-500 hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-slate-200 via-slate-100 to-emerald-100 text-sm font-semibold text-slate-500">
            Sem foto
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-slate-950/60 via-slate-900/10 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-end p-5 sm:p-6">
          <div className="shrink-0 rounded-2xl bg-white/15 p-2 shadow-sm ring-1 ring-white/20 backdrop-blur-sm">
            <CategoryIcon category={categoria} />
          </div>
        </div>
      </div>

      <div className="flex h-fit flex-col gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          <h3 className="truncate text-xl font-semibold text-slate-900 sm:text-2xl">
            {nome_estabelecimento}
          </h3>
          <p className="truncate text-sm text-slate-600 sm:text-base">
            {localizacao}
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm text-slate-700">
          <div className="truncate">
            <span className="font-semibold text-slate-800">CNPJ: </span>
            ***
          </div>
          <div className="truncate">
            <span className="font-semibold text-slate-800">Telefone: </span>
            {telefone}
          </div>
          <div className="truncate">
            <span className="font-semibold text-slate-800">Categoria: </span>
            {categoria}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <h4 className="text-sm font-semibold text-slate-900">
            Servicos oferecidos
          </h4>
          <p className="mt-2 truncate text-sm font-medium text-slate-900">
            {servicesLine}
          </p>
        </div>

        {isAuthenticated && session?.role === "cliente" ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRequestBooking({
                id,
                nome_estabelecimento,
                profissionais_envolvidos,
                servicos_oferecidos,
                tecnicas_utilizadas,
                produtos_aplicados,
              });
            }}
            className="w-full cursor-pointer rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
          >
            Solicitar agendamento
          </button>
        ) : isAuthenticated && session?.role === "estabelecimento" ? null : (
          <div className="flex items-center justify-around gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs leading-relaxed text-amber-900">
              Entre na sua conta para solicitar um agendamento.
            </p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRequestBooking({
                  id,
                  nome_estabelecimento,
                  profissionais_envolvidos,
                  servicos_oferecidos,
                  tecnicas_utilizadas,
                  produtos_aplicados,
                });
              }}
              className="w-fit shrink-0 cursor-pointer rounded-md bg-emerald-700 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
            >
              Entrar
            </button>
          </div>
        )}
      </div>
    </article>
  );
};

export default EstablishmentCard;
