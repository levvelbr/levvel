import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowLeft } from "lucide-react";
import Input from "./Input";
import Button from "./Button";
import api from "../services/api";
import { getDocumentDigits, maskCnpj } from "../utils/documentMasks";
import { getApiErrorMessage } from "../utils/apiErrors";

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
  senha_hash: string;
  confirmar_senha: string;
  aceitou_termos: boolean;
}

type WeekDayKey =
  | "segunda"
  | "terca"
  | "quarta"
  | "quinta"
  | "sexta"
  | "sabado"
  | "domingo";

interface TimeRange {
  inicio: string;
  fim: string;
}

interface DaySchedule {
  ativo: boolean;
  faixas: TimeRange[];
}

interface RangeFieldError {
  inicio?: string;
  fim?: string;
  row?: string;
}

interface ScheduleValidationResult {
  message: string | null;
  fieldErrors: Record<string, RangeFieldError>;
}

interface DayErrorBadge {
  hasError: boolean;
  message: string | null;
}

type WeeklySchedule = Record<WeekDayKey, DaySchedule>;

type FormField = keyof FormValues | "horario_funcionamento";
type FormErrors = Partial<Record<FormField, string>>;

const categoryOptions = [
  "Geral",
  "Beleza",
  "Bem-estar",
  "Saúde",
  "Spa",
  "Estética",
];

const weekDays: Array<{ key: WeekDayKey; label: string; shortLabel: string }> =
  [
    { key: "segunda", label: "Segunda-feira", shortLabel: "Seg" },
    { key: "terca", label: "Terça-feira", shortLabel: "Ter" },
    { key: "quarta", label: "Quarta-feira", shortLabel: "Qua" },
    { key: "quinta", label: "Quinta-feira", shortLabel: "Qui" },
    { key: "sexta", label: "Sexta-feira", shortLabel: "Sex" },
    { key: "sabado", label: "Sábado", shortLabel: "Sáb" },
    { key: "domingo", label: "Domingo", shortLabel: "Dom" },
  ];

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createEmptyRange = (): TimeRange => ({ inicio: "", fim: "" });

const createInitialSchedule = (): WeeklySchedule =>
  weekDays.reduce((acc, day) => {
    acc[day.key] = {
      ativo: false,
      faixas: [createEmptyRange()],
    };

    return acc;
  }, {} as WeeklySchedule);

const cloneSchedule = (schedule: WeeklySchedule): WeeklySchedule =>
  weekDays.reduce((acc, day) => {
    const daySchedule = schedule[day.key];

    acc[day.key] = {
      ativo: daySchedule.ativo,
      faixas: daySchedule.faixas.map((range) => ({ ...range })),
    };

    return acc;
  }, {} as WeeklySchedule);

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const getRangeErrorKey = (dayKey: WeekDayKey, index: number) =>
  `${dayKey}-${index}`;

const getRangeInputRefKey = (
  dayKey: WeekDayKey,
  index: number,
  field: keyof TimeRange,
) => `${dayKey}-${index}-${field}`;

const setFieldError = (
  errors: Record<string, RangeFieldError>,
  key: string,
  nextError: RangeFieldError,
) => {
  errors[key] = {
    ...errors[key],
    ...nextError,
  };
};

const getDayErrorBadge = (
  dayKey: WeekDayKey,
  fieldErrors: Record<string, RangeFieldError>,
): DayErrorBadge => {
  for (const [key, value] of Object.entries(fieldErrors)) {
    if (!key.startsWith(`${dayKey}-`)) {
      continue;
    }

    return {
      hasError: true,
      message: value.row ?? value.inicio ?? value.fim ?? "Ajuste as faixas",
    };
  }

  return {
    hasError: false,
    message: null,
  };
};

