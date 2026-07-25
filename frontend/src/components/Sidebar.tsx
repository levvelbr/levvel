import { useEffect, useState } from "react";
import { AuthModal } from "./AuthModal";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const stored = window.localStorage.getItem("loggedClient");
      setIsLoggedIn(Boolean(stored));
    } catch {
      setIsLoggedIn(false);
    }
  }, [isOpen]);

  return (
    <>
      {/* Overlay escuro que fica atrás do menu. Clicar nele fecha o menu. */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* O Menu em si */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <span className="font-bold text-lg text-slate-800">Menu</span>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:bg-slate-100 rounded-md cursor-pointer"
          >
            {/* Ícone de X para fechar */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav className="p-4 flex flex-col gap-2">
          {/* Links de navegação do sistema */}
          <a
            href="#"
            className="block px-4 py-2 text-slate-700 hover:bg-slate-100 focus:bg-slate-100 rounded-md font-medium"
          >
            Serviços
          </a>
          <a
            href="#"
            className="block px-4 py-2 text-slate-700 hover:bg-slate-100 focus:bg-slate-100 rounded-md font-medium"
          >
            Busca
          </a>
          <button
            type="button"
            className="block w-full rounded-md px-4 py-2 text-left font-medium text-slate-700 hover:bg-slate-100 focus:bg-slate-100"
            onClick={() => {
              if (isLoggedIn) {
                window.localStorage.removeItem("loggedClient");
                setIsLoggedIn(false);
              } else {
                setIsAuthModalOpen(true);
              }
              onClose();
            }}
          >
            {isLoggedIn ? "Sair" : "Login"}
          </button>
        </nav>
      </aside>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthChange={(name) => {
          setIsLoggedIn(Boolean(name));
        }}
      />
    </>
  );
};
