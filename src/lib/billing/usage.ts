import { storage } from "@/lib/persistence/storage";
import { getPlan, type PlanId } from "./plans";

export const BILLING_KEY = "creatorforge:billing:v1";

export type UsageMeter = {
  generations: number;
  refines: number;
};

export type BillingSnapshot = {
  version: 1;
  planId: PlanId;
  /** ISO month key, e.g. 2026-10 */
  periodKey: string;
  usage: UsageMeter;
  upgradedAt: string | null;
};

type Listener = () => void;

const listeners = new Set<Listener>();
let cachedSnapshot: BillingSnapshot | null = null;

function currentPeriodKey(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function emptyBilling(): BillingSnapshot {
  return {
    version: 1,
    planId: "free",
    periodKey: currentPeriodKey(),
    usage: { generations: 0, refines: 0 },
    upgradedAt: null,
  };
}

export function migrateBilling(raw: unknown): BillingSnapshot {
  if (!raw || typeof raw !== "object") return emptyBilling();
  const data = raw as Partial<BillingSnapshot>;
  const planId = data.planId === "pro_creator" ? "pro_creator" : "free";
  const periodKey =
    typeof data.periodKey === "string" && data.periodKey
      ? data.periodKey
      : currentPeriodKey();
  const usage = {
    generations:
      typeof data.usage?.generations === "number" && data.usage.generations >= 0
        ? data.usage.generations
        : 0,
    refines:
      typeof data.usage?.refines === "number" && data.usage.refines >= 0
        ? data.usage.refines
        : 0,
  };
  return {
    version: 1,
    planId,
    periodKey,
    usage,
    upgradedAt: typeof data.upgradedAt === "string" ? data.upgradedAt : null,
  };
}

function sameSnapshot(a: BillingSnapshot, b: BillingSnapshot): boolean {
  return (
    a.planId === b.planId &&
    a.periodKey === b.periodKey &&
    a.upgradedAt === b.upgradedAt &&
    a.usage.generations === b.usage.generations &&
    a.usage.refines === b.usage.refines
  );
}

function readRaw(): BillingSnapshot {
  const raw = storage.getItem(BILLING_KEY);
  if (!raw) return emptyBilling();
  try {
    return migrateBilling(JSON.parse(raw));
  } catch {
    return emptyBilling();
  }
}

function writeRaw(snapshot: BillingSnapshot): void {
  storage.setItem(BILLING_KEY, JSON.stringify(snapshot));
  cachedSnapshot = snapshot;
  listeners.forEach((listener) => listener());
}

function withPeriodReset(snapshot: BillingSnapshot): BillingSnapshot {
  const periodKey = currentPeriodKey();
  if (snapshot.periodKey === periodKey) return snapshot;
  return {
    ...snapshot,
    periodKey,
    usage: { generations: 0, refines: 0 },
  };
}

export function getBillingSnapshot(): BillingSnapshot {
  // Stable reference required for useSyncExternalStore.
  const next = withPeriodReset(readRaw());
  if (cachedSnapshot && sameSnapshot(cachedSnapshot, next)) {
    return cachedSnapshot;
  }
  cachedSnapshot = next;
  return cachedSnapshot;
}

function persist(snapshot: BillingSnapshot): void {
  writeRaw(withPeriodReset(snapshot));
}

export function subscribeBilling(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function refreshBilling(): BillingSnapshot {
  cachedSnapshot = null;
  const snapshot = getBillingSnapshot();
  listeners.forEach((listener) => listener());
  return snapshot;
}

export type QuotaAction = "generate" | "refine";

export class BillingLimitError extends Error {
  code = "quota_exceeded" as const;
  action: QuotaAction;
  planId: PlanId;

  constructor(action: QuotaAction, planId: PlanId, message: string) {
    super(message);
    this.name = "BillingLimitError";
    this.action = action;
    this.planId = planId;
  }
}

export function getUsageSummary(snapshot = getBillingSnapshot()) {
  const plan = getPlan(snapshot.planId);
  return {
    plan,
    periodKey: snapshot.periodKey,
    generationsUsed: snapshot.usage.generations,
    generationsLimit: plan.generationsPerMonth,
    generationsRemaining: Math.max(
      0,
      plan.generationsPerMonth - snapshot.usage.generations,
    ),
    refinesUsed: snapshot.usage.refines,
    refinesLimit: plan.refinesPerMonth,
    refinesRemaining: Math.max(0, plan.refinesPerMonth - snapshot.usage.refines),
    maxProjects: plan.maxProjects,
    isPro: snapshot.planId === "pro_creator",
    upgradedAt: snapshot.upgradedAt,
  };
}

export function assertCanConsume(action: QuotaAction): void {
  const snapshot = getBillingSnapshot();
  const plan = getPlan(snapshot.planId);
  const pro = getPlan("pro_creator");
  if (action === "generate") {
    if (snapshot.usage.generations >= plan.generationsPerMonth) {
      throw new BillingLimitError(
        "generate",
        snapshot.planId,
        `${plan.name} includes ${plan.generationsPerMonth} generations / month. Upgrade to Pro Creator for ${pro.generationsPerMonth}/month.`,
      );
    }
    return;
  }
  if (snapshot.usage.refines >= plan.refinesPerMonth) {
    throw new BillingLimitError(
      "refine",
      snapshot.planId,
      `${plan.name} includes ${plan.refinesPerMonth} refines / month. Upgrade to Pro Creator for ${pro.refinesPerMonth}/month.`,
    );
  }
}

export function consumeUsage(action: QuotaAction): BillingSnapshot {
  assertCanConsume(action);
  const snapshot = getBillingSnapshot();
  const next: BillingSnapshot = {
    ...snapshot,
    usage: {
      generations:
        snapshot.usage.generations + (action === "generate" ? 1 : 0),
      refines: snapshot.usage.refines + (action === "refine" ? 1 : 0),
    },
  };
  persist(next);
  return next;
}

export function setPlan(planId: PlanId): BillingSnapshot {
  const snapshot = getBillingSnapshot();
  const next: BillingSnapshot = {
    ...snapshot,
    planId,
    upgradedAt:
      planId === "pro_creator"
        ? snapshot.upgradedAt ?? new Date().toISOString()
        : null,
  };
  persist(next);
  return next;
}

export function activateProCreator(): BillingSnapshot {
  return setPlan("pro_creator");
}

export function downgradeToFree(): BillingSnapshot {
  return setPlan("free");
}

export function assertCanCreateProject(projectCount: number): void {
  const snapshot = getBillingSnapshot();
  const plan = getPlan(snapshot.planId);
  if (projectCount >= plan.maxProjects) {
    throw new BillingLimitError(
      "generate",
      snapshot.planId,
      `${plan.name} includes up to ${plan.maxProjects} projects. Upgrade to Pro Creator for ${getPlan("pro_creator").maxProjects}.`,
    );
  }
}

export function resetBillingForTests(): void {
  storage.removeItem(BILLING_KEY);
  cachedSnapshot = null;
  listeners.forEach((listener) => listener());
}