const formatTimeInput = (rawValue: string) => {
  const digits = rawValue.replace(/\D/g, "").slice(0, 4);

  if (!digits.length) {
    return "";
  }

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length === 3) {
    return `${digits.slice(0, 1)}:${digits.slice(1)}`;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

const normalizeTimeOnBlur = (rawValue: string) => {
  const digits = rawValue.replace(/\D/g, "").slice(0, 4);

  if (!digits.length) {
    return "";
  }

  if (digits.length <= 2) {
    const hour = Number(digits);

    if (!Number.isNaN(hour) && hour >= 0 && hour <= 23) {
      return `${String(hour).padStart(2, "0")}:00`;
    }

    return rawValue;
  }

  if (digits.length === 3) {
    const hour = Number(digits.slice(0, 1));
    const minutes = Number(digits.slice(1));

    if (
      !Number.isNaN(hour) &&
      !Number.isNaN(minutes) &&
      hour >= 0 &&
      hour <= 23 &&
      minutes >= 0 &&
      minutes <= 59
    ) {
      return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }

    return rawValue;
  }

  const hour = Number(digits.slice(0, 2));
  const minutes = Number(digits.slice(2));

  if (
    !Number.isNaN(hour) &&
    !Number.isNaN(minutes) &&
    hour >= 0 &&
    hour <= 23 &&
    minutes >= 0 &&
    minutes <= 59
  ) {
    return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  return rawValue;
};

const validateSchedule = (
  schedule: WeeklySchedule,
): ScheduleValidationResult => {
  const activeDays = weekDays.filter((day) => schedule[day.key].ativo);
  const fieldErrors: Record<string, RangeFieldError> = {};

  if (!activeDays.length) {
    return {
      message: "Selecione pelo menos um dia de funcionamento.",
      fieldErrors,
    };
  }

  for (const day of activeDays) {
    const ranges = schedule[day.key].faixas;

    if (!ranges.length) {
      return {
        message: `Adicione ao menos uma faixa de horário para ${day.label}.`,
        fieldErrors,
      };
    }

    for (const [index, range] of ranges.entries()) {
      const rangeErrorKey = getRangeErrorKey(day.key, index);

      if (!range.inicio || !range.fim) {
        setFieldError(fieldErrors, rangeErrorKey, {
          inicio: !range.inicio ? "Informe início." : undefined,
          fim: !range.fim ? "Informe fim." : undefined,
          row: "Complete os dois horários.",
        });

        return {
          message: `Preencha início e fim para ${day.label} (faixa ${index + 1}).`,
          fieldErrors,
        };
      }

      if (!TIME_PATTERN.test(range.inicio) || !TIME_PATTERN.test(range.fim)) {
        setFieldError(fieldErrors, rangeErrorKey, {
          inicio: !TIME_PATTERN.test(range.inicio)
            ? "Formato HH:mm."
            : undefined,
          fim: !TIME_PATTERN.test(range.fim) ? "Formato HH:mm." : undefined,
          row: "Corrija para HH:mm.",
        });

        return {
          message: `Use o padrão HH:mm em ${day.label} (faixa ${index + 1}).`,
          fieldErrors,
        };
      }

      const startMinutes = toMinutes(range.inicio);
      const endMinutes = toMinutes(range.fim);

      if (endMinutes <= startMinutes) {
        const isEqualTimes = endMinutes === startMinutes;

        setFieldError(fieldErrors, rangeErrorKey, {
          inicio: isEqualTimes
            ? "Não repita o mesmo horário."
            : "Início maior que fim.",
          fim: isEqualTimes
            ? "Não repita o mesmo horário."
            : "Fim menor que início.",
          row: isEqualTimes
            ? "Os horários não devem ser iguais."
            : "A faixa está invertida.",
        });

        return {
          message: isEqualTimes
            ? `Em ${day.label}, os horários da faixa ${index + 1} não devem ser iguais.`
            : `Em ${day.label}, o horário final deve ser maior que o inicial (faixa ${index + 1}).`,
          fieldErrors,
        };
      }
    }

    const rangesWithMinutes = ranges.map((range, index) => ({
      index,
      inicio: toMinutes(range.inicio),
      fim: toMinutes(range.fim),
    }));

    const sortedRanges = [...rangesWithMinutes].sort(
      (a, b) => a.inicio - b.inicio,
    );

    for (let i = 1; i < sortedRanges.length; i += 1) {
      const previousRange = sortedRanges[i - 1];
      const currentRange = sortedRanges[i];

      if (currentRange.inicio < previousRange.fim) {
        setFieldError(
          fieldErrors,
          getRangeErrorKey(day.key, previousRange.index),
          {
            inicio: "Conflito com outra faixa.",
            fim: "Conflito com outra faixa.",
            row: "Esta faixa sobrepõe outra.",
          },
        );

        setFieldError(
          fieldErrors,
          getRangeErrorKey(day.key, currentRange.index),
          {
            inicio: "Conflito com outra faixa.",
            fim: "Conflito com outra faixa.",
            row: "Esta faixa sobrepõe outra.",
          },
        );

        return {
          message: `As faixas ${previousRange.index + 1} e ${currentRange.index + 1} de ${day.label} estão sobrepostas.`,
          fieldErrors,
        };
      }
    }
  }

  return {
    message: null,
    fieldErrors,
  };
};

const buildSchedulePayload = (schedule: WeeklySchedule) =>
  weekDays.reduce(
    (acc, day) => {
      const daySchedule = schedule[day.key];

      if (!daySchedule.ativo) {
        return acc;
      }

      acc[day.key] = daySchedule.faixas
        .map((range) => `${range.inicio}-${range.fim}`)
        .join(", ");

      return acc;
    },
    {} as Record<string, string>,
  );

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
  senha_hash: "",
  confirmar_senha: "",
  aceitou_termos: false,
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

const ErrorBadge = ({ message }: { message: string }) => (
  <span className="mt-1 inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
    {message}
  </span>
);

export const Form = () => {
  const [values, setValues] = useState<FormValues>(initialFormValues);
  const [schedule, setSchedule] = useState<WeeklySchedule>(
    createInitialSchedule(),
  );
  const [draftSchedule, setDraftSchedule] = useState<WeeklySchedule>(
    createInitialSchedule(),
  );
  const [scheduleFieldErrors, setScheduleFieldErrors] = useState<
    Record<string, RangeFieldError>
  >({});
  const [isScheduleEditorOpen, setIsScheduleEditorOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoInputKey, setPhotoInputKey] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const scheduleInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

    const nextValue = name === "cnpj" ? maskCnpj(value) : value;

    setValues((prev) => ({ ...prev, [name]: nextValue }));
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

  const handleTermsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setValues((prev) => ({ ...prev, aceitou_termos: checked }));
    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors.aceitou_termos;
      return nextErrors;
    });
    setServerError(null);
    setSuccessMessage(null);
  };

  const clearScheduleError = () => {
    setErrors((prev) => {
      if (!prev.horario_funcionamento) {
        return prev;
      }

      const nextErrors = { ...prev };
      delete nextErrors.horario_funcionamento;
      return nextErrors;
    });

    setScheduleFieldErrors({});
  };

  const handleToggleDay = (dayKey: WeekDayKey, checked: boolean) => {
    setDraftSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        ativo: checked,
      },
    }));
    clearScheduleError();
    setServerError(null);
    setSuccessMessage(null);
  };

  const handleRangeChange = (
    dayKey: WeekDayKey,
    index: number,
    field: keyof TimeRange,
    value: string,
  ) => {
    const normalizedValue = formatTimeInput(value);

    setDraftSchedule((prev) => {
      const updatedRanges = prev[dayKey].faixas.map((range, rangeIndex) =>
        rangeIndex === index ? { ...range, [field]: normalizedValue } : range,
      );

      return {
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          faixas: updatedRanges,
        },
      };
    });
    clearScheduleError();
    setServerError(null);
    setSuccessMessage(null);
  };

  const handleRangeBlur = (
    dayKey: WeekDayKey,
    index: number,
    field: keyof TimeRange,
  ) => {
    setDraftSchedule((prev) => {
      const currentValue = prev[dayKey].faixas[index][field];
      const normalizedValue = normalizeTimeOnBlur(currentValue);

      if (currentValue === normalizedValue) {
        return prev;
      }

      const updatedRanges = prev[dayKey].faixas.map((range, rangeIndex) =>
        rangeIndex === index ? { ...range, [field]: normalizedValue } : range,
      );

      return {
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          faixas: updatedRanges,
        },
      };
    });
  };

  const handleAddRange = (dayKey: WeekDayKey) => {
    setDraftSchedule((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        faixas: [...prev[dayKey].faixas, createEmptyRange()],
      },
    }));
    clearScheduleError();
    setServerError(null);
    setSuccessMessage(null);
  };

  const handleRemoveRange = (dayKey: WeekDayKey, index: number) => {
    setDraftSchedule((prev) => {
      const nextRanges = prev[dayKey].faixas.filter(
        (_, rangeIndex) => rangeIndex !== index,
      );

      return {
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          faixas: nextRanges.length ? nextRanges : [createEmptyRange()],
        },
      };
    });
    clearScheduleError();
    setServerError(null);
    setSuccessMessage(null);
  };

  const getCompactScheduleSummary = () => {
    const activeDays = weekDays.filter((day) => schedule[day.key].ativo);

    if (!activeDays.length) {
      return [];
    }

    return activeDays.map((day) => {
      const ranges = schedule[day.key].faixas
        .map((range) => `${range.inicio}-${range.fim}`)
        .join(" | ");

      return `${day.shortLabel}: ${ranges}`;
    });
  };

  const openScheduleEditor = () => {
    setDraftSchedule(cloneSchedule(schedule));
    setScheduleFieldErrors({});
    setIsScheduleEditorOpen(true);
    setServerError(null);
    setSuccessMessage(null);
  };

  const closeScheduleEditor = () => {
    setDraftSchedule(cloneSchedule(schedule));
    setScheduleFieldErrors({});
    setIsScheduleEditorOpen(false);
  };

  const handleSaveSchedule = () => {
    const validation = validateSchedule(draftSchedule);

    if (validation.message) {
      setScheduleFieldErrors(validation.fieldErrors);
      setErrors((prev) => ({
        ...prev,
        horario_funcionamento: validation.message ?? undefined,
      }));

      const focusOrder: Array<keyof TimeRange> = ["inicio", "fim"];

      for (const day of weekDays) {
        const dayRanges = draftSchedule[day.key].faixas;

        for (let index = 0; index < dayRanges.length; index += 1) {
          const fieldError =
            validation.fieldErrors[getRangeErrorKey(day.key, index)];

          if (!fieldError) {
            continue;
          }

          for (const field of focusOrder) {
            if (!fieldError[field]) {
              continue;
            }

            const inputRef =
              scheduleInputRefs.current[
                getRangeInputRefKey(day.key, index, field)
              ];

            if (inputRef) {
              setTimeout(() => {
                inputRef.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                  inline: "nearest",
                });
                inputRef.focus();
                inputRef.select();
              }, 0);
            }

            return;
          }
        }
      }

      return;
    }

    setScheduleFieldErrors({});
    setSchedule(cloneSchedule(draftSchedule));
    clearScheduleError();
    setIsScheduleEditorOpen(false);
  };

  const validateStep = (stepNumber: number, formValues: FormValues) => {
    const newErrors: FormErrors = {};

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
      const scheduleValidation = validateSchedule(schedule);
      if (scheduleValidation.message) {
        newErrors.horario_funcionamento = scheduleValidation.message;
      }
    }

    if (stepNumber === 3) {
      if (!formValues.senha_hash.trim()) {
        newErrors.senha_hash = "Senha é obrigatória";
      } else if (formValues.senha_hash.trim().length < 6) {
        newErrors.senha_hash = "Senha deve ter pelo menos 6 caracteres";
      }
      if (!formValues.confirmar_senha.trim()) {
        newErrors.confirmar_senha = "Confirmação de senha é obrigatória";
      } else if (formValues.senha_hash !== formValues.confirmar_senha) {
        newErrors.confirmar_senha = "As senhas não conferem";
      }
      if (!formValues.aceitou_termos) {
        newErrors.aceitou_termos =
          "Voce precisa aceitar os termos para continuar";
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
      cnpj: getDocumentDigits(values.cnpj, 14) || null,
      razao_social: values.razao_social.trim() || null,
      categoria: values.categoria,
      instagram: values.instagram.trim() || null,
      servicos_oferecidos: parseCsv(values.servicos_oferecidos),
      tecnicas_utilizadas: parseCsv(values.tecnicas_utilizadas),
      produtos_aplicados: parseCsv(values.produtos_aplicados),
      profissionais_envolvidos: parseCsv(values.profissionais_envolvidos),
      horario_funcionamento: buildSchedulePayload(schedule),
      senha_hash: values.senha_hash,
      aceitou_termos: values.aceitou_termos,
    };

    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);

    try {
      await api.post("/v1/estabelecimentos/", body);
      setSuccessMessage("Estabelecimento cadastrado com sucesso.");
      setValues(initialFormValues);
      setSchedule(createInitialSchedule());
      setDraftSchedule(createInitialSchedule());
      setIsScheduleEditorOpen(false);
      setPhotoFile(null);
      setPhotoInputKey((prev) => prev + 1);
      setCurrentStep(1);
    } catch (error: unknown) {
      const message = getApiErrorMessage(error);
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
                <ErrorBadge message={errors.nome_estabelecimento} />
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
                <ErrorBadge message={errors.responsavel} />
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
              {errors.telefone && <ErrorBadge message={errors.telefone} />}
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
              {errors.email && <ErrorBadge message={errors.email} />}
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
                <ErrorBadge message={errors.localizacao} />
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
              {errors.cnpj && <ErrorBadge message={errors.cnpj} />}
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
                <ErrorBadge message={errors.razao_social} />
              )}
            </label>
          </>
        ) : null}

        {currentStep === 2 ? (
          isScheduleEditorOpen ? (
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeScheduleEditor}
                  className="px-3 py-1.5 text-xs"
                >
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" strokeWidth={2} />
                  Voltar ao formulário
                </Button>

                <Button
                  type="button"
                  onClick={handleSaveSchedule}
                  className="px-3 py-1.5 text-xs"
                >
                  Salvar horários
                </Button>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Horário de funcionamento (24h)
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Selecione os dias e informe faixas no padrão HH:mm.
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {weekDays.map((day) => {
                  const daySchedule = draftSchedule[day.key];
                  const dayErrorBadge = getDayErrorBadge(
                    day.key,
                    scheduleFieldErrors,
                  );

                  return (
                    <div
                      key={day.key}
                      className={`rounded-xl border px-3 py-3 transition-colors sm:px-4 ${
                        daySchedule.ativo
                          ? "border-emerald-200 bg-white"
                          : "border-slate-200 bg-white/70"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={daySchedule.ativo}
                            onChange={(event) =>
                              handleToggleDay(day.key, event.target.checked)
                            }
                            className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                          />
                          <span className="inline-flex min-w-10 items-center justify-center rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                            {day.shortLabel}
                          </span>
                          <span>{day.label}</span>
                          {dayErrorBadge.hasError ? (
                            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                              {dayErrorBadge.message}
                            </span>
                          ) : null}
                        </label>

                        <Button
                          type="button"
                          variant="outline"
                          disabled={!daySchedule.ativo}
                          onClick={() => handleAddRange(day.key)}
                          className="px-3 py-1.5 text-xs"
                        >
                          + Adicionar faixa
                        </Button>
                      </div>

                      <div className="mt-3 space-y-2">
                        {daySchedule.faixas.map((range, index) => {
                          const rangeErrorKey = getRangeErrorKey(
                            day.key,
                            index,
                          );
                          const rangeErrors =
                            scheduleFieldErrors[rangeErrorKey];

                          return (
                            <div
                              key={`${day.key}-${index}`}
                              className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-center"
                            >
                              <div>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={5}
                                  placeholder="HH:mm"
                                  value={range.inicio}
                                  disabled={!daySchedule.ativo}
                                  onChange={(event) =>
                                    handleRangeChange(
                                      day.key,
                                      index,
                                      "inicio",
                                      event.target.value,
                                    )
                                  }
                                  onBlur={() =>
                                    handleRangeBlur(day.key, index, "inicio")
                                  }
                                  ref={(element) => {
                                    scheduleInputRefs.current[
                                      getRangeInputRefKey(
                                        day.key,
                                        index,
                                        "inicio",
                                      )
                                    ] = element;
                                  }}
                                  className={`border bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
                                    rangeErrors?.inicio
                                      ? "border-rose-300 ring-2 ring-rose-100"
                                      : "border-slate-200"
                                  }`}
                                />
                                {rangeErrors?.inicio && !rangeErrors.row ? (
                                  <ErrorBadge message={rangeErrors.inicio} />
                                ) : null}
                              </div>
                              <span className="hidden text-center text-sm font-medium text-slate-500 sm:block">
                                até
                              </span>
                              <div>
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={5}
                                  placeholder="HH:mm"
                                  value={range.fim}
                                  disabled={!daySchedule.ativo}
                                  onChange={(event) =>
                                    handleRangeChange(
                                      day.key,
                                      index,
                                      "fim",
                                      event.target.value,
                                    )
                                  }
                                  onBlur={() =>
                                    handleRangeBlur(day.key, index, "fim")
                                  }
                                  ref={(element) => {
                                    scheduleInputRefs.current[
                                      getRangeInputRefKey(day.key, index, "fim")
                                    ] = element;
                                  }}
                                  className={`border bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
                                    rangeErrors?.fim
                                      ? "border-rose-300 ring-2 ring-rose-100"
                                      : "border-slate-200"
                                  }`}
                                />
                                {rangeErrors?.fim && !rangeErrors.row ? (
                                  <ErrorBadge message={rangeErrors.fim} />
                                ) : null}
                              </div>
                              <button
                                type="button"
                                disabled={!daySchedule.ativo}
                                onClick={() =>
                                  handleRemoveRange(day.key, index)
                                }
                                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 ${
                                  rangeErrors?.row
                                    ? "border-rose-300 bg-rose-50 text-rose-700"
                                    : "border-slate-200 text-slate-600"
                                }`}
                              >
                                Remover
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {errors.horario_funcionamento ? (
                <ErrorBadge message={errors.horario_funcionamento} />
              ) : null}
            </div>
          ) : (
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
                {errors.categoria && <ErrorBadge message={errors.categoria} />}
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
                {errors.instagram && <ErrorBadge message={errors.instagram} />}
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
                  <ErrorBadge message={errors.profissionais_envolvidos} />
                )}
              </label>

              <div className="space-y-3 md:col-span-2">
                <div>
                  <span className="text-sm font-medium text-slate-700">
                    Horário de funcionamento *
                  </span>
                  <p className="mt-1 text-xs text-slate-500">
                    Formato 24h (HH:mm). Configure os horários em um editor
                    dedicado.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {getCompactScheduleSummary().length ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Resumo salvo
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {getCompactScheduleSummary().map((item) => (
                          <span
                            key={item}
                            className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Nenhum horário configurado ainda.
                    </p>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={openScheduleEditor}
                    className="mt-4 px-3 py-1.5 text-xs"
                  >
                    {getCompactScheduleSummary().length
                      ? "Alterar horários"
                      : "Definir horários"}
                  </Button>
                </div>

                {errors.horario_funcionamento ? (
                  <ErrorBadge message={errors.horario_funcionamento} />
                ) : null}
              </div>
            </>
          )
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
              {errors.senha_hash && <ErrorBadge message={errors.senha_hash} />}
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
                <ErrorBadge message={errors.confirmar_senha} />
              )}
            </label>

            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="aceitou_termos"
                  checked={values.aceitou_termos}
                  onChange={handleTermsChange}
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
              {errors.aceitou_termos ? (
                <ErrorBadge message={errors.aceitou_termos} />
              ) : null}
            </div>
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
