import { useState, type HTMLAttributes } from "react";

interface HeaderProps extends HTMLAttributes<HTMLElement> {
  onOpenMenu: () => void;
  loggedClientName: string | null;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Header = ({
  onOpenMenu,
  loggedClientName,
  onOpenLogin,
  onLogout,
  ...rest
}: HeaderProps) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  return (
    <header
      {...rest}
      className="flex items-center justify-between px-4 py-3 bg-linear-to-b shadow-xs border-b border-gray-100"
    >
      {/* 1. Esquerda: Ícone de Menu (Hamburguer) */}
      <button
        type="button"
        className="p-1 text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
        aria-label="Abrir menu"
        onClick={onOpenMenu}
      >
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
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>

      {/* 2. Centro: Logo e Nome */}
      <div className="flex items-center gap-2">
        <img
          src=""
          alt="Logo do sistema"
          className="w-8 h-8 bg-slate-200 rounded-md object-cover"
        />
        <span className="font-semibold text-lg text-slate-800 tracking-tight">
          LevveL
        </span>
      </div>

      {/* 3. Direita: Login */}
      <div className="flex items-center gap-2">
        {loggedClientName ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
            >
              <span>{loggedClientName}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>

            {isUserMenuOpen ? (
              <div className="absolute right-0 mt-2 w-40 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setIsUserMenuOpen(false);
                  }}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Sair
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenLogin}
            className="rounded-md border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
          >
            Login
          </button>
        )}
        <button
          type="button"
          className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-2 cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5 text-slate-500 md:hidden"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </button>
      </div>
    </header>
  );
};
