export type PlanId = "free" | "pro_creator";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  priceLabel: string;
  priceMonthlyUsd: number;
  tagline: string;
  generationsPerMonth: number;
  refinesPerMonth: number;
  maxProjects: number;
  features: string[];
};

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    priceLabel: "$0",
    priceMonthlyUsd: 0,
    tagline: "Start creating and save work locally.",
    generationsPerMonth: 15,
    refinesPerMonth: 5,
    maxProjects: 8,
    features: [
      "15 AI generations / month",
      "5 AI refines / month",
      "Up to 8 projects",
      "Local workspace saves",
      "Version history",
    ],
  },
  pro_creator: {
    id: "pro_creator",
    name: "Pro Creator",
    priceLabel: "$19/mo",
    priceMonthlyUsd: 19,
    tagline: "Serious output for creators who publish weekly.",
    generationsPerMonth: 300,
    refinesPerMonth: 150,
    maxProjects: 250,
    features: [
      "300 AI generations / month",
      "150 AI refines / month",
      "Up to 250 projects",
      "Project-aware AI context",
      "Priority refine workflow",
      "Everything in Free",
    ],
  },
};

export function getPlan(planId: PlanId | string | null | undefined): PlanDefinition {
  if (planId === "pro_creator") return PLANS.pro_creator;
  return PLANS.free;
}
