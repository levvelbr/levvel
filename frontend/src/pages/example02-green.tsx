import { useState } from "react";

export const Example02Green = () => {
  // Estado para controlar o Dark Mode localmente
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Dados simulados
  const services = [
    {
      id: 1,
      title: "Massagem Relaxante",
      price: "R$ 120",
      tag: "Mais procurado",
      tagColor:
        "bg-brand-primary-green text-light-surface-green dark:text-dark-base-green",
      image:
        "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 2,
      title: "Acupuntura",
      price: "R$ 150",
      tag: "",
      image:
        "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 3,
      title: "Aula de Yoga",
      price: "R$ 80",
      tag: "Novidade",
      tagColor:
        "bg-brand-secondary-green text-light-surface-green dark:text-dark-base-green",
      image:
        "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
  ];

  return (
    <div className={`${isDarkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-light-bg-green dark:bg-dark-bg-green font-sans text-light-base-green dark:text-dark-base-green transition-colors duration-300">
        {/* Navbar */}
        <header className="flex items-center justify-between px-8 py-5 bg-light-surface-green dark:bg-dark-surface-green shadow-sm sticky top-0 z-50 transition-colors duration-300">
          <div className="flex items-center gap-2">
            <svg
              className="w-8 h-8 text-brand-primary-green"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-2xl font-bold text-light-base-green dark:text-dark-base-green">
              LevveL
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-light-muted-green dark:text-dark-muted-green">
            <a
              href="#"
              className="hover:text-brand-primary-green dark:hover:text-brand-primary-green transition-colors"
            >
              Serviços
            </a>
            <a
              href="#"
              className="hover:text-brand-primary-green dark:hover:text-brand-primary-green transition-colors"
            >
              Profissionais
            </a>
            <a
              href="#"
              className="hover:text-brand-primary-green dark:hover:text-brand-primary-green transition-colors"
            >
              Como Funciona
            </a>
            <a
              href="#"
              className="hover:text-brand-primary-green dark:hover:text-brand-primary-green transition-colors"
            >
              Depoimentos
            </a>
          </nav>

          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-light-muted-green dark:text-dark-muted-green hover:bg-light-alt-green dark:hover:bg-dark-alt-green transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {isDarkMode ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            <button className="hidden sm:flex items-center gap-2 bg-brand-primary-green hover:bg-brand-secondary-green text-light-surface-green dark:text-dark-bg-green px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Cadastre-se
            </button>
            <button className="text-light-muted-green dark:text-dark-muted-green hover:text-brand-primary-green dark:hover:text-brand-primary-green transition-colors sm:hidden">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative flex flex-col-reverse md:flex-row items-center justify-between px-8 md:px-16 py-16 md:py-24 max-w-7xl mx-auto overflow-hidden">
          {/* Background Blobs */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
            <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-light-alt-green dark:bg-dark-alt-green rounded-full blur-3xl opacity-60 dark:opacity-20 transition-colors duration-300"></div>
            <div className="absolute bottom-[-10%] right-[20%] w-[500px] h-[500px] bg-brand-secondary-green rounded-full blur-3xl opacity-20 dark:opacity-10 transition-colors duration-300"></div>
          </div>

          <div className="w-full md:w-1/2 flex flex-col gap-6 z-10 mt-10 md:mt-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-light-base-green dark:text-dark-base-green transition-colors duration-300">
              Encontre os melhores serviços de{" "}
              <br className="hidden lg:block" />
              <span className="text-brand-primary-green">bem-estar</span>
            </h1>
            <p className="text-lg text-light-muted-green dark:text-dark-muted-green max-w-md transition-colors duration-300">
              Conectamos você a profissionais qualificados para cuidar do seu
              corpo e mente.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button className="flex items-center justify-center gap-2 bg-brand-primary-green hover:bg-brand-secondary-green text-light-surface-green dark:text-dark-bg-green px-6 py-3 rounded-full font-medium transition-all shadow-md shadow-brand-primary-green/20">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Explorar Serviços
              </button>
              <button className="flex items-center justify-center gap-2 border-2 border-brand-primary-green text-brand-primary-green hover:bg-light-alt-green dark:hover:bg-dark-surface-green px-6 py-3 rounded-full font-medium transition-all">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Sou Profissional
              </button>
            </div>
          </div>

          <div className="w-full md:w-1/2 relative z-10">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-3 border-light-surface-green dark:border-dark-alt-green transition-colors duration-300">
              <img
                src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                alt="Massagem relaxante"
                className="w-full h-auto object-cover aspect-4/3"
              />
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="bg-light-surface-green dark:bg-dark-surface-green py-20 px-8 md:px-16 border-t border-light-alt-green dark:border-dark-alt-green transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-light-base-green dark:text-dark-base-green mb-4 transition-colors duration-300">
                Nossos Serviços
              </h2>
              <p className="text-light-muted-green dark:text-dark-muted-green transition-colors duration-300">
                Descubra uma variedade de serviços para melhorar sua qualidade
                de vida e bem-estar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-light-surface-green dark:bg-dark-surface-green rounded-2xl overflow-hidden shadow-xs border border-light-alt-green dark:border-dark-alt-green hover:shadow-md dark:shadow-none dark:hover:border-brand-primary-green/50 transition-all group cursor-pointer flex flex-col"
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {service.tag && (
                      <div
                        className={`absolute bottom-4 left-4 text-xs font-bold px-3 py-1 rounded-md shadow-sm ${service.tagColor}`}
                      >
                        {service.tag}
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex justify-between items-center bg-light-surface-green dark:bg-dark-surface-green transition-colors duration-300">
                    <h3 className="text-lg font-bold text-light-base-green dark:text-dark-base-green">
                      {service.title}
                    </h3>
                    <span className="text-brand-primary-green font-bold">
                      {service.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
