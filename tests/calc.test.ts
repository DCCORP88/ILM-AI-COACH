import { describe, expect, it } from "vitest";
import { pricingWorksheet, rebookScenario, revenueGoal, parseNumber } from "@/lib/calc";
import { deriveMetrics, goalProgress, ratio, formatValue } from "@/lib/metrics";

describe("ratio / derived metrics", () => {
  it("returns null for missing or zero denominators (never 0 or Infinity)", () => {
    expect(ratio(10, 0)).toBeNull();
    expect(ratio(undefined, 5)).toBeNull();
    expect(ratio(10, 4)).toBe(2.5);
  });
  it("derives avg spend, rebook rate, profit with formulas", () => {
    const d = Object.fromEntries(deriveMetrics({ revenue_collected: 6000, visits: 80, rebooked_visits: 60, costs_total: 4000 }).map((x) => [x.key, x]));
    expect(d.avg_spend.value).toBe(75);
    expect(d.rebook_rate.value).toBe(75);
    expect(d.profit.value).toBe(2000);
    expect(d.utilisation.value).toBeNull();
    expect(d.utilisation.missing).toContain("Available appointment slots");
  });
  it("falls back to booking-system rebook rate", () => {
    const d = deriveMetrics({ rebook_rate_reported: 58 }).find((x) => x.key === "rebook_rate")!;
    expect(d.value).toBe(58);
  });
  it("formats missing values as Add data", () => {
    expect(formatValue(null, "money")).toBe("Add data");
  });
});

describe("pricing worksheet", () => {
  it("calculates cost per service and margin", () => {
    const r = pricingWorksheet({ price: 110, minutes: 60, productCost: 10, monthlyFixedCosts: 2000, monthlyWages: 4000, bookableHoursPerMonth: 120 });
    expect(r.overheadPerHour).toBe(50);
    expect(r.costPerService).toBe(60);
    expect(r.contribution).toBe(100);
    expect(r.margin).toBeCloseTo(45.45, 1);
    expect(r.missing).toEqual([]);
  });
  it("handles GST-inclusive prices", () => {
    const r = pricingWorksheet({ price: 110, gstRegistered: true });
    expect(r.priceExGst).toBeCloseTo(100);
  });
  it("handles zero hours and missing inputs without misleading output", () => {
    const r = pricingWorksheet({ price: 100, minutes: 60, productCost: 10, monthlyFixedCosts: 1000, monthlyWages: 1000, bookableHoursPerMonth: 0 });
    expect(r.overheadPerHour).toBeNull();
    expect(r.costPerService).toBeNull();
    expect(r.margin).toBeNull();
    const empty = pricingWorksheet({});
    expect(empty.missing.length).toBe(6);
    expect(empty.margin).toBeNull();
  });
  it("zero price gives null margin, not -Infinity", () => {
    const r = pricingWorksheet({ price: 0, minutes: 60, productCost: 10, monthlyFixedCosts: 1000, monthlyWages: 1000, bookableHoursPerMonth: 100 });
    expect(r.margin).toBeNull();
  });
});

describe("revenue goal & rebook scenario", () => {
  it("computes scenario, gap and capacity warning", () => {
    const r = revenueGoal({ currentVisitsPerMonth: 80, currentAvgSpend: 80, targetRevenuePerMonth: 8000, extraVisits: 10, capacityPerMonth: 85 });
    expect(r.current).toBe(6400);
    expect(r.scenario).toBe(7200);
    expect(r.gap).toBe(800);
    expect(r.visitsNeededAtCurrentSpend).toBe(100);
    expect(r.overCapacity).toBe(true);
  });
  it("zero average spend does not divide by zero", () => {
    const r = revenueGoal({ currentVisitsPerMonth: 10, currentAvgSpend: 0, targetRevenuePerMonth: 1000 });
    expect(r.visitsNeededAtCurrentSpend).toBeNull();
  });
  it("rebook scenario", () => {
    const r = rebookScenario({ visitsPerMonth: 100, currentRebookRate: 50, targetRebookRate: 80, avgSpend: 90 });
    expect(r.extraRebooks).toBe(30);
    expect(r.extraRevenue).toBe(2700);
  });
  it("parses $ and commas, rejects junk", () => {
    expect(parseNumber("$1,200")).toBe(1200);
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("")).toBeNull();
  });
  it("goal progress needs baseline, target and result", () => {
    expect(goalProgress(50, 75, 58)!.percent).toBeCloseTo(32);
    expect(goalProgress(50, 50, 58)).toBeNull();
    expect(goalProgress(null, 75, 58)).toBeNull();
  });
});

