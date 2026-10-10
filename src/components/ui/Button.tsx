"use client";

import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "icon" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "secondary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles: clear focus ring with offset, transition, min 40px tap target for mobile accessibility
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-control)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none min-h-[40px] sm:min-h-[36px] rounded-md";

    // Size styles
    const sizeStyles = {
      sm: "px-2.5 py-1 text-xs gap-1.5",
      md: "px-3.5 py-1.5 text-xs sm:text-sm gap-2",
      lg: "px-4.5 py-2 text-sm sm:text-base gap-2.5",
    }[size];

    // Variant styles calibrated to Quiet Grove tokens
    const variantStyles = {
      primary:
        "bg-[var(--accent-primary)] text-[var(--accent-primary-text)] hover:bg-[var(--accent-primary-hover)] active:opacity-95 shadow-sm font-semibold",
      secondary:
        "border border-[var(--border-control)] bg-[var(--bg-panel)] text-[var(--text-main)] hover:bg-[var(--bg-surface)] active:bg-[var(--border-color)] shadow-xs",
      tertiary:
        "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] active:bg-[var(--border-color)]",
      icon:
        "border border-[var(--border-control)] bg-[var(--bg-panel)] text-[var(--text-main)] hover:bg-[var(--bg-surface)] p-2 min-w-[40px] sm:min-w-[36px] aspect-square",
      destructive:
        "bg-[var(--accent-danger)] text-white hover:opacity-90 active:opacity-95 font-semibold",
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles} ${variant !== "icon" ? sizeStyles : ""} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
