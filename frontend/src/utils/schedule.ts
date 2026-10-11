export type WeekDayKey =
  "segunda" | "terca" | "quarta" | "quinta" | "sexta" | "sabado" | "domingo";

export interface TimeRange {
  inicio: string;
  fim: string;
}

export interface DaySchedule {
  ativo: boolean;
  faixas: TimeRange[];
}

export interface RangeFieldError {
  inicio?: string;
  fim?: string;
  row?: string;
}

export interface ScheduleValidationResult {
  message: string | null;
  fieldErrors: Record<string, RangeFieldError>;
}

export interface DayErrorBadge {
  hasError: boolean;
  message: string | null;
}

export type WeeklySchedule = Record<WeekDayKey, DaySchedule>;

export const weekDays: Array<{
  key: WeekDayKey;
  label: string;
  shortLabel: string;
}> = [
  { key: "segunda", label: "Segunda-feira", shortLabel: "Seg" },
  { key: "terca", label: "Terça-feira", shortLabel: "Ter" },
  { key: "quarta", label: "Quarta-feira", shortLabel: "Qua" },
  { key: "quinta", label: "Quinta-feira", shortLabel: "Qui" },
  { key: "sexta", label: "Sexta-feira", shortLabel: "Sex" },
  { key: "sabado", label: "Sábado", shortLabel: "Sáb" },
  { key: "domingo", label: "Domingo", shortLabel: "Dom" },
];

export const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createEmptyRange = (): TimeRange => ({ inicio: "", fim: "" });

export const createInitialSchedule = (): WeeklySchedule =>
  weekDays.reduce((acc, day) => {
    acc[day.key] = {
      ativo: false,
      faixas: [createEmptyRange()],
    };

    return acc;
  }, {} as WeeklySchedule);

export const cloneSchedule = (schedule: WeeklySchedule): WeeklySchedule =>
  weekDays.reduce((acc, day) => {
    const daySchedule = schedule[day.key];

    acc[day.key] = {
      ativo: daySchedule.ativo,
      faixas: daySchedule.faixas.map((range) => ({ ...range })),
    };

    return acc;
  }, {} as WeeklySchedule);

export const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

export const getRangeErrorKey = (dayKey: WeekDayKey, index: number) =>
  `${dayKey}-${index}`;

export const getRangeInputRefKey = (
  dayKey: WeekDayKey,
  index: number,
  field: keyof TimeRange,
) => `${dayKey}-${index}-${field}`;

export const setFieldError = (
  errors: Record<string, RangeFieldError>,
  key: string,
  nextError: RangeFieldError,
) => {
  errors[key] = {
    ...errors[key],
    ...nextError,
  };
};

export const getDayErrorBadge = (
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

export const formatTimeInput = (rawValue: string) => {
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

export const normalizeTimeOnBlur = (rawValue: string) => {
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

export const validateSchedule = (
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

export const buildSchedulePayload = (schedule: WeeklySchedule) =>
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

export const parseSchedulePayload = (payload: unknown): WeeklySchedule => {
  const schedule = createInitialSchedule();

  if (!payload || typeof payload !== "object") {
    return schedule;
  }

  for (const day of weekDays) {
    const raw = (payload as Record<string, unknown>)[day.key];

    if (typeof raw !== "string" || !raw.trim()) {
      continue;
    }

    const faixas = raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [inicio = "", fim = ""] = part.split("-").map((v) => v.trim());
        return { inicio, fim };
      });

    if (faixas.length) {
      schedule[day.key] = { ativo: true, faixas };
    }
  }

  return schedule;
};

export const getScheduleSummary = (schedule: WeeklySchedule) =>
  weekDays
    .filter((day) => schedule[day.key].ativo)
    .map(
      (day) =>
        `${day.shortLabel}: ${schedule[day.key].faixas
          .map((range) => `${range.inicio}-${range.fim}`)
          .join(" | ")}`,
    );
