export const EstablishmentAgendaPage = () => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">
        Agenda do estabelecimento
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Tela reservada para estabelecimento autenticado. Aqui entraremos com a
        listagem de agenda via GET /v1/agendamentos/estabelecimento/{"{"}
        estabelecimento_id{"}"}.
      </p>
    </section>
  );
};
