import { getCategoryColor, getCategoryIcon } from "../utils/categoryIcons";

interface CategoryIconProps {
  category: string;
}

export const CategoryIcon = ({ category }: CategoryIconProps) => {
  const label = category || "Geral";
  const Icon = getCategoryIcon(label);
  const color = getCategoryColor(label);

  return (
    <div
      className={`inline-flex max-w-full items-center gap-2 rounded-xl bg-linear-to-r ${color} p-2 text-xs font-semibold text-white shadow-sm`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      <span>{label}</span>
    </div>
  );
};

export default CategoryIcon;
