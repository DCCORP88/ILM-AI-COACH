// Deterministic calculators. All arithmetic for advice happens here, never in the model.
// Every function returns null for outputs it can't calculate, plus the list of missing inputs.

import { ratio } from "./metrics";

const num = (v: unknown): number | null => {
  if (v === "" || v == null) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[$,%\s]/g, ""));
  return Number.isFinite(n) ? n : null;
};
export const parseNumber = num;

export type PricingInput = {
  price?: number | string;              // current or proposed price (incl. GST if registered)
  minutes?: number | string;            // appointment length incl. setup/clean
  productCost?: number | string;        // products + consumables per service
  monthlyFixedCosts?: number | string;  // rent, insurance, software, utilities...
  monthlyWages?: number | string;       // wages incl. the owner's own pay
  bookableHoursPerMonth?: number | string; // hours actually available for clients
  gstRegistered?: boolean;
};

export type PricingResult = {
  overheadPerHour: number | null;
  costPerService: number | null;
  priceExGst: number | null;
  contribution: number | null;      // price ex GST − product cost
  margin: number | null;            // (price ex GST − full cost) / price ex GST × 100
  breakEvenPrice: number | null;    // full cost per service (ex GST)
  missing: string[];
  notes: string[];
};

export function pricingWorksheet(input: PricingInput): PricingResult {
  const price = num(input.price);
  const minutes = num(input.minutes);
  const product = num(input.productCost);
  const fixed = num(input.monthlyFixedCosts);
  const wages = num(input.monthlyWages);
  const hours = num(input.bookableHoursPerMonth);
  const missing: string[] = [];
  const notes: string[] = [];
  if (price == null) missing.push("Price");
  if (minutes == null) missing.push("Appointment length (minutes)");
  if (product == null) missing.push("Product + consumables cost per service");
  if (fixed == null) missing.push("Monthly fixed costs");
  if (wages == null) missing.push("Monthly wages (including your own pay)");
  if (hours == null) missing.push("Bookable client hours per month");

  const overheadPerHour = fixed != null && wages != null ? ratio(fixed + wages, hours) : null;
  if (hours === 0) notes.push("Bookable hours can't be zero, so overhead per hour can't be calculated.");
  const costPerService =
    overheadPerHour != null && minutes != null && product != null ? product + (overheadPerHour * minutes) / 60 : null;
  const priceExGst = price == null ? null : input.gstRegistered ? price / 1.1 : price;
  if (input.gstRegistered) notes.push("GST registered: price treated as GST-inclusive (÷ 1.1, Australian rate). Confirm with your accountant.");
  const contribution = priceExGst != null && product != null ? priceExGst - product : null;
  const margin = priceExGst != null && costPerService != null && priceExGst !== 0 ? ((priceExGst - costPerService) / priceExGst) * 100 : null;
  if (priceExGst === 0) notes.push("Price is zero, so margin can't be calculated.");
  return { overheadPerHour, costPerService, priceExGst, contribution, margin, breakEvenPrice: costPerService, missing, notes };
}

export type RevenueGoalInput = {
  currentVisitsPerMonth?: number | string;
  currentAvgSpend?: number | string;
  targetRevenuePerMonth?: number | string;
  extraVisits?: number | string;       // scenario: additional visits per month
  avgSpendIncrease?: number | string;  // scenario: increase in average spend ($)
  capacityPerMonth?: number | string;
};

export function revenueGoal(input: RevenueGoalInput) {
  const visits = num(input.currentVisitsPerMonth);
  const spend = num(input.currentAvgSpend);
  const target = num(input.targetRevenuePerMonth);
  const extra = num(input.extraVisits) ?? 0;
  const inc = num(input.avgSpendIncrease) ?? 0;
  const capacity = num(input.capacityPerMonth);
  const missing: string[] = [];
  if (visits == null) missing.push("Current visits per month");
  if (spend == null) missing.push("Current average spend");
  const current = visits != null && spend != null ? visits * spend : null;
  const scenarioVisits = visits != null ? visits + extra : null;
  const scenarioSpend = spend != null ? spend + inc : null;
  const scenario = scenarioVisits != null && scenarioSpend != null ? scenarioVisits * scenarioSpend : null;
  const gap = target != null && scenario != null ? target - scenario : null;
  const visitsNeededAtCurrentSpend = target != null ? ratio(target, spend) : null;
  const spendNeededAtCurrentVisits = target != null ? ratio(target, visits) : null;
  const overCapacity = capacity != null && scenarioVisits != null ? scenarioVisits > capacity : null;
  return { current, scenario, gap, visitsNeededAtCurrentSpend, spendNeededAtCurrentVisits, overCapacity, missing,
    formula: "Monthly revenue = visits per month × average spend per visit. Scenarios are not forecasts." };
}

export type RebookInput = { visitsPerMonth?: number | string; currentRebookRate?: number | string; targetRebookRate?: number | string; avgSpend?: number | string };

/** Extra visits and revenue a month if more clients rebook (assumes rebooked clients return). */
export function rebookScenario(input: RebookInput) {
  const visits = num(input.visitsPerMonth);
  const cur = num(input.currentRebookRate);
  const tgt = num(input.targetRebookRate);
  const spend = num(input.avgSpend);
  const missing: string[] = [];
  if (visits == null) missing.push("Visits per month");
  if (cur == null) missing.push("Current rebook rate (%)");
  if (tgt == null) missing.push("Target rebook rate (%)");
  const extraRebooks = visits != null && cur != null && tgt != null ? (visits * (tgt - cur)) / 100 : null;
  const extraRevenue = extraRebooks != null && spend != null ? extraRebooks * spend : null;
  return { extraRebooks, extraRevenue, missing,
    formula: "Extra rebooked visits = visits per month × (target rate − current rate) ÷ 100. Assumes rebooked clients attend." };
}
