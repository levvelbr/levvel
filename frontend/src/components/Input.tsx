import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ className = "", type, ...rest }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const isPasswordField = type === "password";

    const inputElement = (
      <input
        ref={ref}
        type={
          isPasswordField ? (isPasswordVisible ? "text" : "password") : type
        }
        className={`w-full rounded-xl border-none px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
          isPasswordField ? "pr-10" : ""
        } ${className}`}
        {...rest}
      />
    );

    if (!isPasswordField) {
      return inputElement;
    }

    return (
      <div className="relative w-full">
        {inputElement}
        <button
          type="button"
          onClick={() => setIsPasswordVisible((prev) => !prev)}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600"
          aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
        >
          {isPasswordVisible ? (
            <EyeOff className="h-4 w-4" strokeWidth={1.8} />
          ) : (
            <Eye className="h-4 w-4" strokeWidth={1.8} />
          )}
        </button>
      </div>
    );
  },
);

export default Input;
