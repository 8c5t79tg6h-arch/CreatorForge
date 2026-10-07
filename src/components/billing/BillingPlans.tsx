"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useBilling } from "@/hooks/useBilling";
import { PLANS, type PlanId } from "@/lib/billing";

export function BillingPlans() {
  const { summary, upgradeToPro, downgrade } = useBilling();

  function onSelect(planId: PlanId) {
    if (planId === summary.plan.id) return;
    if (planId === "pro_creator") {
      if (
        !window.confirm(
          "Activate Pro Creator ($19/mo) on this device? Stripe checkout can replace this local activation later.",
        )
      ) {
        return;
      }
      upgradeToPro();
      return;
    }
    if (
      !window.confirm(
        "Switch back to Free? Pro quotas stop applying on this device.",
      )
    ) {
      return;
    }
    downgrade();
  }

  return (
    <section id="billing" className="space-y-4">
      <div>
        <h2 className="font-display text-2xl text-ink">Plan & billing</h2>
        <p className="mt-1 text-sm text-muted">
          Current plan: <strong>{summary.plan.name}</strong> · Period{" "}
          {summary.periodKey} · {summary.generationsUsed}/
          {summary.generationsLimit} generations · {summary.refinesUsed}/
          {summary.refinesLimit} refines
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {(Object.keys(PLANS) as PlanId[]).map((planId) => {
          const plan = PLANS[planId];
          const active = summary.plan.id === planId;
          return (
            <article
              key={plan.id}
              className={`flex flex-col gap-4 rounded-[14px] border p-5 ${
                plan.id === "pro_creator"
                  ? "border-accent/40 bg-[var(--accent-soft)]"
                  : "border-line bg-bg-elevated"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-2xl text-ink">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted">{plan.tagline}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl text-ink">
                    {plan.priceLabel}
                  </p>
                  {active ? <Badge tone="accent">Current</Badge> : null}
                </div>
              </div>
              <ul className="space-y-2 text-sm text-muted">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
              <Button
                variant={plan.id === "pro_creator" ? "primary" : "secondary"}
                disabled={active}
                onClick={() => onSelect(planId)}
              >
                {active
                  ? "Current plan"
                  : plan.id === "pro_creator"
                    ? "Upgrade to Pro Creator"
                    : "Switch to Free"}
              </Button>
            </article>
          );
        })}
      </div>
      <p className="text-xs text-muted">
        Billing is tracked in this browser for now. Connect Stripe later for
        real subscriptions across devices.
      </p>
    </section>
  );
}
