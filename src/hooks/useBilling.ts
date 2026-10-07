"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  activateProCreator,
  assertCanCreateProject,
  downgradeToFree,
  getBillingSnapshot,
  getUsageSummary,
  refreshBilling,
  subscribeBilling,
  type BillingSnapshot,
} from "@/lib/billing";

const SERVER_SNAPSHOT: BillingSnapshot = {
  version: 1,
  planId: "free",
  periodKey: "1970-01",
  usage: { generations: 0, refines: 0 },
  upgradedAt: null,
};

function getServerSnapshot(): BillingSnapshot {
  return SERVER_SNAPSHOT;
}

export function useBilling() {
  const snapshot = useSyncExternalStore(
    subscribeBilling,
    getBillingSnapshot,
    getServerSnapshot,
  );

  const summary = useMemo(() => getUsageSummary(snapshot), [snapshot]);

  const upgradeToPro = useCallback(() => {
    activateProCreator();
  }, []);

  const downgrade = useCallback(() => {
    downgradeToFree();
  }, []);

  const guardCreateProject = useCallback((projectCount: number) => {
    assertCanCreateProject(projectCount);
  }, []);

  return {
    snapshot,
    summary,
    upgradeToPro,
    downgrade,
    guardCreateProject,
    refresh: refreshBilling,
  };
}
