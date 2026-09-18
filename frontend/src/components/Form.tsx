import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { ArrowLeft, ChevronDown, LocateFixed, X } from "lucide-react";
import Input from "./Input";
import Button from "./Button";
import api from "../services/api";
import type { UserSession } from "../types/auth";
import {
  getDocumentDigits,
  maskCep,
  maskCnpj,
  maskCpf,
  maskPhone,
} from "../utils/documentMasks";
import { getApiErrorMessage } from "../utils/apiErrors";
import {
  getCurrentLocationLabel,
  getGeolocationErrorMessage,
} from "../utils/geolocation";

type MultiValueField =
  | "servicos_oferecidos"
  | "tecnicas_utilizadas"
  | "produtos_aplicados"
  | "profissionais_envolvidos";

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
  termos_aceitos: boolean;
}

interface IbgeState {
  id: number;
  sigla: string;
  nome: string;
}

interface IbgeCity {
  id: number;
  nome: string;
}

interface ServiceCity {
  state: string;
  city: string;
}

type LocationInputMode = "cep" | "manual";

interface ViaCepAddress {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

interface ViaCepResponse {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
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

interface FormProps {
  onLoginSuccess: (session: UserSession) => void;
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
  termos_aceitos: false,
};

const initialServiceCity = (): ServiceCity => ({ state: "", city: "" });

const LOCATION_MODAL_EXIT_DURATION_MS = 220;

const validateEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const validateCnpj = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 14;
};

const validateCpf = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11;
};

const ErrorBadge = ({ message }: { message: string }) => (
  <span className="mt-1 inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
    {message}
  </span>
);

interface SearchableOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  value: string;
  options: SearchableOption[];
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
}

