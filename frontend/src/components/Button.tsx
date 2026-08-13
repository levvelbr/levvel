import { type ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline";
}

export const Button = ({
  variant = "primary",
  className = "",
  children,
  ...rest
}: Props) => {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 font-medium shadow-sm";
  const variants: Record<string, string> = {
    primary: "bg-emerald-700 text-white hover:bg-emerald-800",
    outline:
      "border border-emerald-700 text-emerald-700 bg-white hover:bg-emerald-50",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
