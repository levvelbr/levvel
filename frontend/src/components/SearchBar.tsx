import { useEffect, useRef, useState, type HTMLAttributes } from "react";
import Input from "./Input";

interface Props extends HTMLAttributes<HTMLDivElement> {
  onSearch?: (q: string) => void;
  value?: string;
  compact?: boolean;
  autoFocusInput?: boolean;
}

export const SearchBar = ({
  onSearch,
  value,
  compact = false,
  autoFocusInput = false,
  ...rest
}: Props) => {
  const [search, setSearch] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastEmittedQueryRef = useRef((value ?? "").trim());

  useEffect(() => {
    if (typeof value === "string") {
      setSearch(value);
    }
  }, [value]);

  useEffect(() => {
    if (!onSearch) {
      return;
    }

    const timer = window.setTimeout(() => {
      const nextQuery = search.trim();

      if (nextQuery === lastEmittedQueryRef.current) {
        return;
      }

      lastEmittedQueryRef.current = nextQuery;
      onSearch(nextQuery);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search, onSearch]);

  useEffect(() => {
    if (autoFocusInput) {
      inputRef.current?.focus();
    }
  }, [autoFocusInput]);

  const handleChange = (value: string) => {
    setSearch(value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = search.trim();
    lastEmittedQueryRef.current = nextQuery;
    onSearch?.(nextQuery);
  };

  return (
    <div {...rest}>
      <form onSubmit={handleSubmit} className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className={compact ? "h-4 w-4" : "h-5 w-5"}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </span>
        <Input
          ref={inputRef}
          className={`rounded-2xl bg-white/95 pl-11 pr-4 shadow-lg shadow-emerald-950/5 ring-1 ring-slate-200 transition focus:border-emerald-200 focus:ring-2 focus:ring-emerald-200 ${
            compact ? "py-2.5 text-sm" : "py-4 text-base"
          }`}
          placeholder="Buscar serviços, categorias, prestadores..."
          value={search}
          onChange={(e) => handleChange(e.target.value)}
          aria-label="Buscar"
        />
      </form>
    </div>
  );
};

export default SearchBar;
