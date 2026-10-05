import { type HTMLAttributes } from "react";

type BadgeTone = "neutral" | "accent" | "warm" | "soon";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-[color-mix(in_srgb,var(--ink)_6%,white)] text-muted",
  accent: "bg-[var(--accent-soft)] text-accent",
  warm: "bg-[var(--accent-2-soft)] text-accent-2",
  soon: "bg-[color-mix(in_srgb,var(--line)_70%,white)] text-muted",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({
  tone = "neutral",
  className = "",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[11px] px-2.5 py-1 text-xs font-semibold tracking-wide ${toneClasses[tone]} ${className}`}
      {...props}
    />
  );
}
