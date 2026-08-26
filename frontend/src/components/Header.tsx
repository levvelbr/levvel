import { useEffect, useState, type HTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, LoaderCircle, Menu, Search, X } from "lucide-react";
import SearchBar from "./SearchBar";

interface HeaderProps extends HTMLAttributes<HTMLElement> {
  onOpenMenu: () => void;
  loggedClientName: string | null;
  loggedClientPhotoUrl?: string | null;
  loggedClientRole?: "cliente" | "estabelecimento" | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  showSearchBar?: boolean;
  searchQuery?: string;
  onSearch?: (query: string) => void;
  hideMobileSearchToggle?: boolean;
  compactUserProfile?: boolean;
}

interface UserAvatarProps {
  name: string;
  photoUrl?: string | null;
  compact?: boolean;
}

const ROLE_LABELS: Record<"cliente" | "estabelecimento", string> = {
  cliente: "Cliente",
  estabelecimento: "Estabelecimento",
};

interface UserMenuHeaderProps {
  name: string;
  role?: "cliente" | "estabelecimento" | null;
}

const UserMenuHeader = ({ name, role }: UserMenuHeaderProps) => (
  <div className="mb-2 border-b border-slate-100 px-3 pb-2">
    <p className="truncate text-sm font-semibold text-slate-800">{name}</p>
    {role ? (
      <span className="text-xs font-medium text-emerald-700">
        {ROLE_LABELS[role]}
      </span>
    ) : null}
  </div>
);

const UserAvatar = ({ name, photoUrl, compact = false }: UserAvatarProps) => {
  const normalizedName = name.trim();
  const initial = normalizedName ? normalizedName.charAt(0).toUpperCase() : "?";
  const [isLoading, setIsLoading] = useState(Boolean(photoUrl));
  const [hasPhoto, setHasPhoto] = useState(Boolean(photoUrl));
  const avatarSize = compact ? "h-6 w-6" : "h-7 w-7";

  useEffect(() => {
    setIsLoading(Boolean(photoUrl));
    setHasPhoto(Boolean(photoUrl));
  }, [photoUrl]);

  if (photoUrl && hasPhoto) {
    return (
      <span
        className={`relative flex ${avatarSize} shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-100 bg-emerald-100 text-xs font-bold text-emerald-900`}
      >
        <span
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
            isLoading ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        >
          <LoaderCircle
            className="h-4 w-4 animate-spin text-emerald-700"
            strokeWidth={1.8}
          />
        </span>
        <span className={isLoading ? "opacity-0" : "opacity-100"}>
          {initial}
        </span>
        <img
          src={photoUrl}
          alt={`Foto de perfil de ${name}`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasPhoto(false);
          }}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
        />
      </span>
    );
  }

  return (
    <span
      className={`flex ${avatarSize} items-center justify-center rounded-full bg-emerald-200 text-xs font-bold text-emerald-900`}
    >
      {initial}
    </span>
  );
};

const BrandLink = () => {
  return (
    <Link
      to="/"
      className="flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-slate-100"
      aria-label="Ir para a página inicial"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-linear-to-br from-emerald-700 to-emerald-500 text-sm font-semibold text-white">
        L
      </span>
      <span className="text-lg font-semibold tracking-tight text-slate-800 hidden lg:block">
        LevveL
      </span>
    </Link>
  );
};

