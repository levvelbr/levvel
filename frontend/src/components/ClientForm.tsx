import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Input from "./Input";
import Button from "./Button";
import api from "../services/api";
import type { UserSession } from "../types/auth";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

interface ClientFormValues {
  nome_usuario: string;
  email: string;
  nome_tratamento: string;
  cpf: string;
  data_nascimento: string;
  genero: string;
  forma_pagamento_preferida: string;
  localizacao_inicial: string;
  senha: string;
  confirmar_senha: string;
  aceitou_termos: boolean;
}

type ClientFormErrors = Partial<Record<keyof ClientFormValues, string>>;

interface ClientFormProps {
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
  onBackToLogin?: () => void;
}

const initialFormValues: ClientFormValues = {
  nome_usuario: "",
  email: "",
  nome_tratamento: "",
  cpf: "",
  data_nascimento: "",
  genero: "",
  forma_pagamento_preferida: "dinheiro",
  localizacao_inicial: "",
  senha: "",
  confirmar_senha: "",
  aceitou_termos: false,
};

const validateCpf = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11;
};

const validateEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

const extractErrorMessage = (error: unknown) => {
  const responseData =
    typeof error === "object" && error !== null && "response" in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : undefined;

  return typeof responseData === "string"
    ? responseData
    : responseData
      ? JSON.stringify(responseData)
      : error instanceof Error
        ? error.message
        : String(error);
};

const parseUserSession = (
  data: Partial<UserSession> | undefined,
): UserSession => {
  if (
    !data ||
    typeof data.id !== "string" ||
    typeof data.role !== "string" ||
    typeof data.nome !== "string" ||
    typeof data.email_ou_cpf !== "string" ||
    typeof data.access_token !== "string"
  ) {
    throw new Error("Resposta de autenticacao invalida.");
  }

  return {
    id: data.id,
    role: data.role,
    nome: data.nome,
    email_ou_cpf: data.email_ou_cpf,
    access_token: data.access_token,
    token_type:
      typeof data.token_type === "string" ? data.token_type : "bearer",
    foto_perfil_url:
      typeof data.foto_perfil_url === "string" ? data.foto_perfil_url : null,
  };
};

