import { useLayoutEffect, useRef, useState } from "react";
import { Calendar, Home, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const EstablishmentNavigation = () => {
  const location = useLocation();
  const providerTab = new URLSearchParams(location.search).get("providerTab");
  const isHomeActive = location.pathname === "/" && !providerTab;
  const isAgendaActive = location.pathname === "/" && providerTab === "agenda";
  const isProfileActive =
    location.pathname === "/" && providerTab === "profile";
  const activeKey = isHomeActive
    ? "home"
    : isProfileActive
      ? "profile"
      : isAgendaActive
        ? "agenda"
        : null;

  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [indicator, setIndicator] = useState<{
    left: number;
    width: number;
  } | null>(null);

  useLayoutEffect(() => {
    const update = () => {
      const el = activeKey ? itemRefs.current[activeKey] : null;
      setIndicator(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [activeKey]);

  const getLinkClassName = (isActive: boolean) =>
    `relative z-10 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-300 ${
      isActive ? "text-white" : "text-slate-600 hover:text-blue-800"
    }`;

  return (
    <nav
      aria-label="Navegação do estabelecimento"
      className="relative flex w-fit max-w-full flex-wrap items-center gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-slate-200"
    >
      {indicator ? (
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 rounded-xl bg-blue-700 transition-[left,width] duration-300 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      ) : null}
      <Link
        to="/"
        ref={(el) => {
          itemRefs.current.home = el;
        }}
        className={`relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-300 ${isHomeActive ? "text-white" : "text-slate-600 hover:text-blue-800"}`}
        aria-label="Página inicial"
      >
        <Home className="h-5 w-5" strokeWidth={1.8} />
      </Link>
      <Link
        to="/?providerTab=profile"
        ref={(el) => {
          itemRefs.current.profile = el;
        }}
        className={getLinkClassName(isProfileActive)}
      >
        <User className="h-4 w-4" strokeWidth={1.8} />
        Meu perfil
      </Link>
      <Link
        to="/?providerTab=agenda"
        ref={(el) => {
          itemRefs.current.agenda = el;
        }}
        className={getLinkClassName(isAgendaActive)}
      >
        <Calendar className="h-4 w-4" strokeWidth={1.8} />
        Agenda
      </Link>
    </nav>
  );
};
