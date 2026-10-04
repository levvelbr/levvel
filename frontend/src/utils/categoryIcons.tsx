import {
  Brain,
  HeartPulse,
  Sparkles,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_OPTIONS = [
  "Bem-estar Físico",
  "Bem-estar Mental e Emocional",
  "Bem-estar Financeiro",
  "Bem-estar Social e Ambiental",
  "Bem-estar Estético",
] as const;

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Bem-estar Físico": HeartPulse,
  "Bem-estar Mental e Emocional": Brain,
  "Bem-estar Financeiro": Wallet,
  "Bem-estar Social e Ambiental": UsersRound,
  "Bem-estar Estético": Sparkles,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Bem-estar Físico": "from-rose-500 to-red-500",
  "Bem-estar Mental e Emocional": "from-violet-500 to-purple-600",
  "Bem-estar Financeiro": "from-emerald-500 to-green-600",
  "Bem-estar Social e Ambiental": "from-sky-500 to-teal-500",
  "Bem-estar Estético": "from-fuchsia-500 to-pink-500",
};

export const getCategoryIcon = (category: string): LucideIcon => {
  return CATEGORY_ICONS[category] ?? Sparkles;
};

export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] ?? "from-slate-500 to-slate-600";
};
