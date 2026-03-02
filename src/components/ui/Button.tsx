// src/components/ui/Button.tsx
import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/format";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

const variantClasses: Record<Variant, string> = {
  primary: "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]",
  secondary:
    "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50 active:scale-[0.98]",
  ghost: "text-gray-700 hover:bg-gray-100 active:scale-[0.98]",
  danger: "bg-red-600 text-white hover:bg-red-500 active:scale-[0.98]",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          // base
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 ease-out",
          "focus:outline-none focus:ring-2 focus:ring-slate-400/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin opacity-80" /> : null}
        {!loading ? leftIcon : null}

        <span className={cn(loading ? "opacity-70" : undefined)}>{children}</span>

        {!loading ? rightIcon : null}
      </button>
    );
  }
);

Button.displayName = "Button";