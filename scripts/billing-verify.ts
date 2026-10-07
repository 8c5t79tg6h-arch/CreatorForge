import assert from "node:assert/strict";
import { resetMemoryStorageForTests } from "../src/lib/persistence/storage";
import {
  activateProCreator,
  assertCanConsume,
  BillingLimitError,
  consumeUsage,
  downgradeToFree,
  getUsageSummary,
  resetBillingForTests,
} from "../src/lib/billing";
import { PLANS } from "../src/lib/billing/plans";

function reset() {
  resetMemoryStorageForTests();
  resetBillingForTests();
}

function main() {
  reset();

  let summary = getUsageSummary();
  assert.equal(summary.plan.id, "free");
  assert.equal(summary.generationsLimit, PLANS.free.generationsPerMonth);
  assert.equal(summary.refinesLimit, PLANS.free.refinesPerMonth);

  // Consume free generation quota to the limit
  for (let i = 0; i < PLANS.free.generationsPerMonth; i += 1) {
    consumeUsage("generate");
  }
  assert.throws(() => assertCanConsume("generate"), BillingLimitError);

  // Refine still available until its own limit
  consumeUsage("refine");
  summary = getUsageSummary();
  assert.equal(summary.generationsUsed, PLANS.free.generationsPerMonth);
  assert.equal(summary.refinesUsed, 1);

  // Upgrade unlocks higher caps
  activateProCreator();
  summary = getUsageSummary();
  assert.equal(summary.plan.id, "pro_creator");
  assert.equal(summary.isPro, true);
  assert.equal(summary.generationsLimit, PLANS.pro_creator.generationsPerMonth);
  assertCanConsume("generate");
  consumeUsage("generate");

  downgradeToFree();
  summary = getUsageSummary();
  assert.equal(summary.plan.id, "free");

  console.log("billing-verify: Pro Creator plan quotas ok");
}

main();
