import { forwardRef, type InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className = "", ...rest }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full rounded-xl border-none px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 ${className}`}
        {...rest}
      />
    );
  },
);

export default Input;
