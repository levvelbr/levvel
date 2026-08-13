import termosPrivacidadePdf from "../assets/TERMOS DE USO E POLÍTICA DE PRIVACIDADE.pdf";

export const TermsPrivacyPage = () => {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            Termos de Uso e Politicas de Privacidade
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Esta pagina disponibiliza o documento completo com os Termos de Uso
            e Politicas de Privacidade da plataforma em um unico documento.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              id="termos-politicas-privacidade"
              href={termosPrivacidadePdf}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Abrir Termos de Uso e Politicas de Privacidade
            </a>
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">
            Documento completo
          </h2>
          <object
            data={termosPrivacidadePdf}
            type="application/pdf"
            className="h-[75vh] w-full rounded-2xl border border-slate-200"
            aria-label="Termos de uso e politica de privacidade"
          >
            <p className="p-4 text-sm text-slate-700">
              Nao foi possivel exibir o PDF no navegador. Use o link abaixo para
              abrir o documento.
            </p>
            <a
              href={termosPrivacidadePdf}
              target="_blank"
              rel="noreferrer"
              className="px-4 pb-4 text-sm font-semibold text-emerald-700 underline"
            >
              Abrir documento completo em nova aba
            </a>
          </object>
        </section>
      </div>
    </main>
  );
};
