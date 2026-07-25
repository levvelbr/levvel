import CategoryIcon from "./CategoryIcon";

interface EstablishmentCardProps {
  nome_estabelecimento: string;
  telefone: string;
  localizacao: string;
  categoria: string;
  cnpj: string;
  servicos_oferecidos: string[];
  tecnicas_utilizadas: string[];
  produtos_aplicados: string[];
  profissionais_envolvidos: string[];
  onRequestLogin: () => void;
}

export const EstablishmentCard = ({
  nome_estabelecimento,
  telefone,
  localizacao,
  categoria,
  cnpj,
  servicos_oferecidos,
  onRequestLogin,
}: EstablishmentCardProps) => {
  const services = servicos_oferecidos.length
    ? servicos_oferecidos
    : ["Serviço a confirmar pelo estabelecimento"];
  const servicesLine = services.join(", ");

  return (
    <article className="flex h-full w-full min-w-0 flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-xl font-semibold text-slate-900">
            {nome_estabelecimento}
          </h3>
          <p className="truncate text-sm text-slate-600">{localizacao}</p>
        </div>
        <CategoryIcon category={categoria} />
      </div>

      <div className="flex flex-col gap-2 text-sm text-slate-700">
        <div className="truncate">
          <span className="font-semibold text-slate-800">CNPJ: </span>
          {cnpj}
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

      <div className="mt-auto rounded-2xl border border-amber-200 bg-amber-50 p-3">
        <p className="wrap-break-words text-sm leading-relaxed text-amber-900">
          Agendamento indisponivel nesta tela inicial. Para solicitar, faca
          login.
        </p>
        <button
          type="button"
          onClick={onRequestLogin}
          className="mt-3 w-full rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 sm:w-auto"
        >
          Solicitar agendamento
        </button>
      </div>
    </article>
  );
};

export default EstablishmentCard;
