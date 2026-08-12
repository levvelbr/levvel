import {
  Scissors,
  Flower2,
  Stethoscope,
  HandHeart,
  PawPrint,
  Shirt,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Beleza: Scissors,
  "Bem-estar": Flower2,
  Saúde: Stethoscope,
  Massagens: HandHeart,
  Pets: PawPrint,
  Moda: Shirt,
};

export const getCategoryIcon = (category: string): LucideIcon => {
  return CATEGORY_ICONS[category] ?? Sparkles;
};
