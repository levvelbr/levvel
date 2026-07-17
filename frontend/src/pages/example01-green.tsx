import { useState, useEffect } from "react";

export const Example01Green = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Efeito para adicionar/remover a classe 'dark' no HTML da página
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // Dados simulados para as categorias
  const categories = [
    { id: 1, title: "Psicologia", icon: "🧠" },
    { id: 2, title: "Nutrição", icon: "🥗" },
    { id: 3, title: "Fisioterapia", icon: "💆" },
    { id: 4, title: "Yoga", icon: "🧘" },
  ];

  return (
    <div className="min-h-screen bg-light-bg-green dark:bg-dark-bg-green font-sans text-light-base-green dark:text-dark-base-green transition-colors duration-300">
      {/* Navbar - Efeito Glassmorphism sutil */}
      <header className="flex items-center justify-between px-8 py-4 bg-light-bg-green/80 dark:bg-dark-bg-green/80 backdrop-blur-md sticky top-0 z-50 border-b border-light-alt-green dark:border-dark-alt-green transition-colors duration-300">
        <div className="flex items-center gap-2">
          {/* Ícone imitando a logo da imagem */}
          <div className="w-8 h-8 bg-brand-secondary-green rounded-full flex items-center justify-center text-light-surface-green">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
            </svg>
          </div>
          <span className="text-2xl font-bold font-serif text-light-base-green dark:text-dark-base-green">
            LevveL
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-light-muted-green dark:text-dark-muted-green">
          <a
            href="#"
            className="hover:text-brand-primary-green dark:hover:text-brand-primary-green transition-colors"
          >
            Início
          </a>
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
            Entrar
          </a>
        </nav>

        <div className="flex items-center gap-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full text-light-muted-green dark:text-dark-muted-green hover:bg-light-alt-green dark:hover:bg-dark-alt-green transition-colors"
            aria-label="Alternar tema"
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

          <button className="hidden sm:flex items-center bg-brand-secondary-green hover:bg-brand-primary-green text-light-surface-green dark:text-dark-base-green px-5 py-2.5 rounded-full text-sm font-medium transition-all">
            Sou Prestador
          </button>
        </div>
      </header>

      {/* Hero Section Centralizada */}
      <section className="relative flex flex-col items-center justify-center px-4 py-20 md:py-28 max-w-4xl mx-auto text-center">
        {/* Badge superior */}
        <div className="flex items-center gap-2 bg-light-alt-green dark:bg-dark-surface-green border border-light-muted-green/10 dark:border-dark-alt-green px-4 py-1.5 rounded-full mb-8">
          <span className="text-brand-secondary-green text-xs">✦</span>
          <span className="text-xs font-medium text-light-muted-green dark:text-dark-muted-green">
            Plataforma de{" "}
            <span className="text-brand-secondary-green">Bem-Estar</span>
          </span>
        </div>

        {/* Título com mistura de fontes (Sans e Serif) */}
        <h1 className="text-4xl md:text-6xl font-bold leading-tight text-light-base-green dark:text-dark-base-green mb-6 font-serif">
          Encontre o seu momento de <br className="hidden sm:block" />
          <strong className="text-brand-primary-green italic">bem-estar</strong>
        </h1>

        <p className="text-base md:text-lg text-light-muted-green dark:text-dark-muted-green max-w-2xl mx-auto mb-10">
          Conectamos você aos melhores profissionais de saúde e bem-estar.{" "}
          <br className="hidden sm:block" />
          Explore serviços, agende online e cuide de você.
        </p>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 mb-14 w-full sm:w-auto">
          <button className="bg-brand-secondary-green hover:bg-brand-primary-green text-light-surface-green dark:text-dark-base-green px-8 py-3.5 rounded-xl font-medium transition-all shadow-md">
            Explorar Serviços
          </button>
          <button className="border border-brand-secondary-green text-brand-secondary-green hover:bg-light-alt-green dark:hover:bg-dark-surface-green px-8 py-3.5 rounded-xl font-medium transition-all">
            Sou Prestador
          </button>
        </div>

        {/* Barra de Pesquisa Flutuante */}
        <div className="w-full max-w-3xl bg-light-surface-green dark:bg-dark-surface-green p-2 rounded-2xl md:rounded-full shadow-lg border border-light-alt-green dark:border-dark-alt-green flex flex-col md:flex-row items-center gap-2 transition-colors duration-300">
          <div className="flex-1 flex items-center px-4 w-full">
            <svg
              className="w-5 h-5 text-light-muted-green dark:text-dark-muted-green mr-3"
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
            <input
              type="text"
              placeholder="Buscar serviços, categorias, prestadores..."
              className="w-full bg-transparent border-none outline-none text-light-base-green dark:text-dark-base-green placeholder-light-muted-green/70 dark:placeholder-dark-muted-green/70 py-3"
            />
          </div>
          <button className="w-full md:w-auto bg-brand-secondary-green hover:bg-brand-primary-green text-light-surface-green dark:text-dark-base-green px-8 py-3 rounded-xl md:rounded-full font-medium transition-all">
            Buscar
          </button>
        </div>
      </section>

      {/* Categorias Section */}
      <section className="px-8 md:px-16 pb-24 max-w-7xl mx-auto">
        <div className="mb-10">
          <h2 className="text-3xl font-bold font-serif text-light-base-green dark:text-dark-base-green mb-2">
            Categorias
          </h2>
          <p className="text-light-muted-green dark:text-dark-muted-green">
            Explore por área de bem-estar
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-light-surface-green dark:bg-dark-surface-green p-6 rounded-2xl border border-light-alt-green dark:border-dark-alt-green shadow-sm hover:shadow-md dark:shadow-none hover:-translate-y-1 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4"
            >
              <div className="w-16 h-16 bg-light-bg-green dark:bg-dark-bg-green rounded-full flex items-center justify-center text-2xl">
                {category.icon}
              </div>
              <h3 className="font-medium text-light-base-green dark:text-dark-base-green">
                {category.title}
              </h3>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