const SearchableSelect = ({
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
  loading = false,
}: SearchableSelectProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value);
  const [query, setQuery] = useState(selectedOption?.label ?? "");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery(selectedOption?.label ?? "");
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [selectedOption?.label]);

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredOptions = options.filter((option) =>
    `${option.label} ${option.value}`
      .toLocaleLowerCase()
      .includes(normalizedQuery),
  );

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          disabled={disabled}
          placeholder={loading ? "Carregando..." : placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        />
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          strokeWidth={2}
        />
      </div>

      {isOpen && !disabled ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          {loading ? (
            <p className="px-3 py-2 text-sm text-slate-500">
              Carregando opções...
            </p>
          ) : filteredOptions.length ? (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.value);
                  setQuery(option.label);
                  setIsOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-emerald-50 hover:text-emerald-900 ${
                  option.value === value
                    ? "bg-emerald-100 font-semibold text-emerald-900"
                    : "text-slate-700"
                }`}
              >
                {option.label}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-slate-500">
              Nenhuma opção encontrada.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
};

export const Form = ({ onLoginSuccess }: FormProps) => {
  const [values, setValues] = useState<FormValues>(initialFormValues);
  const [multiValueInputs, setMultiValueInputs] = useState<
    Record<MultiValueField, string[]>
  >({
    servicos_oferecidos: [],
    tecnicas_utilizadas: [],
    produtos_aplicados: [],
    profissionais_envolvidos: [],
  });
  const [multiValueDrafts, setMultiValueDrafts] = useState<
    Record<MultiValueField, string>
  >({
    servicos_oferecidos: "",
    tecnicas_utilizadas: "",
    produtos_aplicados: "",
    profissionais_envolvidos: "",
  });
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
  const [ufs, setUfs] = useState<IbgeState[]>([]);
  const [citiesByState, setCitiesByState] = useState<
    Record<string, IbgeCity[]>
  >({});
  const [loadingCitiesByState, setLoadingCitiesByState] = useState<
    Record<string, boolean>
  >({});
  const [serviceCities, setServiceCities] = useState<ServiceCity[]>([
    initialServiceCity(),
  ]);
  const [atendeEmDiferentesEstados, setAtendeEmDiferentesEstados] =
    useState(false);
  const [isServiceLocationModalOpen, setIsServiceLocationModalOpen] =
    useState(false);
  const serviceLocationModalRef = useRef<HTMLDivElement | null>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);
  const [isServiceLocationModalRendered, setIsServiceLocationModalRendered] =
    useState(false);
  const [isServiceLocationModalClosing, setIsServiceLocationModalClosing] =
    useState(false);
  const [hasNoFixedLocation, setHasNoFixedLocation] = useState(false);
  const [isAutonomo, setIsAutonomo] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationInputMode, setLocationInputMode] =
    useState<LocationInputMode>("manual");
  const [cepValue, setCepValue] = useState("");
  const [cepAddress, setCepAddress] = useState<ViaCepAddress | null>(null);
  const [cepNumero, setCepNumero] = useState("");
  const [cepComplemento, setCepComplemento] = useState("");
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [locationToggleThumb, setLocationToggleThumb] = useState({
    left: 0,
    width: 0,
  });
  const cepModeButtonRef = useRef<HTMLButtonElement | null>(null);
  const manualModeButtonRef = useRef<HTMLButtonElement | null>(null);
  const scheduleInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch(
      "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome",
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error("Falha ao buscar estados.");
        }

        return response.json() as Promise<IbgeState[]>;
      })
      .then(setUfs)
      .catch(() => setServerError("Não foi possível carregar os estados."));
  }, []);

  useEffect(() => {
    if (locationInputMode !== "cep") {
      return;
    }

    const digits = getDocumentDigits(cepValue, 8);

    if (digits.length !== 8) {
      setCepAddress(null);
      setCepError(null);
      return;
    }

    let isCancelled = false;
    setIsFetchingCep(true);
    setCepError(null);

    fetch(`https://viacep.com.br/ws/${digits}/json/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Falha ao consultar o CEP.");
        }

        return response.json() as Promise<ViaCepResponse>;
      })
      .then((data) => {
        if (isCancelled) {
          return;
        }

        if (data.erro) {
          setCepAddress(null);
          setCepError("CEP não encontrado.");
          return;
        }

        setCepAddress({
          logradouro: data.logradouro ?? "",
          bairro: data.bairro ?? "",
          localidade: data.localidade ?? "",
          uf: data.uf ?? "",
        });
      })
      .catch(() => {
        if (!isCancelled) {
          setCepAddress(null);
          setCepError("Não foi possível consultar o CEP. Tente novamente.");
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsFetchingCep(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [cepValue, locationInputMode]);

  useEffect(() => {
    if (locationInputMode !== "cep") {
      return;
    }

    if (!cepAddress) {
      setValues((prev) =>
        prev.localizacao ? { ...prev, localizacao: "" } : prev,
      );
      return;
    }

    const enderecoLinha = [cepAddress.logradouro, cepNumero.trim()]
      .filter(Boolean)
      .join(", ");

    const cidadeUf = [cepAddress.localidade, cepAddress.uf]
      .filter(Boolean)
      .join(" - ");

    const composed = [
      enderecoLinha,
      cepComplemento.trim(),
      cepAddress.bairro,
      cidadeUf,
      `CEP ${maskCep(cepValue)}`,
    ]
      .filter(Boolean)
      .join(", ");

    setValues((prev) =>
      prev.localizacao === composed ? prev : { ...prev, localizacao: composed },
    );
    setErrors((prev) => {
      if (!prev.localizacao) {
        return prev;
      }

      const nextErrors = { ...prev };
      delete nextErrors.localizacao;
      return nextErrors;
    });
  }, [locationInputMode, cepAddress, cepNumero, cepComplemento, cepValue]);

  useLayoutEffect(() => {
    if (hasNoFixedLocation) {
      return;
    }

    const activeButton =
      locationInputMode === "cep"
        ? cepModeButtonRef.current
        : manualModeButtonRef.current;

    if (!activeButton) {
      return;
    }

    setLocationToggleThumb({
      left: activeButton.offsetLeft,
      width: activeButton.offsetWidth,
    });
  }, [locationInputMode, hasNoFixedLocation]);

  useEffect(() => {
    if (isServiceLocationModalOpen) {
      return;
    }

    if (!isServiceLocationModalRendered) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsServiceLocationModalRendered(false);
      setIsServiceLocationModalClosing(false);
    }, LOCATION_MODAL_EXIT_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isServiceLocationModalOpen, isServiceLocationModalRendered]);

  useEffect(() => {
    if (!isServiceLocationModalOpen || !serviceLocationModalRef.current) {
      return;
    }

    const modal = serviceLocationModalRef.current;
    const previousFocusedElement = document.activeElement;
    previousFocusedElementRef.current =
      previousFocusedElement instanceof HTMLElement
        ? previousFocusedElement
        : null;

    const focusableSelector = [
      "button:not([disabled])",
      "[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
    ].join(", ");

    const focusableElements = Array.from(
      modal.querySelectorAll<HTMLElement>(focusableSelector),
    );
    const firstFocusable = focusableElements[0] ?? modal;
    firstFocusable.focus();

    const inertElements = Array.from(
      document.querySelectorAll<HTMLElement>(focusableSelector),
    ).filter(
      (element) =>
        !modal.contains(element) && !element.hasAttribute("data-modal-guard"),
    );

    inertElements.forEach((element) => {
      element.setAttribute("data-modal-guard", "true");
      element.setAttribute("inert", "");
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeServiceLocationModal();
        return;
      }

      if (event.key !== "Tab" || !modal) {
        return;
      }

      const elements = Array.from(
        modal.querySelectorAll<HTMLElement>(focusableSelector),
      );

      if (!elements.length) {
        event.preventDefault();
        modal.focus();
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      inertElements.forEach((element) => {
        element.removeAttribute("inert");
        element.removeAttribute("data-modal-guard");
      });
      previousFocusedElementRef.current?.focus();
    };
  }, [isServiceLocationModalOpen]);

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

    const nextValue =
      name === "cnpj"
        ? isAutonomo
          ? maskCpf(value)
          : maskCnpj(value)
        : name === "telefone"
          ? maskPhone(value)
          : value;

    setValues((prev) => ({ ...prev, [name]: nextValue }));
    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors[name as keyof FormValues];
      return nextErrors;
    });
    setServerError(null);
    setSuccessMessage(null);
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    setLocationError(null);

    try {
      const label = await getCurrentLocationLabel();
      setLocationInputMode("manual");
      setCepValue("");
      setCepAddress(null);
      setCepNumero("");
      setCepComplemento("");
      setCepError(null);
      setValues((prev) => ({ ...prev, localizacao: label }));
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors.localizacao;
        return nextErrors;
      });
    } catch (error) {
      setLocationError(getGeolocationErrorMessage(error));
    } finally {
      setIsLocating(false);
    }
  };

  const handleAutonomoToggle = (checked: boolean) => {
    setIsAutonomo(checked);
    setValues((prev) => ({
      ...prev,
      cnpj: "",
      razao_social: checked ? "" : prev.razao_social,
    }));
    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors.cnpj;
      if (checked) {
        delete nextErrors.razao_social;
      }
      return nextErrors;
    });
    setServerError(null);
    setSuccessMessage(null);
  };

  const handleFixedLocationToggle = (checked: boolean) => {
    setHasNoFixedLocation(checked);
    setLocationError(null);
    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors.localizacao;
      return nextErrors;
    });

    if (checked) {
      setValues((prev) => ({ ...prev, localizacao: "" }));
      setCepValue("");
      setCepAddress(null);
      setCepNumero("");
      setCepComplemento("");
      setCepError(null);
      openServiceLocationModal();
    }
  };

  const handleLocationModeChange = (mode: LocationInputMode) => {
    if (mode === locationInputMode) {
      return;
    }

    setLocationInputMode(mode);
    setValues((prev) => ({ ...prev, localizacao: "" }));
    setCepValue("");
    setCepAddress(null);
    setCepNumero("");
    setCepComplemento("");
    setCepError(null);
    setLocationError(null);
    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors.localizacao;
      return nextErrors;
    });
  };

  const handleCepChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCepValue(maskCep(event.target.value));
  };

  const openServiceLocationModal = () => {
    setIsServiceLocationModalRendered(true);
    setIsServiceLocationModalClosing(false);
    setIsServiceLocationModalOpen(true);
  };

  const closeServiceLocationModal = () => {
    setIsServiceLocationModalClosing(true);
    setIsServiceLocationModalOpen(false);
  };

  const handleMultiStateToggle = (checked: boolean) => {
    setAtendeEmDiferentesEstados(checked);

    if (checked) {
      return;
    }

    setServiceCities((prev) => {
      const defaultState = prev[0]?.state ?? "";

      return prev.map((item, index) =>
        index === 0
          ? item
          : {
              ...item,
              state: defaultState,
              city: "",
            },
      );
    });
  };

  const handleServiceCityChange = async (
    index: number,
    field: keyof ServiceCity,
    value: string,
  ) => {
    setServiceCities((prev) => {
      const nextRowState =
        field === "state" ? value : (prev[index]?.state ?? "");
      const defaultState = prev[0]?.state ?? "";

      return prev.map((item, itemIndex) => {
        if (itemIndex === index) {
          return {
            ...item,
            [field]: value,
            ...(field === "state" ? { city: "" } : {}),
          };
        }

        if (field === "state" && itemIndex > 0 && !atendeEmDiferentesEstados) {
          return {
            ...item,
            state: nextRowState || defaultState,
            city: "",
          };
        }

        return item;
      });
    });

    if (field !== "state" || !value || citiesByState[value]) {
      return;
    }

    setLoadingCitiesByState((prev) => ({ ...prev, [value]: true }));

    try {
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${value}/municipios`,
      );

      if (!response.ok) {
        throw new Error("Falha ao buscar cidades.");
      }

      const cities = (await response.json()) as IbgeCity[];
      setCitiesByState((prev) => ({ ...prev, [value]: cities }));
    } catch {
      setServerError("Não foi possível carregar as cidades desse estado.");
    } finally {
      setLoadingCitiesByState((prev) => ({ ...prev, [value]: false }));
    }
  };

  const handleSaveServiceCities = () => {
    const normalizedCities = serviceCities.map((item, index) =>
      !atendeEmDiferentesEstados && index > 0
        ? { ...item, state: serviceCities[0]?.state ?? item.state }
        : item,
    );
    const validCities = normalizedCities.filter(
      (item) => item.state && item.city,
    );

    if (!validCities.length || validCities.length !== normalizedCities.length) {
      setServerError("Selecione o estado e a cidade de cada atendimento.");
      return;
    }

    setServiceCities(normalizedCities);

    const locationLabel = validCities
      .map((item) => `${item.city} - ${item.state}`)
      .join(", ");
    setValues((prev) => ({
      ...prev,
      localizacao: `Atendimento em: ${locationLabel}`,
    }));
    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors.localizacao;
      return nextErrors;
    });
    setServerError(null);
    closeServiceLocationModal();
  };

  const handleAddServiceCity = () => {
    setServiceCities((prev) => {
      const defaultState = prev[0]?.state ?? "";
      return [...prev, { state: defaultState, city: "" }];
    });
  };

  const handleRemoveServiceCity = (index: number) => {
    setServiceCities((prev) => {
      if (prev.length === 1) {
        return [initialServiceCity()];
      }

      const nextCities = prev.filter((_, itemIndex) => itemIndex !== index);

      if (!atendeEmDiferentesEstados && nextCities.length > 0) {
        const defaultState = nextCities[0]?.state ?? "";
        return nextCities.map((item, itemIndex) =>
          itemIndex === 0 ? item : { ...item, state: defaultState },
        );
      }

      return nextCities;
    });
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPhotoFile(file);
    setServerError(null);
    setSuccessMessage(null);
  };

  const handleTermsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setValues((prev) => ({ ...prev, termos_aceitos: checked }));
    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors.termos_aceitos;
      return nextErrors;
    });
    setServerError(null);
    setSuccessMessage(null);
  };

  const addMultiValueItem = (field: MultiValueField) => {
    const value = multiValueDrafts[field].trim();

    if (!value) {
      return;
    }

    setMultiValueInputs((prev) => {
      const currentItems = prev[field];
      const normalizedValue = value.replace(/\s+/g, " ");

      if (
        currentItems.some(
          (item) => item.toLowerCase() === normalizedValue.toLowerCase(),
        )
      ) {
        return prev;
      }

      return {
        ...prev,
        [field]: [...currentItems, normalizedValue],
      };
    });

    setMultiValueDrafts((prev) => ({
      ...prev,
      [field]: "",
    }));
    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors[field];
      return nextErrors;
    });
    setServerError(null);
    setSuccessMessage(null);
  };

  const removeMultiValueItem = (
    field: MultiValueField,
    itemToRemove: string,
  ) => {
    setMultiValueInputs((prev) => ({
      ...prev,
      [field]: prev[field].filter((item) => item !== itemToRemove),
    }));
    setErrors((prev) => {
      const nextErrors = { ...prev };
      delete nextErrors[field];
      return nextErrors;
    });
  };

  const renderMultiValueField = (
    field: MultiValueField,
    label: string,
    placeholder: string,
  ) => (
    <div className="space-y-2 md:col-span-2">
      <span
        id={`${field}-label`}
        className="text-sm font-medium text-slate-700"
      >
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 focus-within:ring-2 focus-within:ring-emerald-300">
        {multiValueInputs[field].map((item) => (
          <button
            key={`${field}-${item}`}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => removeMultiValueItem(field, item)}
            className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-900 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            title={`Remover ${item}`}
          >
            <span>{item}</span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-500 group-hover:text-rose-700">
              ×
            </span>
          </button>
        ))}

        <div className="flex min-w-40 flex-1 items-center gap-2">
          <input
            type="text"
            aria-labelledby={`${field}-label`}
            value={multiValueDrafts[field]}
            onChange={(event) =>
              setMultiValueDrafts((prev) => ({
                ...prev,
                [field]: event.target.value,
              }))
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addMultiValueItem(field);
              }
            }}
            placeholder={placeholder}
            className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addMultiValueItem(field)}
            className="shrink-0 px-3 py-1.5 text-xs"
          >
            Adicionar
          </Button>
        </div>
      </div>
      {errors[field] && <ErrorBadge message={errors[field]} />}
    </div>
  );

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
      if (!hasNoFixedLocation && !formValues.localizacao.trim()) {
        newErrors.localizacao = "Localização é obrigatória";
      }
      if (
        hasNoFixedLocation &&
        !serviceCities.every((item) => item.state && item.city)
      ) {
        newErrors.localizacao = "Informe as cidades de atendimento";
      }
      if (!formValues.cnpj.trim()) {
        newErrors.cnpj = isAutonomo
          ? "CPF é obrigatório"
          : "CNPJ é obrigatório";
      } else if (
        isAutonomo
          ? !validateCpf(formValues.cnpj)
          : !validateCnpj(formValues.cnpj)
      ) {
        newErrors.cnpj = isAutonomo
          ? "CPF deve conter 11 dígitos"
          : "CNPJ deve conter 14 dígitos";
      }
      if (!isAutonomo && !formValues.razao_social.trim()) {
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
      if (!multiValueInputs.profissionais_envolvidos.length) {
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
      if (!formValues.termos_aceitos) {
        newErrors.termos_aceitos =
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
      tipo_pessoa: isAutonomo ? "autonomo" : "juridica",
      cpf: isAutonomo ? getDocumentDigits(values.cnpj, 11) || null : null,
      cnpj: isAutonomo ? null : getDocumentDigits(values.cnpj, 14) || null,
      razao_social: isAutonomo ? null : values.razao_social.trim() || null,
      categoria: values.categoria,
      instagram: values.instagram.trim() || null,
      servicos_oferecidos: multiValueInputs.servicos_oferecidos,
      tecnicas_utilizadas: multiValueInputs.tecnicas_utilizadas,
      produtos_aplicados: multiValueInputs.produtos_aplicados,
      profissionais_envolvidos: multiValueInputs.profissionais_envolvidos,
      horario_funcionamento: buildSchedulePayload(schedule),
      senha_hash: values.senha_hash,
      aceitou_termos: values.termos_aceitos,
    };

    setIsSubmitting(true);
    setServerError(null);
    setSuccessMessage(null);
    let establishmentCreated = false;

    try {
      await api.post("/v1/estabelecimentos/", body);
      establishmentCreated = true;

      const loginResponse = await api.post("/v1/auth/login", {
        identificador: isAutonomo
          ? getDocumentDigits(values.cnpj, 11)
          : getDocumentDigits(values.cnpj, 14),
        senha: values.senha_hash,
        role: "estabelecimento",
      });

      const session = parseUserSession(
        loginResponse.data as Partial<UserSession> | undefined,
      );

      setValues(initialFormValues);
      setSchedule(createInitialSchedule());
      setDraftSchedule(createInitialSchedule());
      setMultiValueInputs({
        servicos_oferecidos: [],
        tecnicas_utilizadas: [],
        produtos_aplicados: [],
        profissionais_envolvidos: [],
      });
      setMultiValueDrafts({
        servicos_oferecidos: "",
        tecnicas_utilizadas: "",
        produtos_aplicados: "",
        profissionais_envolvidos: "",
      });
      setIsScheduleEditorOpen(false);
      setPhotoFile(null);
      setPhotoInputKey((prev) => prev + 1);
      setHasNoFixedLocation(false);
      setIsAutonomo(false);
      setServiceCities([initialServiceCity()]);
      setLocationError(null);
      setLocationInputMode("manual");
      setCepValue("");
      setCepAddress(null);
      setCepNumero("");
      setCepComplemento("");
      setCepError(null);
      setCurrentStep(1);
      onLoginSuccess(session);
    } catch (error: unknown) {
      const message = getApiErrorMessage(error);
      setServerError(
        establishmentCreated
          ? `Estabelecimento cadastrado, mas houve falha no login automatico: ${message}`
          : `Falha ao cadastrar estabelecimento: ${message}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      id="establishment-form"
      onSubmit={handleSubmit}
      className="rounded-3xl bg-white/95 p-8 ring-1 ring-slate-200"
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-emerald-900 sm:text-2xl">
            Cadastro de estabelecimento
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Preencha os dados para publicar seu negócio na plataforma.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {[1, 2, 3].map((step) => {
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

      <div
        className={`grid gap-4 md:grid-cols-2 ${
          isScheduleEditorOpen ? "pb-16" : ""
        }`}
      >
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
                className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-300"
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
                placeholder="(00) 0 0000-0000"
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

            <div className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                Localização *
              </span>

              {!hasNoFixedLocation ? (
                <div className="relative mt-1 flex w-fit flex-wrap gap-1 rounded-full border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-1 rounded-full bg-emerald-700 shadow-sm transition-[left,width] duration-300 ease-in-out"
                    style={{
                      left: locationToggleThumb.left,
                      width: locationToggleThumb.width,
                    }}
                  />
                  <button
                    ref={cepModeButtonRef}
                    type="button"
                    onClick={() => handleLocationModeChange("cep")}
                    className={`relative z-10 whitespace-nowrap rounded-full px-3 py-1.5 transition-colors duration-300 ${
                      locationInputMode === "cep"
                        ? "text-white"
                        : "text-slate-600 hover:text-emerald-700"
                    }`}
                  >
                    Preencher com CEP
                  </button>
                  <button
                    ref={manualModeButtonRef}
                    type="button"
                    onClick={() => handleLocationModeChange("manual")}
                    className={`relative z-10 whitespace-nowrap rounded-full px-3 py-1.5 transition-colors duration-300 ${
                      locationInputMode === "manual"
                        ? "text-white"
                        : "text-slate-600 hover:text-emerald-700"
                    }`}
                  >
                    Preencher por extenso
                  </button>
                </div>
              ) : null}

              {hasNoFixedLocation ? (
                <Input
                  name="localizacao"
                  value={values.localizacao}
                  onChange={handleChange}
                  disabled
                  placeholder="Use o botão para escolher as cidades"
                />
              ) : locationInputMode === "manual" ? (
                <Input
                  name="localizacao"
                  value={values.localizacao}
                  onChange={handleChange}
                  placeholder="Endereço, bairro ou cidade"
                />
              ) : (
                <div className="space-y-3">
                  <Input
                    name="cep"
                    value={cepValue}
                    onChange={handleCepChange}
                    inputMode="numeric"
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {isFetchingCep ? (
                    <p className="text-xs text-slate-500">
                      Buscando endereço...
                    </p>
                  ) : null}
                  {cepError ? <ErrorBadge message={cepError} /> : null}
                  {cepAddress ? (
                    <>
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
                        {[
                          cepAddress.logradouro,
                          cepAddress.bairro,
                          [cepAddress.localidade, cepAddress.uf]
                            .filter(Boolean)
                            .join(" - "),
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="space-y-1">
                          <span className="text-xs font-medium text-slate-600">
                            Número
                          </span>
                          <Input
                            value={cepNumero}
                            onChange={(event) =>
                              setCepNumero(event.target.value)
                            }
                            placeholder="Número"
                          />
                        </label>
                        <label className="space-y-1">
                          <span className="text-xs font-medium text-slate-600">
                            Complemento
                          </span>
                          <Input
                            value={cepComplemento}
                            onChange={(event) =>
                              setCepComplemento(event.target.value)
                            }
                            placeholder="Apto, bloco, referência (opcional)"
                          />
                        </label>
                      </div>
                    </>
                  ) : null}
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <label className="flex min-w-0 items-start gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={hasNoFixedLocation}
                    onChange={(event) =>
                      handleFixedLocationToggle(event.target.checked)
                    }
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                  />
                  <span>Não possuo local fixo de atendimento</span>
                </label>
                {!hasNoFixedLocation ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    aria-label="Usar minha localização"
                    className="shrink-0 px-3 py-1.5 text-xs disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <LocateFixed
                      className="mr-1.5 h-3.5 w-3.5"
                      strokeWidth={2}
                    />
                    {isLocating ? "Localizando..." : "Usar minha localização"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseCurrentLocation}
                    disabled
                    aria-label="Usar minha localização indisponível enquanto o atendimento sem local fixo estiver ativo"
                    title="Desmarque 'Não possuo local fixo de atendimento' para usar sua localização"
                    className="shrink-0 px-3 py-1.5 text-xs disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <LocateFixed
                      className="mr-1.5 h-3.5 w-3.5"
                      strokeWidth={2}
                    />
                    Usar minha localização
                  </Button>
                )}
              </div>
              {hasNoFixedLocation ? (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  {serviceCities.some((item) => item.state && item.city) ? (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                        Cidades selecionadas
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {serviceCities
                          .filter((item) => item.state && item.city)
                          .map((item) => (
                            <span
                              key={`${item.state}-${item.city}`}
                              className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-emerald-900 shadow-sm ring-1 ring-emerald-200"
                            >
                              {item.city} - {item.state}
                            </span>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-900">
                      Informe as cidades onde você atende.
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openServiceLocationModal}
                    className="mt-3 px-3 py-1.5 text-xs"
                  >
                    {serviceCities.some((item) => item.state && item.city)
                      ? "Alterar cidades de atendimento"
                      : "Selecionar cidades de atendimento"}
                  </Button>
                </div>
              ) : null}
              {locationError ? <ErrorBadge message={locationError} /> : null}
              {errors.localizacao && (
                <ErrorBadge message={errors.localizacao} />
              )}
            </div>

            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                {isAutonomo ? "CPF *" : "CNPJ *"}
              </span>
              <Input
                name="cnpj"
                value={values.cnpj}
                onChange={handleChange}
                placeholder={
                  isAutonomo ? "000.000.000-00" : "00.000.000/0000-00"
                }
              />
              {errors.cnpj && <ErrorBadge message={errors.cnpj} />}
            </label>

            <label className="flex items-start gap-2 text-sm text-slate-600 md:col-span-2">
              <input
                type="checkbox"
                checked={isAutonomo}
                onChange={(event) => handleAutonomoToggle(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
              />
              <span>Sou autônomo</span>
            </label>

            {!isAutonomo ? (
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
            ) : null}
          </>
        ) : null}

        {currentStep === 2 ? (
          isScheduleEditorOpen ? (
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeScheduleEditor}
                  className="px-2.5 py-1.5 text-[11px]"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" strokeWidth={2} />
                  Voltar
                </Button>
              </div>

              <div className="mb-2">
                <h3 className="text-sm font-semibold text-slate-800">
                  Horário de funcionamento
                </h3>
              </div>

              <div className="space-y-2">
                {weekDays.map((day) => {
                  const daySchedule = draftSchedule[day.key];
                  const dayErrorBadge = getDayErrorBadge(
                    day.key,
                    scheduleFieldErrors,
                  );

                  return (
                    <div
                      key={day.key}
                      className={`rounded-xl border px-3 py-2.5 transition-colors ${
                        daySchedule.ativo
                          ? "border-emerald-200 bg-white"
                          : "border-slate-200 bg-slate-100/70"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={daySchedule.ativo}
                            onChange={(event) =>
                              handleToggleDay(day.key, event.target.checked)
                            }
                            className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                          />
                          <span className="inline-flex min-w-10 items-center justify-center rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                            {day.shortLabel}
                          </span>
                          <span className="truncate text-[12px] sm:text-sm">
                            {day.label}
                          </span>
                        </label>

                        {daySchedule.ativo ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleAddRange(day.key)}
                            className="shrink-0 px-2 py-1 text-[10px]"
                          >
                            + faixa
                          </Button>
                        ) : null}
                      </div>

                      {daySchedule.ativo ? (
                        <div className="mt-2 space-y-2">
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
                                className="grid grid-cols-[1fr_10px_1fr_28px] items-center gap-1.5"
                              >
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
                                  className={`h-9 border bg-white px-2 text-[12px] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
                                    rangeErrors?.inicio
                                      ? "border-rose-300 ring-2 ring-rose-100"
                                      : "border-slate-200"
                                  }`}
                                />

                                <span className="text-center text-[10px] font-semibold text-slate-400">
                                  -
                                </span>

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
                                  className={`h-9 border bg-white px-2 text-[12px] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
                                    rangeErrors?.fim
                                      ? "border-rose-300 ring-2 ring-rose-100"
                                      : "border-slate-200"
                                  }`}
                                />

                                <button
                                  type="button"
                                  disabled={!daySchedule.ativo}
                                  onClick={() =>
                                    handleRemoveRange(day.key, index)
                                  }
                                  className={`h-8 rounded-lg border px-1.5 text-[10px] font-semibold transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 ${
                                    rangeErrors?.row
                                      ? "border-rose-300 bg-rose-50 text-rose-700"
                                      : "border-slate-200 text-slate-600"
                                  }`}
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}

                      {dayErrorBadge.hasError ? (
                        <p className="mt-2 rounded-full bg-rose-100 px-2 py-1 text-[10px] font-semibold text-rose-700">
                          {dayErrorBadge.message}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {errors.horario_funcionamento ? (
                <div className="mt-3">
                  <ErrorBadge message={errors.horario_funcionamento} />
                </div>
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
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-300"
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
                <span className="text-sm font-medium text-slate-700 ">
                  Instagram *
                </span>
                <Input
                  name="instagram"
                  value={values.instagram}
                  onChange={handleChange}
                  placeholder="@seu_instagram"
                  className="placeholder:text-slate-400"
                />
                {errors.instagram && <ErrorBadge message={errors.instagram} />}
              </label>

              {renderMultiValueField(
                "servicos_oferecidos",
                "Serviços oferecidos",
                "Digite um serviço e adicione",
              )}

              {renderMultiValueField(
                "tecnicas_utilizadas",
                "Técnicas utilizadas",
                "Digite uma técnica e adicione",
              )}

              {renderMultiValueField(
                "produtos_aplicados",
                "Produtos aplicados",
                "Digite um produto e adicione",
              )}

              {renderMultiValueField(
                "profissionais_envolvidos",
                "Profissionais envolvidos *",
                "Digite um nome e adicione",
              )}

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
                  name="termos_aceitos"
                  checked={values.termos_aceitos}
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
              {errors.termos_aceitos ? (
                <ErrorBadge message={errors.termos_aceitos} />
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      {isScheduleEditorOpen && currentStep === 2 ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-3 shadow-[0_-6px_20px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:px-6">
          <div className="pointer-events-auto mx-auto max-w-2xl">
            <Button
              type="button"
              onClick={handleSaveSchedule}
              className="w-full"
            >
              Salvar horários
            </Button>
          </div>
        </div>
      ) : (
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
      )}

      {isServiceLocationModalRendered ? (
        <div
          className={`auth-modal-overlay fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 px-3 py-4 backdrop-blur-sm sm:px-4 ${
            isServiceLocationModalClosing
              ? "auth-modal-overlay-exit"
              : "auth-modal-overlay-enter"
          }`}
          onMouseDown={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            if (event.target !== event.currentTarget) {
              event.stopPropagation();
              return;
            }

            event.stopPropagation();
            closeServiceLocationModal();
          }}
        >
          <div
            ref={serviceLocationModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-location-modal-title"
            tabIndex={-1}
            className={`auth-modal-panel flex max-h-[95vh] w-full max-w-2xl flex-col overflow-visible rounded-2xl bg-white shadow-2xl ${
              isServiceLocationModalClosing
                ? "auth-modal-panel-exit"
                : "auth-modal-panel-enter"
            }`}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3
                  id="service-location-modal-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Cidades de atendimento
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Selecione o estado principal e as cidades atendidas.
                </p>
              </div>
              <button
                type="button"
                onClick={closeServiceLocationModal}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Fechar seleção de cidades"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            <div className="auth-modal-content-enter scrollbar-none overflow-visible px-5 py-4">
              <label className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={atendeEmDiferentesEstados}
                  onChange={(event) =>
                    handleMultiStateToggle(event.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                />
                <span>Atendo em diferentes estados</span>
              </label>

              <div className="space-y-3">
                {serviceCities.map((serviceCity, index) => {
                  const cities = citiesByState[serviceCity.state] ?? [];

                  return (
                    <div
                      key={`service-city-${index}`}
                      className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                    >
                      <label className="space-y-1">
                        <span className="text-xs font-semibold text-slate-700">
                          Estado
                        </span>
                        <SearchableSelect
                          key={`state-${index}-${serviceCity.state}`}
                          value={serviceCity.state}
                          onChange={(state) =>
                            handleServiceCityChange(index, "state", state)
                          }
                          disabled={index > 0 && !atendeEmDiferentesEstados}
                          placeholder="Digite a UF"
                          options={ufs.map((state) => ({
                            value: state.sigla,
                            label: `${state.nome} (${state.sigla})`,
                          }))}
                        />
                      </label>

                      <label className="space-y-1">
                        <span className="text-xs font-semibold text-slate-700">
                          Cidade
                        </span>
                        <SearchableSelect
                          key={`city-${index}-${serviceCity.state}-${serviceCity.city}`}
                          value={serviceCity.city}
                          onChange={(city) =>
                            handleServiceCityChange(index, "city", city)
                          }
                          disabled={!serviceCity.state || !cities.length}
                          placeholder={
                            loadingCitiesByState[serviceCity.state]
                              ? "Carregando cidades..."
                              : serviceCity.state
                                ? "Digite a cidade"
                                : "Escolha o estado primeiro"
                          }
                          loading={loadingCitiesByState[serviceCity.state]}
                          options={cities.map((city) => ({
                            value: city.nome,
                            label: city.nome,
                          }))}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveServiceCity(index)}
                        className="rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-white"
                      >
                        Remover
                      </button>
                    </div>
                  );
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddServiceCity}
                className="mt-4 px-3 py-1.5 text-xs"
              >
                + Incluir outra cidade
              </Button>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={closeServiceLocationModal}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={handleSaveServiceCities}>
                Salvar cidades
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
};

export default Form;
