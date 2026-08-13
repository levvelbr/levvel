import { useEffect, useState } from "react";
import api from "../services/api";
import Button from "./Button";

export const ApiTest = () => {
  const [status, setStatus] = useState<string>("Aguardando teste...");
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    setStatus("Testando conexão...");

    try {
      const response = await api.get("/");
      setStatus(`Conexão OK: ${response.status} ${response.statusText}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Erro de conexão: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTest();
  }, []);

  return (
    <section className="mb-8 rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-emerald-900">
            Teste de API
          </h3>
          <p className="text-sm text-slate-600">
            Verifica se a API responde ao GET em /
          </p>
        </div>
        <Button onClick={runTest} disabled={loading}>
          {loading ? "Testando..." : "Refazer teste"}
        </Button>
      </div>
      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
        {status}
      </div>
    </section>
  );
};