describe("program sections", async () => {
  const { programSections } = await import("@/lib/program");
  it("puts the main pathway first and doesn't repeat shared activities", () => {
    const secs = programSections("salon", "educator");
    expect(secs[0].pathway).toBe("salon");
    expect(secs[1].pathway).toBe("educator");
    const keys = secs.flatMap((s) => s.steps.map((x) => x.key));
    expect(new Set(keys).size).toBe(keys.length);
    expect(secs[1].steps.some((s) => s.key === "readiness")).toBe(true);
    expect(secs[1].steps.some((s) => s.key === "price-check")).toBe(false); // already in salon
  });
  it("ignores unknown or duplicate extras", () => {
    expect(programSections("solo", "solo,unknown,").length).toBe(1);
  });
});

describe("intake questions", async () => {
  const { intakeFor, isVisible } = await import("@/lib/intake");
  it("each educator activity has its own questions", () => {
    const r = intakeFor("course", "readiness", "educator").map((q) => q.key);
    const d = intakeFor("course", "course-design", "educator").map((q) => q.key);
    expect(r).toContain("fixing");
    expect(d).toEqual(expect.arrayContaining(["format", "modules", "topics", "theory_assess", "criteria"]));
    expect(r).not.toContain("modules");
  });
  it("shows in-person or online follow-ups based on the format answer", () => {
    const qs = intakeFor("course", "course-design", "educator");
    const ipDays = qs.find((q) => q.key === "ip_days")!;
    const olPlat = qs.find((q) => q.key === "ol_platform")!;
    expect(isVisible(ipDays, { format: "In person" })).toBe(true);
    expect(isVisible(olPlat, { format: "In person" })).toBe(false);
    expect(isVisible(olPlat, { format: "Both (hybrid)" })).toBe(true);
    expect(isVisible(ipDays, {})).toBe(false);
  });
  it("adds salon-only questions and educator wording", () => {
    expect(intakeFor("pricing", "price-check", "salon").map((q) => q.key)).toContain("team_pay");
    expect(intakeFor("pricing", "price-check", "solo").map((q) => q.key)).not.toContain("team_pay");
    const dm = intakeFor("digital-marketing", "", "educator").find((q) => q.key === "offer_message")!;
    expect(dm.label).toMatch(/students/);
    const keys = intakeFor("pricing", "price-check", "salon").map((q) => q.key);
    expect(keys.at(-1)).toBe("tried"); // common questions stay last
  });
});

describe("dashboard trends", async () => {
  const { aggregate, splitRange, series, pctChange } = await import("@/lib/trends");
  const P = (m: number, v: Record<string, number>) => ({ periodStart: new Date(Date.UTC(2026, m, 1)), periodEnd: new Date(Date.UTC(2026, m + 1, 0)), values: v, sources: {}, updatedAt: new Date() });
  const periods = [P(9, { revenue_collected: 6000, visits: 60, rebook_rate_reported: 80, costs_total: 4000 }), P(8, { revenue_collected: 4000, visits: 40, rebook_rate_reported: 50 }), P(7, { revenue_collected: 3000, visits: 50 })];
  it("sums money and counts, recalculates rates from totals", () => {
    const { current, previous } = splitRange(periods, "3");
    expect(current.length).toBe(3); expect(previous.length).toBe(0);
    expect(aggregate(current, "revenue_collected")).toBe(13000);
    expect(aggregate(current, "avg_spend")).toBeCloseTo(13000 / 150);
    expect(aggregate(current.slice(0, 2), "rebook_rate")).toBeCloseTo((80 * 60 + 50 * 40) / 100); // weighted by visits
    expect(aggregate(current, "profit")).toBe(2000); // only months with both revenue and costs
  });
  it("compares with the equal range before, and handles missing data", () => {
    const { current, previous } = splitRange(periods, "1");
    expect(pctChange(aggregate(current, "revenue_collected"), aggregate(previous, "revenue_collected"))).toBe(50);
    expect(aggregate(current, "retail_revenue")).toBeNull();
    expect(pctChange(10, 0)).toBeNull();
    expect(series(periods, "revenue_collected").map((x) => x.value)).toEqual([3000, 4000, 6000]); // oldest → newest
  });
});
