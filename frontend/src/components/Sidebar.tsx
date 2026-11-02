import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  Handshake,
  Home,
  LogIn,
  LogOut,
  MessageCircle,
  Scissors,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

export const Sidebar = ({ isOpen, onClose, onOpenLogin }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, session, logout } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const header = document.querySelector("header");
    header?.setAttribute("inert", "");
    return () => header?.removeAttribute("inert");
  }, [isOpen]);

  const bookingsLabel =
    session?.role === "estabelecimento" ? "Minha agenda" : "Meus agendamentos";

  const handleLogout = () => {
    navigate("/", { replace: true, state: null });
    logout();
    onClose();
  };

  const getNavigationClassName = (isActive: boolean) =>
    `flex items-center gap-3 rounded-md px-4 py-2 transition-colors ${
      isActive
        ? session?.role === "estabelecimento"
          ? "bg-blue-50 text-blue-800 font-semibold"
          : "bg-slate-50 text-slate-700 font-semibold"
        : "text-slate-700 hover:bg-slate-100 focus:bg-slate-100"
    }`;

  const isBookingsPage =
    location.pathname === "/perfil" &&
    new URLSearchParams(location.search).get("tab") === "bookings";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/50 transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-70 h-full w-72 transform bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          <span className="font-bold text-lg text-slate-800">Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-500 hover:bg-slate-100 rounded-md cursor-pointer"
            aria-label="Fechar menu"
          >
            <X className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>

        <nav className="flex flex-col gap-2 p-4">
          {!isAuthenticated ? (
            <button
              type="button"
              className="group flex w-full items-center gap-3 rounded-md  px-4 py-2 text-left cursor-pointer font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 focus:bg-emerald-100"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
            >
              <LogIn
                className="h-5 w-5 text-emerald-700 group-hover:text-emerald-800"
                strokeWidth={1.5}
              />
              Login
            </button>
          ) : null}

          <Link
            to="/"
            onClick={onClose}
            className={getNavigationClassName(location.pathname === "/")}
          >
            <Home
              className={`h-5 w-5 ${
                location.pathname === "/" ? "text-slate-700 " : "text-slate-500"
              }`}
              strokeWidth={`${location.pathname === "/" ? 2 : 1.5}`}
            />
            Home
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to={
                  session?.role === "estabelecimento"
                    ? "/?providerTab=profile"
                    : "/perfil"
                }
                onClick={onClose}
                className={getNavigationClassName(
                  location.pathname === "/perfil" && !isBookingsPage,
                )}
              >
                <User
                  className={`h-5 w-5 ${
                    location.pathname === "/perfil"
                      ? "text-slate-700 "
                      : "text-slate-500"
                  }`}
                  strokeWidth={`${location.pathname === "/perfil" ? 2 : 1.5}`}
                />
                Meu perfil
              </Link>

              <Link
                to="/perfil?tab=bookings"
                onClick={onClose}
                className={getNavigationClassName(isBookingsPage)}
              >
                <Calendar
                  className={`h-5 w-5 ${
                    isBookingsPage
                      ? session?.role === "estabelecimento"
                        ? "text-blue-700"
                        : "text-slate-700"
                      : "text-slate-500"
                  }`}
                  strokeWidth={`${location.pathname === "/" ? 2 : 1.5}`}
                />
                {bookingsLabel}
              </Link>
            </>
          ) : null}

          {session?.role !== "estabelecimento" ? (
            <Link
              to="/servicos"
              onClick={onClose}
              className={getNavigationClassName(
                location.pathname === "/servicos",
              )}
            >
              <Scissors
                className={`h-5 w-5 ${
                  location.pathname === "/servicos"
                    ? "text-slate-700 "
                    : "text-slate-500"
                }`}
                strokeWidth={`${location.pathname === "/servicos" ? 2 : 1.5}`}
              />
              Serviços
            </Link>
          ) : null}

          {session?.role !== "estabelecimento" ? (
            <Link
              to="/sou-prestador"
              onClick={onClose}
              className={getNavigationClassName(
                location.pathname === "/sou-prestador",
              )}
            >
              <Handshake
                className={`h-5 w-5 ${
                  location.pathname === "/sou-prestador"
                    ? "text-slate-700 "
                    : "text-slate-500"
                }`}
                strokeWidth={`${location.pathname === "/sou-prestador" ? 2 : 1.5}`}
              />
              Sou Prestador
            </Link>
          ) : null}

          <Link
            to="/contato"
            onClick={onClose}
            className={getNavigationClassName(location.pathname === "/contato")}
          >
            <MessageCircle
              className={`h-5 w-5 ${
                location.pathname === "/contato"
                  ? "text-slate-700 "
                  : "text-slate-500"
              }`}
              strokeWidth={`${location.pathname === "/contato" ? 2 : 1.5}`}
            />
            Contato
          </Link>

          {isAuthenticated ? (
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-md px-4 py-2 text-left font-medium text-slate-700 hover:bg-slate-100 focus:bg-slate-100"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
              Sair
            </button>
          ) : null}
        </nav>
      </aside>
    </>
  );
};
