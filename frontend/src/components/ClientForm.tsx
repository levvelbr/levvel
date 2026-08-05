import { useState, type ChangeEvent, type FormEvent } from "react";
import Input from "./Input";
import Button from "./Button";
import api from "../services/api";

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
}

interface ClientFormProps {
  onClose: () => void;
  onLoginSuccess: (userName: string) => void;
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
};

const validateCpf = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11;
};

const validateEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

export const ClientForm = ({
  onClose,
  onLoginSuccess,
  onBackToLogin,
}: ClientFormProps) => {
  const [values, setValues] = useState<ClientFormValues>(initialFormValues);
  const [errors, setErrors] = useState<Partial<ClientFormValues>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors[name as keyof ClientFormValues];
      return nextErrors;
    });
    setServerError(null);
    setSuccessMessage(null);
  };

  const validateStep = (stepNumber: number, formValues: ClientFormValues) => {
    const nextErrors: Partial<ClientFormValues> = {};

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
    }

    return nextErrors;
  };

  const handleNext = () => {
    const nextErrors = validateStep(currentStep, values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setErrors({});
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateStep(currentStep, values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const body: Record<string, string> = {
      nome_usuario: values.nome_usuario.trim(),
      email: values.email.trim(),
      cpf: values.cpf.replace(/\D/g, ""),
      data_nascimento: values.data_nascimento,
      genero: values.genero,
      forma_pagamento_preferida: values.forma_pagamento_preferida,
      localizacao_inicial: values.localizacao_inicial.trim(),
      senha: values.senha,
    };

    const trimmedTreatment = values.nome_tratamento.trim();
    if (trimmedTreatment) {
      body.nome_tratamento = trimmedTreatment;
    }

    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      await api.post("/v1/clientes", body);
      const userDisplayName =
        values.nome_tratamento.trim() || values.nome_usuario.trim();

      const persistedClients = window.localStorage.getItem("registeredClients");
      const clients = persistedClients ? JSON.parse(persistedClients) : [];
      clients.push({
        ...body,
        nome_tratamento: values.nome_tratamento.trim(),
      });
      window.localStorage.setItem("registeredClients", JSON.stringify(clients));
      window.localStorage.setItem(
        "loggedClient",
        JSON.stringify({ name: userDisplayName }),
      );
      onLoginSuccess(userDisplayName);
      setSuccessMessage("Cliente cadastrado com sucesso.");
      setValues(initialFormValues);
      setCurrentStep(1);
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

      setServerError(`Falha ao cadastrar cliente: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-3 py-4 sm:px-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl sm:p-6">
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
                {errors.senha ? (
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
                {errors.confirmar_senha ? (
                  <span className="text-sm text-red-500">
                    {errors.confirmar_senha}
                  </span>
                ) : null}
              </label>
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
              <Button type="submit" disabled={isSubmitting}>
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
