import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { LocateFixed, X } from "lucide-react";
import Input from "./Input";
import Button from "./Button";
import api from "../services/api";
import type { UserSession } from "../types/auth";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { maskCpf } from "../utils/documentMasks";
import { getApiErrorMessage } from "../utils/apiErrors";
import {
  getCurrentLocationLabel,
  getGeolocationErrorMessage,
} from "../utils/geolocation";

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
  termos_aceitos: boolean;
}

type ClientFormErrors = Partial<Record<keyof ClientFormValues, string>>;

interface ClientFormProps {
  isClosing?: boolean;
  isMorphingToLogin?: boolean;
  disableEnterAnimation?: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
  onBackToLogin?: () => void;
  onOpenEstablishmentRegistration?: () => void;
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
  termos_aceitos: false,
};

const validateCpf = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11;
};

const validateEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

const ErrorBadge = ({ message }: { message: string }) => (
  <span className="mt-1 inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
    {message}
  </span>
);

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
  isClosing = false,
  isMorphingToLogin = false,
  disableEnterAnimation = false,
  onClose,
  onLoginSuccess,
  onBackToLogin,
  onOpenEstablishmentRegistration,
}: ClientFormProps) => {
  useBodyScrollLock(true);

  const [values, setValues] = useState<ClientFormValues>(initialFormValues);
  const [errors, setErrors] = useState<ClientFormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showTermsAlert, setShowTermsAlert] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [hasAttemptedSubmitStep2, setHasAttemptedSubmitStep2] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (currentStep === 2) {
      setHasAttemptedSubmitStep2(false);
      setShowTermsAlert(false);
      setErrors({});
    }
  }, [currentStep]);

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    setLocationError(null);

    try {
      const label = await getCurrentLocationLabel();
      setValues((prev) => ({ ...prev, localizacao_inicial: label }));
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors.localizacao_inicial;
        return nextErrors;
      });
    } catch (error) {
      setLocationError(getGeolocationErrorMessage(error));
    } finally {
      setIsLocating(false);
    }
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name } = event.target;
    let nextValue: string | boolean;

    if (
      event.target instanceof HTMLInputElement &&
      event.target.type === "checkbox"
    ) {
      nextValue = event.target.checked;
    } else if (name === "cpf") {
      nextValue = maskCpf(event.target.value);
    } else {
      nextValue = event.target.value;
    }

    setValues((prev) => ({ ...prev, [name]: nextValue }));
    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors[name as keyof ClientFormValues];
      return nextErrors;
    });
    if (name === "localizacao_inicial") {
      setLocationError(null);
    }
    if (name === "termos_aceitos") {
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
      } else if (formValues.senha.trim().length < 6) {
        nextErrors.senha = "Senha deve ter pelo menos 6 caracteres";
      }
      if (!formValues.confirmar_senha.trim()) {
        nextErrors.confirmar_senha = "Confirmação de senha é obrigatória";
      } else if (formValues.senha !== formValues.confirmar_senha) {
        nextErrors.confirmar_senha = "As senhas não conferem";
      }
      if (!formValues.termos_aceitos) {
        nextErrors.termos_aceitos =
          "Voce precisa aceitar os termos para continuar";
      }
    }

    return nextErrors;
  };

  const focusFirstError = (fieldErrors: ClientFormErrors) => {
    const fieldOrder = [
      "nome_usuario",
      "email",
      "nome_tratamento",
      "cpf",
      "data_nascimento",
      "genero",
      "forma_pagamento_preferida",
      "localizacao_inicial",
      "senha",
      "confirmar_senha",
      "termos_aceitos",
    ];
    const firstField = fieldOrder.find((field) =>
      Object.prototype.hasOwnProperty.call(fieldErrors, field),
    );

    if (!firstField) {
      return;
    }

    window.requestAnimationFrame(() => {
      const panel = panelRef.current;
      const target = panel?.querySelector<HTMLElement>(
        `[name="${firstField}"]`,
      );

      if (!panel || !target) {
        return;
      }

      const rect = target.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const stickyTop =
        panel.querySelector<HTMLElement>("[data-form-header]")?.offsetHeight ??
        0;
      const footerHeight =
        panel.querySelector<HTMLElement>("[data-form-footer]")?.offsetHeight ??
        0;

      if (
        rect.top < panelRect.top + stickyTop + 8 ||
        rect.bottom > panelRect.bottom - footerHeight - 8
      ) {
        target.scrollIntoView({ block: "center", behavior: "smooth" });
      }

      target.focus({ preventScroll: true });
    });
  };

  const handleNext = () => {
    const nextErrors = validateStep(currentStep, values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      if (currentStep === 2 && !values.termos_aceitos) {
        setShowTermsAlert(true);
      }
      focusFirstError(nextErrors);
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
      if (!values.termos_aceitos) {
        setShowTermsAlert(true);
      }
      focusFirstError(nextErrors);
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
      aceitou_termos: values.termos_aceitos,
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
        role: "cliente",
      });

      const session = parseUserSession(
        loginResponse.data as Partial<UserSession> | undefined,
      );

      setValues(initialFormValues);
      setCurrentStep(1);
      onLoginSuccess(session);
      onClose();
    } catch (error: unknown) {
      const message = getApiErrorMessage(error);

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
      className={`auth-modal-overlay fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-none bg-slate-950/60 px-3 py-4 backdrop-blur-sm sm:px-4 ${
        isClosing
          ? "auth-modal-overlay-exit"
          : disableEnterAnimation
            ? ""
            : "auth-modal-overlay-enter"
      }`}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className={`auth-modal-panel max-h-[calc(100dvh-2rem)] min-h-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain rounded-3xl bg-white p-4 shadow-2xl transition-[max-width] duration-300 ease-in-out sm:p-6 ${
          isMorphingToLogin ? "max-w-md" : "max-w-2xl"
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
            isMorphingToLogin
              ? "auth-modal-content-exit"
              : "auth-modal-content-enter"
          }
        >
          <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold leading-tight text-emerald-900 sm:text-2xl">
                Cadastro de cliente
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-1 text-sm text-slate-500">
                <span>Já tem cadastro?</span>
                {onBackToLogin ? (
                  <button
                    type="button"
                    onClick={onBackToLogin}
                    className="font-bold text-emerald-700 hover:underline"
                  >
                    Faça login
                  </button>
                ) : null}
              </div>
            </div>
            <div className="flex w-full flex-col items-end gap-0.5 sm:w-auto sm:shrink-0">
              <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
                {onOpenEstablishmentRegistration ? (
                  <button
                    type="button"
                    onClick={onOpenEstablishmentRegistration}
                    className="whitespace-nowrap text-xs font-medium text-emerald-700 hover:underline sm:text-sm"
                  >
                    Cadastrar estabelecimento
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Fechar formulário"
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white/95 p-4 ring-1 ring-slate-200 sm:p-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-emerald-900 sm:text-2xl">
                  Cadastro de cliente
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Preencha os dados para criar sua conta na plataforma.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {[1, 2].map((step) => {
                  const isActive = currentStep === step;
                  const isCompleted = currentStep > step;

                  return (
                    <div
                      key={step}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:h-8 sm:w-8 sm:text-sm ${
                        isActive
                          ? "bg-emerald-700 text-white"
                          : isCompleted
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {step}
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="mb-6 text-sm font-medium text-slate-600">
              Etapa {currentStep} de 2:{" "}
              {currentStep === 1 ? "Dados pessoais" : "Acesso e termos"}
            </p>

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
                      <ErrorBadge message={errors.nome_usuario} />
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
                      <ErrorBadge message={errors.email} />
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
                      placeholder="000.000.000-00"
                    />
                    {errors.cpf ? <ErrorBadge message={errors.cpf} /> : null}
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
                      <ErrorBadge message={errors.data_nascimento} />
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
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    >
                      <option value="">Selecione</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="nao_binario">Não binário</option>
                      <option value="outro">Outro</option>
                    </select>
                    {errors.genero ? (
                      <ErrorBadge message={errors.genero} />
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
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    >
                      <option value="dinheiro">Dinheiro</option>
                      <option value="pix">Pix</option>
                      <option value="cartao_debito">Cartão de débito</option>
                      <option value="cartao_credito">Cartão de crédito</option>
                    </select>
                    {errors.forma_pagamento_preferida ? (
                      <ErrorBadge message={errors.forma_pagamento_preferida} />
                    ) : null}
                  </label>

                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      Localização inicial *
                    </span>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        name="localizacao_inicial"
                        value={values.localizacao_inicial}
                        onChange={handleChange}
                        placeholder="Cidade ou bairro"
                        className="sm:flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleUseCurrentLocation}
                        disabled={isLocating}
                        className="shrink-0 whitespace-nowrap px-3 py-2.5 text-sm"
                      >
                        <LocateFixed
                          className="mr-1.5 h-4 w-4"
                          strokeWidth={1.8}
                        />
                        {isLocating
                          ? "Localizando..."
                          : "Usar minha localização"}
                      </Button>
                    </div>
                    {locationError ? (
                      <ErrorBadge message={locationError} />
                    ) : null}
                    {errors.localizacao_inicial ? (
                      <ErrorBadge message={errors.localizacao_inicial} />
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
                      <ErrorBadge message={errors.senha} />
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
                      <ErrorBadge message={errors.confirmar_senha} />
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
                        name="termos_aceitos"
                        checked={values.termos_aceitos}
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

              <div
                data-form-footer
                className="sticky -bottom-4 z-30 -mx-4 -mb-4 mt-6 flex flex-col-reverse gap-3 rounded-b-3xl border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-6px_20px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:-bottom-6 sm:-mx-8 sm:-mb-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-4"
              >
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
      </div>
    </div>
  );
};

export default ClientForm;
