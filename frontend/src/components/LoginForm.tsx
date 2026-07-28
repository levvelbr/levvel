import { useState, type ChangeEvent, type FormEvent } from "react";
import Input from "./Input";
import Button from "./Button";
import api from "../services/api";
import type { UserSession } from "../types/auth";

interface LoginFormValues {
  identificador: string;
  senha: string;
}

interface LoginFormProps {
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
  onSwitchToRegister: () => void;
}

const initialValues: LoginFormValues = {
  identificador: "",
  senha: "",
};

export const LoginForm = ({
  onClose,
  onLoginSuccess,
  onSwitchToRegister,
}: LoginFormProps) => {
  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!values.identificador.trim() || !values.senha.trim()) {
      setError("Preencha CPF e senha para continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        identificador: values.identificador.replace(/\D/g, ""),
        senha: values.senha,
      };

      const response = await api.post("/v1/auth/login", payload);
      const responseData = response.data as Partial<UserSession> | undefined;

      if (
        !responseData ||
        typeof responseData.id !== "string" ||
        typeof responseData.role !== "string" ||
        typeof responseData.nome !== "string" ||
        typeof responseData.email_ou_cpf !== "string" ||
        typeof responseData.access_token !== "string"
      ) {
        throw new Error("Resposta de autenticacao invalida.");
      }

      const session: UserSession = {
        id: responseData.id,
        role: responseData.role,
        nome: responseData.nome,
        email_ou_cpf: responseData.email_ou_cpf,
        access_token: responseData.access_token,
        token_type:
          typeof responseData.token_type === "string"
            ? responseData.token_type
            : "bearer",
      };

      onLoginSuccess(session);
      onClose();
    } catch (error: unknown) {
      const responseData =
        typeof error === "object" && error !== null && "response" in error
          ? (error as { response?: { data?: unknown } }).response?.data
          : undefined;
      const message =
        typeof responseData === "string"
          ? responseData
          : responseData
            ? JSON.stringify(responseData)
            : error instanceof Error
              ? error.message
              : String(error);

      setError(`Falha ao entrar: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-3 py-4 sm:px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-emerald-900">Entrar</h2>
            <p className="text-sm text-slate-600">
              Acesse sua conta para continuar
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Fechar formulário"
          >
            ✕
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="space-y-2 block">
            <span className="text-sm font-medium text-slate-700">CPF *</span>
            <Input
              name="identificador"
              value={values.identificador}
              onChange={handleChange}
              placeholder="Digite seu CPF"
            />
          </label>

          <label className="space-y-2 block">
            <span className="text-sm font-medium text-slate-700">Senha *</span>
            <Input
              type="password"
              name="senha"
              value={values.senha}
              onChange={handleChange}
              placeholder="Digite sua senha"
            />
          </label>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-slate-600">
          Ainda não tem conta?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-semibold text-emerald-700 hover:underline"
          >
            Cadastre-se
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