export const ClientForm = ({
  onClose,
  onLoginSuccess,
  onBackToLogin,
}: ClientFormProps) => {
  useBodyScrollLock(true);

  const [values, setValues] = useState<ClientFormValues>(initialFormValues);
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showTermsAlert, setShowTermsAlert] = useState(false);
  const [hasAttemptedSubmitStep2, setHasAttemptedSubmitStep2] = useState(false);

  useEffect(() => {
    if (currentStep === 2) {
      setHasAttemptedSubmitStep2(false);
      setShowTermsAlert(false);
      setErrors({});
    }
  }, [currentStep]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name } = event.target;
    const nextValue =
      event.target instanceof HTMLInputElement &&
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    setValues((prev) => ({ ...prev, [name]: nextValue }));
    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors[name as keyof ClientFormValues];
      return nextErrors;
    });
    if (name === "aceitou_termos") {
      const isChecked =
        event.target instanceof HTMLInputElement ? event.target.checked : false;
      if (isChecked) {
        setShowTermsAlert(false);
      }
    }
    setServerError(null);
    setSuccessMessage(null);
  };

  const validateStep = (stepNumber: number, formValues: ClientFormValues) => {
    const nextErrors: ClientFormErrors = {};

    if (stepNumber === 1) {
      if (!formValues.nome_usuario.trim()) {
        nextErrors.nome_usuario = "Nome de usuário é obrigatório";
      }
      if (!formValues.email.trim()) {
        nextErrors.email = "E-mail é obrigatório";
      } else if (!validateEmail(formValues.email.trim())) {
        nextErrors.email = "Informe um e-mail válido";
      }
      if (!formValues.cpf.trim()) {
        nextErrors.cpf = "CPF é obrigatório";
      } else if (!validateCpf(formValues.cpf)) {
        nextErrors.cpf = "CPF deve conter 11 dígitos";
      }
      if (!formValues.data_nascimento.trim()) {
        nextErrors.data_nascimento = "Data de nascimento é obrigatória";
      }
      if (!formValues.genero.trim()) {
        nextErrors.genero = "Gênero é obrigatório";
      }
      if (!formValues.localizacao_inicial.trim()) {
        nextErrors.localizacao_inicial = "Localização inicial é obrigatória";
      }
      if (!formValues.forma_pagamento_preferida.trim()) {
        nextErrors.forma_pagamento_preferida =
          "Forma de pagamento é obrigatória";
      }
    }

    if (stepNumber === 2) {
      if (!formValues.senha.trim()) {
        nextErrors.senha = "Senha é obrigatória";
      }
      if (!formValues.confirmar_senha.trim()) {
        nextErrors.confirmar_senha = "Confirmação de senha é obrigatória";
      } else if (formValues.senha !== formValues.confirmar_senha) {
        nextErrors.confirmar_senha = "As senhas não conferem";
      }
      if (!formValues.aceitou_termos) {
        nextErrors.aceitou_termos =
          "Voce precisa aceitar os termos para continuar";
      }
    }

    return nextErrors;
  };

  const handleNext = () => {
    const nextErrors = validateStep(currentStep, values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      if (currentStep === 2 && !values.aceitou_termos) {
        setShowTermsAlert(true);
      }
      return;
    }

    setShowTermsAlert(false);
    if (currentStep === 1) {
      setHasAttemptedSubmitStep2(false);
    }

    setErrors({});
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setErrors({});
    setShowTermsAlert(false);
    setHasAttemptedSubmitStep2(false);
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nativeSubmitEvent = event.nativeEvent as SubmitEvent;
    const submitter = nativeSubmitEvent.submitter as HTMLButtonElement | null;
    const isFinalSubmit =
      submitter?.getAttribute("data-submit-intent") === "register-client";

    if (!isFinalSubmit) {
      return;
    }

    setHasAttemptedSubmitStep2(true);

    const nextErrors = validateStep(currentStep, values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      if (!values.aceitou_termos) {
        setShowTermsAlert(true);
      }
      return;
    }

    setShowTermsAlert(false);

    const body: Record<string, string | boolean> = {
      nome_usuario: values.nome_usuario.trim(),
      email: values.email.trim(),
      cpf: values.cpf.replace(/\D/g, ""),
      data_nascimento: values.data_nascimento,
      genero: values.genero,
      forma_pagamento_preferida: values.forma_pagamento_preferida,
      localizacao_inicial: values.localizacao_inicial.trim(),
      senha: values.senha,
      aceitou_termos: values.aceitou_termos,
    };

    const trimmedTreatment = values.nome_tratamento.trim();
    if (trimmedTreatment) {
      body.nome_tratamento = trimmedTreatment;
    }

    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);
    let clientCreated = false;

    try {
      await api.post("/v1/clientes", body);
      clientCreated = true;

      const loginResponse = await api.post("/v1/auth/login", {
        identificador: values.email.trim().toLowerCase(),
        senha: values.senha,
      });

      const session = parseUserSession(
        loginResponse.data as Partial<UserSession> | undefined,
      );

      setValues(initialFormValues);
      setCurrentStep(1);
      onLoginSuccess(session);
      onClose();
    } catch (error: unknown) {
      const message = extractErrorMessage(error);

      setServerError(
        clientCreated
          ? `Cliente cadastrado, mas houve falha no login automatico: ${message}`
          : `Falha ao cadastrar cliente: ${message}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-3 py-4 backdrop-blur-sm sm:px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-emerald-900">
              Cadastro de cliente
            </h2>
            <p className="text-sm text-slate-600">Etapa {currentStep} de 2</p>
          </div>
          <div className="flex items-center gap-2">
            {onBackToLogin ? (
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-sm font-medium text-emerald-700 hover:underline"
              >
                Voltar para login
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Fechar formulário"
            >
              ✕
            </button>
          </div>
        </div>

        {successMessage ? (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
            {successMessage}
          </div>
        ) : null}

        {serverError ? (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900">
            {serverError}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {currentStep === 1 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Nome de usuário *
                </span>
                <Input
                  name="nome_usuario"
                  value={values.nome_usuario}
                  onChange={handleChange}
                  placeholder="Digite seu nome"
                />
                {errors.nome_usuario ? (
                  <span className="text-sm text-red-500">
                    {errors.nome_usuario}
                  </span>
                ) : null}
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  E-mail *
                </span>
                <Input
                  type="email"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                  placeholder="voce@exemplo.com"
                />
                {errors.email ? (
                  <span className="text-sm text-red-500">{errors.email}</span>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Nome de tratamento
                </span>
                <Input
                  name="nome_tratamento"
                  value={values.nome_tratamento}
                  onChange={handleChange}
                  placeholder="Opcional"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  CPF *
                </span>
                <Input
                  name="cpf"
                  value={values.cpf}
                  onChange={handleChange}
                  placeholder="00000000000"
                />
                {errors.cpf ? (
                  <span className="text-sm text-red-500">{errors.cpf}</span>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Data de nascimento *
                </span>
                <Input
                  type="date"
                  name="data_nascimento"
                  value={values.data_nascimento}
                  onChange={handleChange}
                />
                {errors.data_nascimento ? (
                  <span className="text-sm text-red-500">
                    {errors.data_nascimento}
                  </span>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Gênero *
                </span>
                <select
                  name="genero"
                  value={values.genero}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm border-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  <option value="">Selecione</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="nao_binario">Não binário</option>
                  <option value="outro">Outro</option>
                </select>
                {errors.genero ? (
                  <span className="text-sm text-red-500">{errors.genero}</span>
                ) : null}
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">
                  Forma de pagamento preferida *
                </span>
                <select
                  name="forma_pagamento_preferida"
                  value={values.forma_pagamento_preferida}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm border-none focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  <option value="dinheiro">Dinheiro</option>
                  <option value="pix">Pix</option>
                  <option value="cartao_debito">Cartão de débito</option>
                  <option value="cartao_credito">Cartão de crédito</option>
                </select>
                {errors.forma_pagamento_preferida ? (
                  <span className="text-sm text-red-500">
                    {errors.forma_pagamento_preferida}
                  </span>
                ) : null}
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Localização inicial *
                </span>
                <Input
                  name="localizacao_inicial"
                  value={values.localizacao_inicial}
                  onChange={handleChange}
                  placeholder="Cidade ou bairro"
                />
                {errors.localizacao_inicial ? (
                  <span className="text-sm text-red-500">
                    {errors.localizacao_inicial}
                  </span>
                ) : null}
              </label>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 md:col-span-2">
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
                {hasAttemptedSubmitStep2 && errors.senha ? (
                  <span className="text-sm text-red-500">{errors.senha}</span>
                ) : null}
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">
                  Confirmar senha *
                </span>
                <Input
                  type="password"
                  name="confirmar_senha"
                  value={values.confirmar_senha}
                  onChange={handleChange}
                  placeholder="Repita a senha"
                />
                {hasAttemptedSubmitStep2 && errors.confirmar_senha ? (
                  <span className="text-sm text-red-500">
                    {errors.confirmar_senha}
                  </span>
                ) : null}
              </label>

              <div
                className={`md:col-span-2 rounded-2xl border bg-slate-50 px-4 py-3 transition-colors ${
                  showTermsAlert
                    ? "border-amber-300 bg-amber-50"
                    : "border-slate-200"
                }`}
              >
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    name="aceitou_termos"
                    checked={values.aceitou_termos}
                    onChange={handleChange}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                  />
                  <span>
                    Li e aceito os{" "}
                    <a
                      href="/termos-e-privacidade"
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-emerald-700 underline"
                    >
                      Termos de Uso e Politicas de Privacidade
                    </a>
                    .
                  </span>
                </label>
                {showTermsAlert && hasAttemptedSubmitStep2 ? (
                  <p className="mt-2 text-sm text-amber-800">
                    Para continuar, confirme o aceite dos termos.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 pt-2">
            {currentStep > 1 ? (
              <Button type="button" variant="outline" onClick={handleBack}>
                Voltar
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 2 ? (
              <Button type="button" onClick={handleNext}>
                Próximo
              </Button>
            ) : (
              <Button
                type="submit"
                data-submit-intent="register-client"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Cadastrando..." : "Cadastrar cliente"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientForm;
