import { useState, type HTMLAttributes } from "react";
import SearchBar from "./SearchBar";

interface HeaderProps extends HTMLAttributes<HTMLElement> {
  onOpenMenu: () => void;
  loggedClientName: string | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  showSearchBar?: boolean;
  searchQuery?: string;
  onSearch?: (query: string) => void;
}

export const Header = ({
  onOpenMenu,
  loggedClientName,
  onOpenLogin,
  onLogout,
  showSearchBar = false,
  searchQuery = "",
  onSearch,
  ...rest
}: HeaderProps) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handleToggleMobileSearch = () => {
    setIsMobileSearchOpen((current) => !current);
    setIsUserMenuOpen(false);
  };

  return (
    <header
      {...rest}
      className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 px-4 py-3 shadow-xs backdrop-blur"
    >
      <div className="relative mx-auto w-full max-w-7xl">
        <div
          className={`flex min-h-12 items-center transition-all duration-200 ease-out md:hidden ${
            isMobileSearchOpen ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="cursor-pointer rounded-md p-1 text-slate-600 transition-colors hover:bg-slate-100"
                aria-label="Abrir menu"
                onClick={onOpenMenu}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-6 w-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              </button>

              <div className="flex items-center gap-2">
                <img
                  src=""
                  alt="Logo do sistema"
                  className="h-8 w-8 rounded-md bg-slate-200 object-cover"
                />
                <span className="text-lg font-semibold tracking-tight text-slate-800">
                  LevveL
                </span>
              </div>
            </div>

            <div />

            <div className="flex items-center justify-end gap-2">
              {loggedClientName ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    className="flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
                  >
                    <span className="max-w-24 truncate sm:max-w-none">
                      {loggedClientName}
                    </span>
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
                onClick={handleToggleMobileSearch}
                className="cursor-pointer px-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                aria-label="Abrir busca"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5 text-slate-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div
          className={`absolute inset-0 flex items-center gap-3 transition-all duration-200 ease-out md:hidden ${
            isMobileSearchOpen
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          }`}
        >
          <SearchBar
            className="flex-1"
            value={searchQuery}
            onSearch={onSearch}
            compact
            autoFocusInput={isMobileSearchOpen}
          />

          <button
            type="button"
            onClick={handleToggleMobileSearch}
            className="shrink-0 rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50"
            aria-label="Fechar busca"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.8}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="hidden md:grid md:w-full md:grid-cols-[auto_1fr_auto] md:items-center md:gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="cursor-pointer rounded-md p-1 text-slate-600 transition-colors hover:bg-slate-100"
              aria-label="Abrir menu"
              onClick={onOpenMenu}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>

            <div className="flex items-center gap-2">
              <img
                src=""
                alt="Logo do sistema"
                className="h-8 w-8 rounded-md bg-slate-200 object-cover"
              />
              <span className="text-lg font-semibold tracking-tight text-slate-800">
                LevveL
              </span>
            </div>
          </div>

          <div className="hidden md:flex md:justify-center">
            <div
              className={`w-full max-w-xl transition-all duration-300 ease-out ${
                showSearchBar
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-2 opacity-0"
              }`}
            >
              <SearchBar
                className="w-full"
                value={searchQuery}
                onSearch={onSearch}
                compact
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            {loggedClientName ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
                >
                  <span className="max-w-24 truncate sm:max-w-none">
                    {loggedClientName}
                  </span>
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
          </div>
        </div>
      </div>
    </header>
  );
};
