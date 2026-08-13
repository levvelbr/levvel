import { Link } from "react-router-dom";

export const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto mt-20 max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center">
        <h1 className="text-2xl font-semibold text-amber-900">
          Acesso nao autorizado
        </h1>
        <p className="mt-2 text-sm text-amber-900">
          Seu perfil nao possui permissao para acessar esta area.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Voltar para inicio
        </Link>
      </div>
    </div>
  );
};
