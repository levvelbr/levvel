import { Calendar, Home, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const EstablishmentNavigation = () => {
  const location = useLocation();
  const providerTab = new URLSearchParams(location.search).get("providerTab");
  const isHomeActive = location.pathname === "/" && !providerTab;
  const isAgendaActive = location.pathname === "/" && providerTab === "agenda";
  const isProfileActive =
    location.pathname === "/" && providerTab === "profile";

  const getLinkClassName = (isActive: boolean) =>
    `inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
      isActive
        ? "bg-blue-700 text-white"
        : "text-slate-600 hover:bg-blue-50 hover:text-blue-800"
    }`;

  return (
    <nav
      aria-label="Navegação do estabelecimento"
      className="flex w-fit max-w-full flex-wrap items-center gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200"
    >
      <Link
        to="/"
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-800 ${isHomeActive ? "bg-blue-700 text-white hover:bg-blue-800 hover:text-white" : ""}`}
        aria-label="Página inicial"
      >
        <Home className="h-5 w-5" strokeWidth={1.8} />
      </Link>
      <Link
        to="/?providerTab=profile"
        className={getLinkClassName(isProfileActive)}
      >
        <User className="h-4 w-4" strokeWidth={1.8} />
        Meu perfil
      </Link>
      <Link
        to="/?providerTab=agenda"
        className={getLinkClassName(isAgendaActive)}
      >
        <Calendar className="h-4 w-4" strokeWidth={1.8} />
        Agenda
      </Link>
    </nav>
  );
};
