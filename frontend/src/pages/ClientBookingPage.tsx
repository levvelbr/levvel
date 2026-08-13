export const ClientBookingPage = () => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">
        Solicitacao de agendamento
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Tela reservada para cliente autenticado. Aqui entraremos com o
        formulario de criacao de agendamento via POST /v1/agendamentos/.
      </p>
    </section>
  );
};
