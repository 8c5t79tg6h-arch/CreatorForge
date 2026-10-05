import { type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:brightness-110 shadow-[var(--shadow)] disabled:opacity-55",
  secondary:
    "bg-bg-elevated text-ink border border-line hover:border-accent/40 hover:bg-white disabled:opacity-55",
  ghost:
    "bg-transparent text-ink hover:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] disabled:opacity-55",
  danger:
    "bg-[color-mix(in_srgb,var(--accent-2)_12%,white)] text-accent-2 border border-[color-mix(in_srgb,var(--accent-2)_28%,var(--line))] hover:bg-[color-mix(in_srgb,var(--accent-2)_18%,white)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-[11px]",
  md: "px-4 py-2.5 text-sm rounded-[12px]",
  lg: "px-5 py-3 text-base rounded-[14px]",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}
