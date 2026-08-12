import { getCategoryIcon } from "../utils/categoryIcons";

interface CategoryIconProps {
  category: string;
}

export const CategoryIcon = ({ category }: CategoryIconProps) => {
  const label = category || "Geral";
  const Icon = getCategoryIcon(label);

  return (
    <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 p-2 text-xs font-semibold text-emerald-800">
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      <span>{label}</span>
    </div>
  );
};

export default CategoryIcon;
