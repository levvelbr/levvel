import { useEffect, useState } from "react";
// Lembre-se de ajustar os caminhos de importação conforme a sua estrutura de pastas
import { Example01Green } from "../pages/example01-green";
import { Example01Blue } from "../pages/example01-blue";
import { Example02Green } from "../pages/example02-green";
import { Example02Blue } from "../pages/example02-blue";

export const AppShowcase = () => {
  // Estados para controlar a visualização
  const [layout, setLayout] = useState<"01" | "02">("01");
  const [colorTheme, setColorTheme] = useState<"green" | "blue">("green");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Efeito global para adicionar/remover a classe 'dark' no HTML
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Função para renderizar o componente correto
  const renderSelectedComponent = () => {
    if (layout === "01" && colorTheme === "green") return <Example01Green />;
    if (layout === "01" && colorTheme === "blue") return <Example01Blue />;
    if (layout === "02" && colorTheme === "green") return <Example02Green />;
    if (layout === "02" && colorTheme === "blue") return <Example02Blue />;
  };

  return (
    <div className="relative min-h-screen">
      {/* O componente da página renderiza aqui */}
      {renderSelectedComponent()}

      {/* Painel Flutuante de Controle (Efeito Glassmorphism) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
        <div className="bg-white/90 dark:bg-[#161C18]/90 backdrop-blur-md p-3 rounded-full shadow-2xl border border-gray-200 dark:border-gray-800 flex items-center gap-4 transition-colors duration-300">
          {/* Seletor de Layout */}
          <div className="flex items-center gap-3 pl-2">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Layout:
            </span>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1 shadow-inner transition-colors duration-300">
              <button
                onClick={() => setLayout("01")}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  layout === "01"
                    ? "bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                01
              </button>
              <button
                onClick={() => setLayout("02")}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  layout === "02"
                    ? "bg-white dark:bg-gray-600 shadow-sm text-black dark:text-white"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                02
              </button>
            </div>
          </div>

          <div className="w-px h-8 bg-gray-300 dark:bg-gray-700 transition-colors duration-300"></div>

          {/* Seletor de Cor */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
              Cor:
            </span>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-full p-1 shadow-inner transition-colors duration-300">
              <button
                onClick={() => setColorTheme("green")}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  colorTheme === "green"
                    ? "bg-[#87B38D] shadow-sm text-white"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Verde
              </button>
              <button
                onClick={() => setColorTheme("blue")}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  colorTheme === "blue"
                    ? "bg-[#88B2CC] shadow-sm text-white"
                    : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                Azul
              </button>
            </div>
          </div>

          <div className="w-px h-8 bg-gray-300 dark:bg-gray-700 transition-colors duration-300"></div>

          {/* Toggle Dark Mode */}
          <div className="pr-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 shadow-inner"
              aria-label="Alternar tema"
              title="Alternar Modo Escuro"
            >
              {isDarkMode ? (
                // Ícone de Sol (Modo Escuro ativo)
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
                // Ícone de Lua (Modo Claro ativo)
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
          </div>
        </div>
      </div>
    </div>
  );
};
