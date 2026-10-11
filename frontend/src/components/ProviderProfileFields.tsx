import { useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Input from "./Input";
import {
  cloneSchedule,
  createEmptyRange,
  formatTimeInput,
  getDayErrorBadge,
  getRangeErrorKey,
  getRangeInputRefKey,
  getScheduleSummary,
  normalizeTimeOnBlur,
  validateSchedule,
  weekDays,
  type RangeFieldError,
  type TimeRange,
  type WeekDayKey,
  type WeeklySchedule,
} from "../utils/schedule";

interface MultiValueInputProps {
  id: string;
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
}

export const btnPrimary =
  "inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60";
export const btnOutline =
  "inline-flex items-center justify-center rounded-lg border border-blue-700 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60";

export const MultiValueInput = ({
  id,
  label,
  placeholder,
  values,
  onChange,
}: MultiValueInputProps) => {
  const [draft, setDraft] = useState("");

  const addItem = () => {
    const value = draft.trim().replace(/\s+/g, " ");

    if (!value) {
      return;
    }

    if (!values.some((item) => item.toLowerCase() === value.toLowerCase())) {
      onChange([...values, value]);
    }

    setDraft("");
  };

  return (
    <div className="space-y-2 md:col-span-2">
      <span id={`${id}-label`} className="text-sm font-medium text-slate-700">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 focus-within:ring-2 focus-within:ring-blue-300">
        {values.map((item) => (
          <button
            key={`${id}-${item}`}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onChange(values.filter((value) => value !== item))}
            className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-900 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
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
            aria-labelledby={`${id}-label`}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addItem();
              }
            }}
            placeholder={placeholder}
            className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={addItem}
            className={`shrink-0 ${btnOutline}`}
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
};

interface ScheduleEditorProps {
  schedule: WeeklySchedule;
  onChange: (schedule: WeeklySchedule) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

export const ScheduleEditor = ({
  schedule,
  onChange,
  onOpenChange,
}: ScheduleEditorProps) => {
  const [isOpen, setIsOpenState] = useState(false);
  const setIsOpen = (value: boolean) => {
    setIsOpenState(value);
    onOpenChange?.(value);
  };
  const [draft, setDraft] = useState<WeeklySchedule>(schedule);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, RangeFieldError>
  >({});
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const summary = getScheduleSummary(schedule);

  const updateDraft = (updater: (prev: WeeklySchedule) => WeeklySchedule) => {
    setDraft(updater);
    setFieldErrors({});
    setError(null);
  };

  const updateRanges = (
    dayKey: WeekDayKey,
    updater: (ranges: TimeRange[]) => TimeRange[],
  ) =>
    updateDraft((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], faixas: updater(prev[dayKey].faixas) },
    }));

  const open = () => {
    setDraft(cloneSchedule(schedule));
    setFieldErrors({});
    setError(null);
    setIsOpen(true);
  };

  const close = () => {
    setFieldErrors({});
    setError(null);
    setIsOpen(false);
  };

  const save = () => {
    const validation = validateSchedule(draft);

    if (validation.message) {
      setFieldErrors(validation.fieldErrors);
      setError(validation.message);

      const firstKey = Object.keys(validation.fieldErrors)[0];
      const firstField = firstKey
        ? (["inicio", "fim"] as const).find(
            (field) => validation.fieldErrors[firstKey][field],
          )
        : undefined;
      const ref = firstKey
        ? inputRefs.current[`${firstKey}-${firstField ?? "inicio"}`]
        : null;
      ref?.focus();
      return;
    }

    onChange(cloneSchedule(draft));
    close();
  };

  if (!isOpen) {
    return (
      <div className="space-y-2 md:col-span-2">
        <span className="text-sm font-medium text-slate-700">
          Horário de funcionamento
        </span>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {summary.length ? (
            <div className="flex flex-wrap gap-2">
              {summary.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Nenhum horário configurado ainda.
            </p>
          )}
          <button type="button" onClick={open} className={`mt-4 ${btnOutline}`}>
            {summary.length ? "Alterar horários" : "Definir horários"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={close}
          className={`${btnOutline} !px-2.5 !py-1.5 !text-[11px]`}
        >
          <ArrowLeft className="mr-1 h-3 w-3" strokeWidth={2} />
          Voltar
        </button>
      </div>

      <h3 className="mb-2 text-sm font-semibold text-slate-800">
        Horário de funcionamento
      </h3>

      <div className="space-y-2">
        {weekDays.map((day) => {
          const daySchedule = draft[day.key];
          const dayErrorBadge = getDayErrorBadge(day.key, fieldErrors);

          return (
            <div
              key={day.key}
              className={`rounded-xl border px-3 py-2.5 transition-colors ${
                daySchedule.ativo
                  ? "border-blue-200 bg-white"
                  : "border-slate-200 bg-slate-100/70"
              }`}
            >
              <div className="flex items-center gap-2">
                <label className="flex min-w-0 flex-1 items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={daySchedule.ativo}
                    onChange={(event) =>
                      updateDraft((prev) => ({
                        ...prev,
                        [day.key]: {
                          ...prev[day.key],
                          ativo: event.target.checked,
                        },
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-500"
                  />
                  <span className="inline-flex min-w-10 items-center justify-center rounded-md bg-blue-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-blue-800">
                    {day.shortLabel}
                  </span>
                  <span className="truncate text-[12px] sm:text-sm">
                    {day.label}
                  </span>
                </label>

                {daySchedule.ativo ? (
                  <button
                    type="button"
                    onClick={() =>
                      updateRanges(day.key, (ranges) => [
                        ...ranges,
                        createEmptyRange(),
                      ])
                    }
                    className={`shrink-0 ${btnOutline} !px-2 !py-1 !text-[10px]`}
                  >
                    + faixa
                  </button>
                ) : null}
              </div>

              {daySchedule.ativo ? (
                <div className="mt-2 space-y-2">
                  {daySchedule.faixas.map((range, index) => {
                    const rangeErrors =
                      fieldErrors[getRangeErrorKey(day.key, index)];

                    return (
                      <div
                        key={`${day.key}-${index}`}
                        className="grid grid-cols-[1fr_10px_1fr_28px] items-center gap-1.5"
                      >
                        {(["inicio", "fim"] as const).map((field, position) => (
                          <div key={field} className="contents">
                            {position === 1 ? (
                              <span className="text-center text-[10px] font-semibold text-slate-400">
                                -
                              </span>
                            ) : null}
                            <Input
                              type="text"
                              inputMode="numeric"
                              maxLength={5}
                              placeholder="HH:mm"
                              value={range[field]}
                              onChange={(event) =>
                                updateRanges(day.key, (ranges) =>
                                  ranges.map((item, i) =>
                                    i === index
                                      ? {
                                          ...item,
                                          [field]: formatTimeInput(
                                            event.target.value,
                                          ),
                                        }
                                      : item,
                                  ),
                                )
                              }
                              onBlur={() =>
                                setDraft((prev) => ({
                                  ...prev,
                                  [day.key]: {
                                    ...prev[day.key],
                                    faixas: prev[day.key].faixas.map(
                                      (item, i) =>
                                        i === index
                                          ? {
                                              ...item,
                                              [field]: normalizeTimeOnBlur(
                                                item[field],
                                              ),
                                            }
                                          : item,
                                    ),
                                  },
                                }))
                              }
                              ref={(element) => {
                                inputRefs.current[
                                  getRangeInputRefKey(day.key, index, field)
                                ] = element;
                              }}
                              className={`h-9 border bg-white px-2 text-[12px] focus:ring-blue-300! ${
                                rangeErrors?.[field]
                                  ? "border-rose-300 ring-2 ring-rose-100"
                                  : "border-slate-200"
                              }`}
                            />
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() =>
                            updateRanges(day.key, (ranges) => {
                              const next = ranges.filter((_, i) => i !== index);
                              return next.length ? next : [createEmptyRange()];
                            })
                          }
                          className={`h-8 rounded-lg border px-1.5 text-[10px] font-semibold transition-colors hover:bg-slate-100 ${
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

      {error ? (
        <p className="mt-3 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={save}
        className={`mt-4 w-full ${btnPrimary}`}
      >
        Salvar horários
      </button>
    </div>
  );
};
