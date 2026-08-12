import { useState, type ChangeEvent, type FormEvent } from "react";
import { X } from "lucide-react";
import Input from "./Input";
import Button from "./Button";
import api from "../services/api";
import type { UserSession } from "../types/auth";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { getDocumentDigits, maskCpfOrCnpj } from "../utils/documentMasks";

interface LoginFormValues {
  identificador: string;
  senha: string;
}

interface LoginFormProps {
  isClosing?: boolean;
  isMorphingToRegister?: boolean;
  disableEnterAnimation?: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
  onSwitchToRegister: () => void;
}

const initialValues: LoginFormValues = {
  identificador: "",
  senha: "",
};

export const LoginForm = ({
  isClosing = false,
  isMorphingToRegister = false,
  disableEnterAnimation = false,
  onClose,
  onLoginSuccess,
  onSwitchToRegister,
}: LoginFormProps) => {
  useBodyScrollLock(true);

  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    const shouldMaskDocument =
      name === "identificador" && !/[A-Za-z@]/.test(value);

    const nextValue = shouldMaskDocument ? maskCpfOrCnpj(value) : value;

    setValues((prev) => ({ ...prev, [name]: nextValue }));
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!values.identificador.trim() || !values.senha.trim()) {
      setError("Preencha e-mail ou CPF/CNPJ e senha para continuar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const rawIdentifier = values.identificador.trim();
      const isEmailIdentifier = rawIdentifier.includes("@");
      const normalizedIdentifier = isEmailIdentifier
        ? rawIdentifier.toLowerCase()
        : getDocumentDigits(rawIdentifier, 14);

      if (!normalizedIdentifier) {
        setError("Informe um e-mail, CPF ou CNPJ válido.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        identificador: normalizedIdentifier,
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
        foto_perfil_url:
          typeof responseData.foto_perfil_url === "string"
            ? responseData.foto_perfil_url
            : null,
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
      className={`auth-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-3 py-4 backdrop-blur-sm sm:px-4 ${
        isClosing
          ? "auth-modal-overlay-exit"
          : disableEnterAnimation
            ? ""
            : "auth-modal-overlay-enter"
      }`}
      onClick={onClose}
    >
      <div
        className={`auth-modal-panel w-full max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl transition-[max-width] duration-300 ease-in-out sm:p-6 ${
          isMorphingToRegister ? "max-w-2xl" : "max-w-md"
        } ${
          isClosing
            ? "auth-modal-panel-exit"
            : disableEnterAnimation
              ? ""
              : "auth-modal-panel-enter"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={
            isMorphingToRegister
              ? "auth-modal-content-exit"
              : "auth-modal-content-enter"
          }
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-emerald-900">
                Entrar
              </h2>
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
              <X className="h-5 w-5" strokeWidth={2} />
            </button>
          </div>

          {error ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="space-y-2 block">
              <span className="text-sm font-medium text-slate-700">
                E-mail ou CPF/CNPJ *
              </span>
              <Input
                name="identificador"
                value={values.identificador}
                onChange={handleChange}
                placeholder="Digite seu e-mail ou CPF/CNPJ"
              />
            </label>

            <label className="space-y-2 block">
              <span className="text-sm font-medium text-slate-700">
                Senha *
              </span>
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
    </div>
  );
};

export default LoginForm;
