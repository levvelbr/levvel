import { useState, type ChangeEvent, type FormEvent } from "react";
import Input from "./Input";
import Button from "./Button";
import api from "../services/api";

interface FormValues {
  nome_estabelecimento: string;
  responsavel: string;
  telefone: string;
  email: string;
  localizacao: string;
  cnpj: string;
  razao_social: string;
  categoria: string;
  instagram: string;
  servicos_oferecidos: string;
  tecnicas_utilizadas: string;
  produtos_aplicados: string;
  profissionais_envolvidos: string;
  horario_funcionamento: string;
  senha_hash: string;
  confirmar_senha: string;
}

const categoryOptions = [
  "Geral",
  "Beleza",
  "Bem-estar",
  "Saúde",
  "Spa",
  "Estética",
];

const initialFormValues: FormValues = {
  nome_estabelecimento: "",
  responsavel: "",
  telefone: "",
  email: "",
  localizacao: "",
  cnpj: "",
  razao_social: "",
  categoria: "Geral",
  instagram: "",
  servicos_oferecidos: "",
  tecnicas_utilizadas: "",
  produtos_aplicados: "",
  profissionais_envolvidos: "",
  horario_funcionamento: "",
  senha_hash: "",
  confirmar_senha: "",
};

const validateEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const validateCnpj = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 14;
};

