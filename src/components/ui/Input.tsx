// src/components/ui/Input.tsx
import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/lib/format";

type UiSize = "sm" | "md" | "lg";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  uiSize?: UiSize; // <-- вместо size
}

const sizeClasses: Record<UiSize, string> = {
  sm: "h-9 text-xs",
  md: "h-11 text-sm",
  lg: "h-12 text-base",
};

export const Input = forwardRef<HTMLInputElement, Props>(
  (
    {
      className,
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      uiSize = "md",
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label ? (
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {label}
          </label>
        ) : null}

        <div className="relative">
          {leftIcon ? (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          ) : null}

          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full rounded-xl border bg-white px-3 transition-all duration-200",
              "outline-none focus:ring-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              sizeClasses[uiSize],
              error
                ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                : "border-gray-200 focus:border-gray-300 focus:ring-slate-200",
              leftIcon ? "pl-10" : undefined,
              rightIcon ? "pr-10" : undefined,
              className
            )}
            {...props}
          />

          {rightIcon ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          ) : null}
        </div>

        {error ? (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        ) : hint ? (
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";