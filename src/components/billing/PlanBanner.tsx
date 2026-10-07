"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useBilling } from "@/hooks/useBilling";
import { PLANS } from "@/lib/billing";

type Props = {
  compact?: boolean;
};

export function PlanBanner({ compact = false }: Props) {
  const { summary, upgradeToPro } = useBilling();

  if (summary.isPro) {
    return (
      <div className="rounded-[14px] border border-line bg-bg-elevated p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl text-ink">Pro Creator</h2>
              <Badge tone="accent">Active</Badge>
            </div>
            {!compact ? (
              <p className="mt-1 text-sm text-muted">
                {summary.generationsRemaining} generations and{" "}
                {summary.refinesRemaining} refines left this month.
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted">
                {summary.generationsRemaining} gens · {summary.refinesRemaining}{" "}
                refines left
              </p>
            )}
          </div>
          <Link href="/dashboard/settings#billing">
            <Button size="sm" variant="secondary">
              Manage plan
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const nearLimit =
    summary.generationsRemaining <= 3 || summary.refinesRemaining <= 1;

  return (
    <div
      className={`rounded-[14px] border p-4 ${
        nearLimit
          ? "border-accent/40 bg-[var(--accent-soft)]"
          : "border-line bg-bg-elevated"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl text-ink">
              {PLANS.pro_creator.name}
            </h2>
            <Badge tone="warm">{PLANS.pro_creator.priceLabel}</Badge>
          </div>
          <p className="max-w-xl text-sm text-muted">
            {nearLimit
              ? "You’re close to this month’s Free limits. Upgrade for 300 generations and 150 refines."
              : PLANS.pro_creator.tagline}
          </p>
          {!compact ? (
            <p className="text-xs text-muted">
              Free usage: {summary.generationsUsed}/
              {summary.generationsLimit} generations · {summary.refinesUsed}/
              {summary.refinesLimit} refines
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              if (
                window.confirm(
                  "Activate Pro Creator on this device? ($19/mo plan — local activation until Stripe checkout is connected.)",
                )
              ) {
                upgradeToPro();
              }
            }}
          >
            Upgrade to Pro
          </Button>
          <Link href="/dashboard/settings#billing">
            <Button size="sm" variant="secondary">
              Compare plans
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