const parseCsv = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const Form = () => {
  const [values, setValues] = useState<FormValues>(initialFormValues);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [errors, setErrors] = useState<Partial<FormValues>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const stepTitles = [
    "Dados principais",
    "Detalhes do estabelecimento",
    "Senha e confirmação",
  ];

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors[name as keyof FormValues];
      return nextErrors;
    });
    setServerError(null);
    setSuccessMessage(null);
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPhotoFile(file);
    setServerError(null);
    setSuccessMessage(null);
  };

  const validateStep = (stepNumber: number, formValues: FormValues) => {
    const newErrors: Partial<FormValues> = {};

    if (stepNumber === 1) {
      if (!formValues.nome_estabelecimento.trim()) {
        newErrors.nome_estabelecimento =
          "Nome do estabelecimento é obrigatório";
      }
      if (!formValues.responsavel.trim()) {
        newErrors.responsavel = "Responsável é obrigatório";
      }
      if (!formValues.telefone.trim()) {
        newErrors.telefone = "Telefone é obrigatório";
      }
      if (!formValues.email.trim()) {
        newErrors.email = "E-mail é obrigatório";
      } else if (!validateEmail(formValues.email)) {
        newErrors.email = "E-mail inválido";
      }
      if (!formValues.localizacao.trim()) {
        newErrors.localizacao = "Localização é obrigatória";
      }
      if (!formValues.cnpj.trim()) {
        newErrors.cnpj = "CNPJ é obrigatório";
      } else if (!validateCnpj(formValues.cnpj)) {
        newErrors.cnpj = "CNPJ deve conter 14 dígitos";
      }
      if (!formValues.razao_social.trim()) {
        newErrors.razao_social = "Razão social é obrigatória";
      }
    }

    if (stepNumber === 2) {
      if (!formValues.categoria.trim()) {
        newErrors.categoria = "Categoria é obrigatória";
      }
      if (!formValues.instagram.trim()) {
        newErrors.instagram = "Instagram é obrigatório";
      }
      if (!formValues.profissionais_envolvidos.trim()) {
        newErrors.profissionais_envolvidos =
          "Profissionais envolvidos são obrigatórios";
      }
      if (!formValues.horario_funcionamento.trim()) {
        newErrors.horario_funcionamento =
          "Horário de funcionamento é obrigatório";
      } else {
        try {
          JSON.parse(formValues.horario_funcionamento);
        } catch {
          newErrors.horario_funcionamento =
            "Horário de funcionamento deve ser um objeto JSON válido";
        }
      }
    }

    if (stepNumber === 3) {
      if (!formValues.senha_hash.trim()) {
        newErrors.senha_hash = "Senha é obrigatória";
      }
      if (!formValues.confirmar_senha.trim()) {
        newErrors.confirmar_senha = "Confirmação de senha é obrigatória";
      } else if (formValues.senha_hash !== formValues.confirmar_senha) {
        newErrors.confirmar_senha = "As senhas não conferem";
      }
    }

    return newErrors;
  };

  const handleNext = () => {
    const newErrors = validateStep(currentStep, values);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
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

    const newErrors = validateStep(currentStep, values);

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const body = {
      nome_estabelecimento: values.nome_estabelecimento.trim(),
      responsavel: values.responsavel.trim(),
      telefone: values.telefone.trim(),
      email: values.email.trim(),
      localizacao: values.localizacao.trim(),
      foto_estabelecimento_url: null,
      cnpj: values.cnpj.trim() || null,
      razao_social: values.razao_social.trim() || null,
      categoria: values.categoria,
      instagram: values.instagram.trim() || null,
      servicos_oferecidos: parseCsv(values.servicos_oferecidos),
      tecnicas_utilizadas: parseCsv(values.tecnicas_utilizadas),
      produtos_aplicados: parseCsv(values.produtos_aplicados),
      profissionais_envolvidos: parseCsv(values.profissionais_envolvidos),
      horario_funcionamento: JSON.parse(values.horario_funcionamento),
      senha_hash: values.senha_hash,
    };

    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      await api.post("/v1/estabelecimentos/", body);
      setSuccessMessage("Estabelecimento cadastrado com sucesso.");
      setValues(initialFormValues);
      setPhotoFile(null);
      setPhotoInputKey((prev) => prev + 1);
      setCurrentStep(1);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setServerError(`Falha ao cadastrar estabelecimento: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      id="establishment-form"
      onSubmit={handleSubmit}
      className="rounded-3xl bg-white/95 p-8 shadow-md ring-1 ring-slate-200"
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-emerald-900">
            Cadastro de estabelecimento
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Preencha os dados para publicar seu negócio na plataforma.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 3].map((step) => {
            const isActive = currentStep === step;
            const isCompleted = currentStep > step;

            return (
              <div
                key={step}
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
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
        Etapa {currentStep} de 3: {stepTitles[currentStep - 1]}
      </p>

      {successMessage ? (
        <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-900">
          {successMessage}
        </div>
      ) : null}

      {serverError ? (
        <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-rose-900">
          {serverError}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {currentStep === 1 ? (
          <>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Nome do estabelecimento *
              </span>
              <Input
                name="nome_estabelecimento"
                value={values.nome_estabelecimento}
                onChange={handleChange}
                placeholder="Nome do estabelecimento"
              />
              {errors.nome_estabelecimento && (
                <span className="text-sm text-red-500">
                  {errors.nome_estabelecimento}
                </span>
              )}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Responsável *
              </span>
              <Input
                name="responsavel"
                value={values.responsavel}
                onChange={handleChange}
                placeholder="Nome do responsável"
              />
              {errors.responsavel && (
                <span className="text-sm text-red-500">
                  {errors.responsavel}
                </span>
              )}
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Foto do estabelecimento (opcional)
              </span>
              <input
                key={photoInputKey}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
              {photoFile ? (
                <span className="text-xs text-slate-500">
                  Arquivo selecionado: {photoFile.name}
                </span>
              ) : null}
              <span className="text-xs text-amber-700">
                A foto sera enviada no perfil do estabelecimento apos o primeiro
                login.
              </span>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Telefone *
              </span>
              <Input
                name="telefone"
                value={values.telefone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
              />
              {errors.telefone && (
                <span className="text-sm text-red-500">{errors.telefone}</span>
              )}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                E-mail *
              </span>
              <Input
                type="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                placeholder="user@example.com"
              />
              {errors.email && (
                <span className="text-sm text-red-500">{errors.email}</span>
              )}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">
                Localização *
              </span>
              <Input
                name="localizacao"
                value={values.localizacao}
                onChange={handleChange}
                placeholder="Endereço, bairro ou cidade"
              />
              {errors.localizacao && (
                <span className="text-sm text-red-500">
                  {errors.localizacao}
                </span>
              )}
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">CNPJ *</span>
              <Input
                name="cnpj"
                value={values.cnpj}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
              />
              {errors.cnpj && (
                <span className="text-sm text-red-500">{errors.cnpj}</span>
              )}
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Razão social *
              </span>
              <Input
                name="razao_social"
                value={values.razao_social}
                onChange={handleChange}
                placeholder="Razão social da empresa"
              />
              {errors.razao_social && (
                <span className="text-sm text-red-500">
                  {errors.razao_social}
                </span>
              )}
            </label>
          </>
        ) : null}

        {currentStep === 2 ? (
          <>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Categoria *
              </span>
              <select
                name="categoria"
                value={values.categoria}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.categoria && (
                <span className="text-sm text-red-500">{errors.categoria}</span>
              )}
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Instagram *
              </span>
              <Input
                name="instagram"
                value={values.instagram}
                onChange={handleChange}
                placeholder="@seu_instagram"
              />
              {errors.instagram && (
                <span className="text-sm text-red-500">{errors.instagram}</span>
              )}
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Serviços oferecidos
              </span>
              <textarea
                name="servicos_oferecidos"
                value={values.servicos_oferecidos}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                placeholder="Digite separados por vírgula, ex: corte, color, hidratação"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Técnicas utilizadas
              </span>
              <textarea
                name="tecnicas_utilizadas"
                value={values.tecnicas_utilizadas}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                placeholder="Digite separados por vírgula"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Produtos aplicados
              </span>
              <textarea
                name="produtos_aplicados"
                value={values.produtos_aplicados}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                placeholder="Digite separados por vírgula"
              />
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Profissionais envolvidos *
              </span>
              <textarea
                name="profissionais_envolvidos"
                value={values.profissionais_envolvidos}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                placeholder="Digite separados por vírgula"
              />
              {errors.profissionais_envolvidos && (
                <span className="text-sm text-red-500">
                  {errors.profissionais_envolvidos}
                </span>
              )}
            </label>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Horário de funcionamento *
              </span>
              <textarea
                name="horario_funcionamento"
                value={values.horario_funcionamento}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                placeholder='Ex.: {"segunda":"09:00-18:00","sabado":"10:00-14:00"}'
              />
              {errors.horario_funcionamento && (
                <span className="text-sm text-red-500">
                  {errors.horario_funcionamento}
                </span>
              )}
            </label>
          </>
        ) : null}

        {currentStep === 3 ? (
          <>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Senha *
              </span>
              <Input
                type="password"
                name="senha_hash"
                value={values.senha_hash}
                onChange={handleChange}
                placeholder="Senha do estabelecimento"
              />
              {errors.senha_hash && (
                <span className="text-sm text-red-500">
                  {errors.senha_hash}
                </span>
              )}
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
              {errors.confirmar_senha && (
                <span className="text-sm text-red-500">
                  {errors.confirmar_senha}
                </span>
              )}
            </label>
          </>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-between">
        {currentStep > 1 ? (
          <Button type="button" variant="outline" onClick={handleBack}>
            Voltar
          </Button>
        ) : (
          <div />
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {currentStep < 3 ? (
            <Button type="button" onClick={handleNext}>
              Próximo
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Cadastrar estabelecimento"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default Form;
