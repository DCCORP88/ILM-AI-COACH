// Goal progress: uses whichever is newer — a result logged on the project, or the business-wide
// numbers lodged after the goal was set — so owners never have to enter the same number twice.
import type { Goal, MetricEntry } from "@prisma/client";
import { goalProgress } from "./metrics";
import type { PeriodValues } from "./data";

export type GoalStatus = {
  latest: number | null;
  latestSource: "project" | "monthly numbers" | null;
  latestPeriodEnd: Date | null;
  progress: { percent: number; remaining: number } | null;
  stale: boolean; // no result in the last 35 days
};

export function goalStatus(goal: Goal, projectResults: MetricEntry[], periods: PeriodValues[], now = new Date()): GoalStatus {
  const own = projectResults.filter((r) => r.metricKey === goal.metricKey).sort((a, b) => a.periodEnd.getTime() - b.periodEnd.getTime()).at(-1);
  // Business numbers count only for periods ending after the goal was created (i.e. new results, not the baseline).
  const biz = periods
    .filter((p) => p.values[goal.metricKey] != null && p.periodEnd.getTime() > goal.createdAt.getTime() - 86400_000)
    .sort((a, b) => a.periodEnd.getTime() - b.periodEnd.getTime())
    .at(-1);
  let latest: number | null = null, latestSource: GoalStatus["latestSource"] = null, latestPeriodEnd: Date | null = null;
  if (own && (!biz || own.periodEnd >= biz.periodEnd)) { latest = own.value; latestSource = "project"; latestPeriodEnd = own.periodEnd; }
  else if (biz) { latest = biz.values[goal.metricKey]; latestSource = "monthly numbers"; latestPeriodEnd = biz.periodEnd; }
  const ref = latestPeriodEnd ?? goal.createdAt;
  return {
    latest, latestSource, latestPeriodEnd,
    progress: goalProgress(goal.baselineValue, goal.targetValue, latest),
    stale: now.getTime() - ref.getTime() > 35 * 86400_000,
  };
}
