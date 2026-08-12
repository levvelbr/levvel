import { Link, useNavigate } from "react-router-dom";
import { Calendar, Home, LogIn, LogOut, Scissors, User, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

export const Sidebar = ({ isOpen, onClose, onOpenLogin }: SidebarProps) => {
  const navigate = useNavigate();
  const { isAuthenticated, session, logout } = useAuth();

  const bookingsLabel =
    session?.role === "estabelecimento" ? "Minha agenda" : "Meus agendamentos";

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/");
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 transform bg-white shadow-xl transition-transform duration-300 ease-in-out ${
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
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-3 rounded-md px-4 py-2 font-medium text-slate-700 hover:bg-slate-100 focus:bg-slate-100"
          >
            <Home className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
            Home
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/perfil"
                onClick={onClose}
                className="flex items-center gap-3 rounded-md px-4 py-2 font-medium text-slate-700 hover:bg-slate-100 focus:bg-slate-100"
              >
                <User className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
                Meu perfil
              </Link>

              <Link
                to="/perfil?tab=bookings"
                onClick={onClose}
                className="flex items-center gap-3 rounded-md px-4 py-2 font-medium text-slate-700 hover:bg-slate-100 focus:bg-slate-100"
              >
                <Calendar
                  className="h-5 w-5 text-slate-500"
                  strokeWidth={1.5}
                />
                {bookingsLabel}
              </Link>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-md px-4 py-2 text-left font-medium text-slate-700 hover:bg-slate-100 focus:bg-slate-100"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
                Sair
              </button>
            </>
          ) : (
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-md px-4 py-2 text-left font-medium text-slate-700 hover:bg-slate-100 focus:bg-slate-100"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
            >
              <LogIn className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
              Login
            </button>
          )}

          {session?.role !== "estabelecimento" ? (
            <Link
              to="/servicos"
              onClick={onClose}
              className="flex w-full items-center gap-3 rounded-md px-4 py-2 text-left font-medium text-slate-700 hover:bg-slate-100 focus:bg-slate-100"
            >
              <Scissors className="h-5 w-5 text-slate-500" strokeWidth={1.5} />
              Serviços
            </Link>
          ) : null}
        </nav>
      </aside>
    </>
  );
};
