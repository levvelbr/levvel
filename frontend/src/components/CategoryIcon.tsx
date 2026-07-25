interface CategoryIconProps {
  category: string;
}

export const CategoryIcon = ({ category }: CategoryIconProps) => {
  const label = category || "Geral";

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 p-2 text-xs font-semibold text-emerald-800">
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-700" />
      <span>{label}</span>
    </div>
  );
};

export default CategoryIcon;
