import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const AppHomePage = () => {
  const { session } = useAuth();

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">
        Area autenticada
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Voce entrou como <strong>{session?.nome}</strong> ({session?.role}).
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {session?.role === "cliente" ? (
          <Link
            to="/app/agendamentos/novo"
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Solicitar agendamento
          </Link>
        ) : null}

        {session?.role === "estabelecimento" ? (
          <Link
            to="/app/agenda"
            className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Ver agenda
          </Link>
        ) : null}
      </div>
    </section>
  );
};
