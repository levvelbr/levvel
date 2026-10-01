import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const AppLayout = () => {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                LevveL
              </p>
              <h1 className="text-xl font-semibold text-slate-900">
                Bem-vindo, {session?.nome}
              </h1>
              <p className="text-sm text-slate-600">Perfil: {session?.role}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/app"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Inicio
              </Link>

              {session?.role === "cliente" ? (
                <Link
                  to="/app/agendamentos/novo"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Novo agendamento
                </Link>
              ) : null}

              {session?.role === "estabelecimento" ? (
                <Link
                  to="/app/agenda"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Minha agenda
                </Link>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  navigate("/", { replace: true, state: null });
                  logout();
                }}
                className="rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
};
