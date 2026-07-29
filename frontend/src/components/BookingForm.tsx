import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

export interface BookingEstablishment {
  id: string;
  nome_estabelecimento: string;
  profissionais_envolvidos: string[];
  servicos_oferecidos: string[];
  tecnicas_utilizadas: string[];
  produtos_aplicados: string[];
}

interface BookingFormProps {
  establishment: BookingEstablishment;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const getDefaultDateTime = () => {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d.toISOString().slice(0, 16);
};

const selectClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200";

export const BookingForm = ({
  establishment,
  onSuccess,
  onCancel,
}: BookingFormProps) => {
  const { session } = useAuth();
  const [profissional, setProfissional] = useState("");
  const [tratamento, setTratamento] = useState("");
  const [tecnica, setTecnica] = useState("");
  const [produto, setProduto] = useState("");
  const [dataHora, setDataHora] = useState(getDefaultDateTime);
  const [duracao, setDuracao] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    setLoading(true);
    setError(null);

    try {
      await api.post("/v1/agendamentos/", {
        estabelecimento_id: establishment.id,
        cliente_id: session.id,
        profissional_envolvido: profissional,
        tratamento,
        tecnica: tecnica || null,
        produto: produto || null,
        data_hora_inicio: new Date(dataHora).toISOString(),
        duracao_estimada_minutos: duracao,
      });
      setSuccess(true);
      setTimeout(() => onSuccess?.(), 1800);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erro ao criar agendamento.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Agendamento solicitado! Aguarde a confirmação do estabelecimento.
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Profissional *
          </label>
          <select
            required
            value={profissional}
            onChange={(e) => setProfissional(e.target.value)}
            className={selectClass}
          >
            <option value="">Selecione o profissional</option>
            {establishment.profissionais_envolvidos.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Serviço / Tratamento *
          </label>
          <select
            required
            value={tratamento}
            onChange={(e) => setTratamento(e.target.value)}
            className={selectClass}
          >
            <option value="">Selecione o serviço</option>
            {establishment.servicos_oferecidos.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {establishment.tecnicas_utilizadas.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Técnica{" "}
              <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <select
              value={tecnica}
              onChange={(e) => setTecnica(e.target.value)}
              className={selectClass}
            >
              <option value="">Sem preferência</option>
              {establishment.tecnicas_utilizadas.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}

        {establishment.produtos_aplicados.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Produto{" "}
              <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <select
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              className={selectClass}
            >
              <option value="">Sem preferência</option>
              {establishment.produtos_aplicados.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Data e horário *
          </label>
          <input
            type="datetime-local"
            required
            value={dataHora}
            onChange={(e) => setDataHora(e.target.value)}
            min={getDefaultDateTime()}
            className={selectClass}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Duração estimada (minutos)
          </label>
          <input
            type="number"
            min={15}
            max={480}
            step={15}
            value={duracao}
            onChange={(e) => setDuracao(Number(e.target.value))}
            className={selectClass}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && !success && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading || success}
          className="flex-1 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Solicitar agendamento"}
        </button>
      </div>
    </form>
  );
};