export const Header = ({
  onOpenMenu,
  loggedClientName,
  loggedClientPhotoUrl,
  loggedClientRole,
  onOpenLogin,
  onLogout,
  showSearchBar = false,
  searchQuery = "",
  onSearch,
  hideMobileSearchToggle = false,
  compactUserProfile = false,
  ...rest
}: HeaderProps) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const isMobileSearchVisible =
    isMobileSearchOpen || (hideMobileSearchToggle && showSearchBar);

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
            isMobileSearchVisible ? "opacity-0" : "opacity-100"
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
                <Menu className="h-6 w-6" strokeWidth={1.5} />
              </button>

              <BrandLink />
            </div>

            <div />

            <div className="flex items-center justify-end gap-2">
              {loggedClientName ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    aria-label={loggedClientName}
                    className={`flex items-center rounded-md bg-emerald-50 text-sm font-semibold text-emerald-800 ${
                      compactUserProfile ? "gap-0 p-1.5" : "gap-2 px-2 py-2"
                    }`}
                  >
                    <UserAvatar
                      name={loggedClientName}
                      photoUrl={loggedClientPhotoUrl}
                      compact={compactUserProfile}
                    />
                    <span
                      className={
                        compactUserProfile
                          ? "sr-only"
                          : "max-w-24 truncate sm:max-w-none"
                      }
                    >
                      {loggedClientName}
                    </span>
                    {compactUserProfile ? null : (
                      <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                    )}
                  </button>

                  {isUserMenuOpen ? (
                    <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                      <UserMenuHeader
                        name={loggedClientName}
                        role={loggedClientRole}
                      />
                      <Link
                        to="/perfil"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Meu perfil
                      </Link>
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

              {hideMobileSearchToggle ? null : (
                <button
                  type="button"
                  onClick={handleToggleMobileSearch}
                  className="cursor-pointer px-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                  aria-label="Abrir busca"
                >
                  <Search
                    className="h-5 w-5 text-slate-500"
                    strokeWidth={1.5}
                  />
                </button>
              )}
            </div>
          </div>
        </div>

        <div
          className={`absolute inset-0 flex items-center gap-3 transition-all duration-200 ease-out md:hidden ${
            isMobileSearchVisible
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0"
          }`}
        >
          {hideMobileSearchToggle ? (
            <>
              <button
                type="button"
                className="shrink-0 cursor-pointer rounded-md p-1 text-slate-600 transition-colors hover:bg-slate-100"
                aria-label="Abrir menu"
                onClick={onOpenMenu}
              >
                <Menu className="h-6 w-6" strokeWidth={1.5} />
              </button>

              <SearchBar
                className="min-w-0 flex-1"
                value={searchQuery}
                onSearch={onSearch}
                compact
                autoFocusInput={isMobileSearchVisible}
              />

              {loggedClientName ? (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    aria-label={loggedClientName}
                    className="flex items-center rounded-md bg-emerald-50 p-1.5 text-emerald-800"
                  >
                    <UserAvatar
                      name={loggedClientName}
                      photoUrl={loggedClientPhotoUrl}
                      compact
                    />
                  </button>

                  {isUserMenuOpen ? (
                    <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                      <UserMenuHeader
                        name={loggedClientName}
                        role={loggedClientRole}
                      />
                      <Link
                        to="/perfil"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Meu perfil
                      </Link>
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
                  className="shrink-0 rounded-md border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                >
                  Login
                </button>
              )}
            </>
          ) : (
            <>
              <SearchBar
                className="flex-1"
                value={searchQuery}
                onSearch={onSearch}
                compact
                autoFocusInput={isMobileSearchVisible}
              />

              <button
                type="button"
                onClick={handleToggleMobileSearch}
                className="shrink-0 rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50"
                aria-label="Fechar busca"
              >
                <X className="h-5 w-5" strokeWidth={1.8} />
              </button>
            </>
          )}
        </div>

        <div className="hidden md:grid md:w-full md:grid-cols-[auto_1fr_auto] md:items-center md:gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="cursor-pointer rounded-md p-1 text-slate-600 transition-colors hover:bg-slate-100"
              aria-label="Abrir menu"
              onClick={onOpenMenu}
            >
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            </button>

            <BrandLink />
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
                  aria-label={loggedClientName}
                  className="flex items-center gap-2 rounded-md bg-emerald-50 px-2 py-2 text-sm font-semibold text-emerald-800"
                >
                  <UserAvatar
                    name={loggedClientName}
                    photoUrl={loggedClientPhotoUrl}
                  />
                  <span className="max-w-24 truncate sm:max-w-none">
                    {loggedClientName}
                  </span>
                  <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                </button>

                {isUserMenuOpen ? (
                  <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                    <UserMenuHeader
                      name={loggedClientName}
                      role={loggedClientRole}
                    />
                    <Link
                      to="/perfil"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      Meu perfil
                    </Link>
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
