import {
  Children,
  cloneElement,
  isValidElement,
  useRef,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "../components/AuthModal";
import { useAuth } from "../contexts/AuthContext";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { BookingModal } from "../components/BookingModal";
import type { BookingEstablishment } from "../components/BookingForm";
import SearchBar from "../components/SearchBar";
import api from "../services/api";

interface LayoutProps {
  children?: ReactNode;
}

interface Establishment {
  id: string;
  categoria: string;
  ativo: boolean;
}

interface CategoryMeta {
  name: string;
  icon: string;
  color: string;
}

export const DashboardLayout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const { session, isAuthenticated, login, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [bookingEstablishment, setBookingEstablishment] =
    useState<BookingEstablishment | null>(null);
  const [pendingEstablishment, setPendingEstablishment] =
    useState<BookingEstablishment | null>(null);
  const heroSearchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchEstablishments = async () => {
      try {
        const response = await api.get(
          "/v1/estabelecimentos/listar_estabelecimentos",
        );
        const data = response.data as unknown;
        const items = Array.isArray(data)
          ? data
          : ((data as { data?: Establishment[] }).data ?? []);

        setEstablishments(items.filter((item) => item.ativo));
      } catch {
        setEstablishments([]);
      }
    };

    fetchEstablishments();
  }, []);

  useEffect(() => {
    if (window.location.hash) {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}`,
      );
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const searchElement = heroSearchRef.current;

      if (!searchElement) {
        setShowHeaderSearch(false);
        return;
      }

      const rect = searchElement.getBoundingClientRect();
      setShowHeaderSearch(rect.bottom <= 80);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const serviceCategories = useMemo(() => {
    const categories = Array.from(
      new Set(
        establishments
          .map((item) => item.categoria?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((a, b) => a.localeCompare(b));

    const categoryStyles: Record<string, CategoryMeta> = {
      Beleza: { name: "Beleza", icon: "✂", color: "from-pink-500 to-rose-500" },
      "Bem-estar": {
        name: "Bem-estar",
        icon: "🧘",
        color: "from-emerald-500 to-teal-500",
      },
      Saúde: { name: "Saúde", icon: "🩺", color: "from-sky-500 to-cyan-500" },
      Massagens: {
        name: "Massagens",
        icon: "💆‍♀️",
        color: "from-amber-500 to-orange-500",
      },
      Pets: { name: "Pets", icon: "🐶", color: "from-lime-500 to-green-500" },
      Moda: {
        name: "Moda",
        icon: "👗",
        color: "from-violet-500 to-fuchsia-500",
      },
    };

    return categories.map((category) => {
      const fallback = {
        name: category,
        icon: "🧴",
        color: "from-slate-500 to-slate-600",
      };

      return {
        ...(categoryStyles[category] ?? fallback),
      };
    });
  }, [establishments]);

  const toggleCategory = (categoryName: string) => {
    setActiveCategory((current) =>
      current === categoryName ? null : categoryName,
    );

    requestAnimationFrame(() => {
      const establishmentSection = document.getElementById("categories-title");
      if (establishmentSection) {
        establishmentSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  };

  const content = Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child;
    }

    return cloneElement(
      child as ReactElement<{
        selectedCategory?: string | null;
        searchQuery?: string;
        onRequestBooking?: (data: BookingEstablishment) => void;
      }>,
      {
        selectedCategory: activeCategory,
        searchQuery,
        onRequestBooking: (est: BookingEstablishment) => {
          if (!isAuthenticated) {
            setPendingEstablishment(est);
            setIsAuthModalOpen(true);
            return;
          }
          if (session?.role === "estabelecimento") {
            navigate("/perfil");
            return;
          }
          setBookingEstablishment(est);
        },
      },
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Passamos a função de abrir para o Header */}
      <Header
        onOpenMenu={() => setIsSidebarOpen(true)}
        loggedClientName={session?.nome ?? null}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onLogout={logout}
        showSearchBar={showHeaderSearch}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthChange={(nextSession) => {
          if (nextSession) {
            login(nextSession);
            setIsAuthModalOpen(false);
            if (nextSession.role === "cliente" && pendingEstablishment) {
              setBookingEstablishment(pendingEstablishment);
            }
            setPendingEstablishment(null);
          }
        }}
      />

      <BookingModal
        isOpen={Boolean(bookingEstablishment)}
        onClose={() => setBookingEstablishment(null)}
        establishment={bookingEstablishment}
      />

      {/* Passamos o estado e a função de fechar para o Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* O conteúdo da página */}
      <main className="flex-1">
        <section className="bg-linear-to-b from-gray-100 to-white pt-20 pb-10">
          <div className="container mx-auto px-4 text-center">
            <p className="inline-block bg-emerald-100 text-emerald-800 rounded-full px-3 py-1 text-sm mb-6">
              <span className="text-amber-500">✦</span> Leve uma vida Leve
            </p>

            <h1 className="text-4xl md:text-6xl font-serif font-semibold text-emerald-900 mb-4">
              Encontre o seu momento de{" "}
              <span className="text-amber-500 italic">bem-estar</span>
            </h1>

            <p className="text-slate-600 max-w-2xl mx-auto mb-6">
              Conectamos voce aos melhores profissionais. Explore servicos e
              conheca as descricoes de cada atendimento antes do login.
            </p>

            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => handleScrollToSection("services")}
                className="bg-emerald-700 text-white rounded-md px-6 py-3 hover:bg-emerald-800 cursor-pointer"
              >
                Explorar Serviços
              </button>
              <button
                type="button"
                onClick={() => handleScrollToSection("establishment-form")}
                className="border border-emerald-700 text-emerald-700 rounded-md px-6 py-3 hover:bg-emerald-50 cursor-pointer"
              >
                Sou Prestador
              </button>
            </div>

            <div
              ref={heroSearchRef}
              className="mx-auto mt-8 max-w-5xl hidden md:block"
            >
              <SearchBar value={searchQuery} onSearch={setSearchQuery} />
            </div>

            <div className="mt-10 mb-5 mx-auto max-w-5/6">
              <h2
                className="text-2xl md:text-3xl font-serif font-semibold text-emerald-900 mb-2"
                id="categories-title"
              >
                Categorias
              </h2>
              <div className="w-full overflow-x-auto pb-2 pt-5 scrollbar-none">
                <div
                  className="mx-auto flex w-max items-center justify-center gap-3 snap-x snap-mandatory scroll-px-4"
                  id="services"
                >
                  {serviceCategories.map((category) => {
                    const isActive = activeCategory === category.name;

                    return (
                      <button
                        key={category.name}
                        type="button"
                        onClick={() => toggleCategory(category.name)}
                        className={`flex h-26 w-26 min-w-22 shrink-0 snap-start flex-col items-center justify-center rounded-2xl border p-2 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                          isActive
                            ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
                            : "cursor-pointer border-emerald-100 bg-white/90"
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br ${category.color} text-sm text-white shadow-sm`}
                        >
                          {category.icon}
                        </div>
                        <p
                          className={`mt-2 text-[11px] font-semibold leading-tight truncate ${
                            isActive ? "text-emerald-800" : "text-slate-800"
                          }`}
                        >
                          {category.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div
          id="establishment-list"
          className="p-4 flex justify-center items-center"
        >
          <div className="grid w-full gap-8 ">{content}</div>
        </div>
      </main>
    </div>
  );
};
