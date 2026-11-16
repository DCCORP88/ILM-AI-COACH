// Trend maths for the dashboard (Shopify-style cards and chart). All calculated in code.
// Flow numbers (revenue, visits…) are summed over a range; rates are recalculated from totals
// (average spend = revenue ÷ visits) or averaged weighted by visits (rebook rate), never summed.
import type { PeriodValues } from "./data";
import { METRIC_BY_KEY, ratio, type MetricUnit } from "./metrics";

export type TrendKey = "revenue_collected" | "visits" | "new_clients" | "returning_clients" | "rebook_rate" | "avg_spend" | "retail_revenue" | "profit" | "enquiries";

export const TREND_DEFS: Record<TrendKey, { label: string; unit: MetricUnit; higherIsBetter: boolean; definition: string }> = {
  revenue_collected: { label: "Revenue collected", unit: "money", higherIsBetter: true, definition: METRIC_BY_KEY.revenue_collected.definition },
  visits: { label: "Client visits", unit: "count", higherIsBetter: true, definition: METRIC_BY_KEY.visits.definition },
  new_clients: { label: "New clients", unit: "count", higherIsBetter: true, definition: METRIC_BY_KEY.new_clients.definition },
  returning_clients: { label: "Returning clients", unit: "count", higherIsBetter: true, definition: METRIC_BY_KEY.returning_clients.definition },
  rebook_rate: { label: "Rebook rate", unit: "percent", higherIsBetter: true, definition: "Visits rebooked before leaving ÷ visits, or your booking system's reported rate. Averaged across months, weighted by visits." },
  avg_spend: { label: "Average spend", unit: "money", higherIsBetter: true, definition: "Revenue collected ÷ client visits for the whole period." },
  retail_revenue: { label: "Retail sales", unit: "money", higherIsBetter: true, definition: METRIC_BY_KEY.retail_revenue.definition },
  profit: { label: "Profit (before tax)", unit: "money", higherIsBetter: true, definition: "Revenue collected − total costs. Only months with both figures count." },
  enquiries: { label: "Enquiries", unit: "count", higherIsBetter: true, definition: METRIC_BY_KEY.enquiries.definition },
};

const sum = (xs: (number | undefined)[]) => {
  const v = xs.filter((x): x is number => x != null);
  return v.length ? v.reduce((a, b) => a + b, 0) : null;
};

function rebookFor(p: PeriodValues): number | null {
  const v = p.values;
  return ratio(v.rebooked_visits, v.visits) != null ? (v.rebooked_visits! / v.visits!) * 100 : v.rebook_rate_reported ?? null;
}

/** Value of a trend number for one period. */
export function valueFor(p: PeriodValues, key: TrendKey): number | null {
  const v = p.values;
  switch (key) {
    case "rebook_rate": return rebookFor(p);
    case "avg_spend": return ratio(v.revenue_collected, v.visits);
    case "profit": return v.revenue_collected != null && v.costs_total != null ? v.revenue_collected - v.costs_total : null;
    default: return v[key] ?? null;
  }
}

/** Value of a trend number over several periods. */
export function aggregate(periods: PeriodValues[], key: TrendKey): number | null {
  if (!periods.length) return null;
  switch (key) {
    case "avg_spend": return ratio(sum(periods.map((p) => p.values.revenue_collected)), sum(periods.map((p) => p.values.visits)));
    case "rebook_rate": {
      const rows = periods.map((p) => ({ r: rebookFor(p), w: p.values.visits ?? 1 })).filter((x) => x.r != null);
      if (!rows.length) return null;
      const w = rows.reduce((a, x) => a + x.w, 0);
      return w ? rows.reduce((a, x) => a + (x.r as number) * x.w, 0) / w : null;
    }
    case "profit": {
      const both = periods.filter((p) => p.values.revenue_collected != null && p.values.costs_total != null);
      return both.length ? both.reduce((a, p) => a + p.values.revenue_collected! - p.values.costs_total!, 0) : null;
    }
    default: return sum(periods.map((p) => p.values[key]));
  }
}

export type Range = "1" | "3" | "6" | "12" | "all";
export const RANGES: { key: Range; label: string }[] = [
  { key: "1", label: "Latest month" }, { key: "3", label: "Last 3 months" }, { key: "6", label: "Last 6 months" }, { key: "12", label: "Last 12 months" }, { key: "all", label: "All time" },
];

/** Splits lodged periods (newest first) into the selected range and the equal range before it. */
export function splitRange(periods: PeriodValues[], range: Range) {
  const n = range === "all" ? periods.length : Number(range);
  return { current: periods.slice(0, n), previous: range === "all" ? [] : periods.slice(n, n * 2) };
}

/** Oldest → newest series for sparklines and the chart. */
export function series(periods: PeriodValues[], key: TrendKey, max = 12) {
  return periods.slice(0, max).reverse().map((p) => ({ label: p.periodStart.toLocaleDateString("en-AU", { month: "short", year: "2-digit", timeZone: "UTC" }), value: valueFor(p, key), start: p.periodStart }));
}

export function pctChange(cur: number | null, prev: number | null): number | null {
  if (cur == null || prev == null || prev === 0) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}
