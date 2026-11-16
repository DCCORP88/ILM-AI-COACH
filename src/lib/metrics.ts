// Metric catalogue: every number an owner can lodge, with a plain definition.
// Derived metrics are calculated in code (never by the model) and handle missing/zero inputs.

export type MetricUnit = "money" | "count" | "percent" | "number";

export type MetricDef = {
  key: string;
  label: string;
  unit: MetricUnit;
  group: "Money" | "Clients" | "Retention" | "Marketing" | "Digital" | "Education";
  definition: string;
  higherIsBetter: boolean;
};

export const METRICS: MetricDef[] = [
  { key: "revenue_collected", label: "Revenue collected", unit: "money", group: "Money", higherIsBetter: true,
    definition: "Money actually received for services and retail in the period, before costs. Not the same as profit, and not booked-but-unpaid appointments." },
  { key: "revenue_booked", label: "Revenue booked", unit: "money", group: "Money", higherIsBetter: true,
    definition: "Value of appointments booked for the period (from your booking system). Some may cancel, so this can differ from revenue collected." },
  { key: "retail_revenue", label: "Retail / aftercare sales", unit: "money", group: "Money", higherIsBetter: true,
    definition: "Money received from product sales (e.g. aftercare) in the period. Included in revenue collected." },
  { key: "costs_total", label: "Total costs", unit: "money", group: "Money", higherIsBetter: false,
    definition: "All business costs paid in the period: rent, products, wages (including yours), software, marketing, fees." },
  { key: "visits", label: "Client visits", unit: "count", group: "Clients", higherIsBetter: true,
    definition: "Number of completed appointments in the period." },
  { key: "new_clients", label: "New clients", unit: "count", group: "Clients", higherIsBetter: true,
    definition: "Clients whose first ever visit was in the period." },
  { key: "returning_clients", label: "Returning clients", unit: "count", group: "Clients", higherIsBetter: true,
    definition: "Clients who had visited before and came back in the period." },
  { key: "capacity_slots", label: "Available appointment slots", unit: "count", group: "Clients", higherIsBetter: true,
    definition: "How many appointments you (and your team) could have done in the period if fully booked." },
  { key: "rebooked_visits", label: "Visits rebooked before leaving", unit: "count", group: "Retention", higherIsBetter: true,
    definition: "Completed visits where the client booked their next appointment before leaving (your booking system's rebook report)." },
  { key: "rebook_rate_reported", label: "Rebook rate (from booking system)", unit: "percent", group: "Retention", higherIsBetter: true,
    definition: "Rebooking rate exactly as your booking system (e.g. Fresha) reports it. Use this if you don't have the visit counts." },
  { key: "no_shows", label: "No-shows and late cancellations", unit: "count", group: "Retention", higherIsBetter: false,
    definition: "Appointments missed or cancelled inside your cancellation window in the period." },
  { key: "loyalty_members", label: "Loyalty program members", unit: "count", group: "Retention", higherIsBetter: true,
    definition: "Clients enrolled in your loyalty program at the end of the period." },
  { key: "referrals", label: "Referred new clients", unit: "count", group: "Retention", higherIsBetter: true,
    definition: "New clients who came from a client referral in the period." },
  { key: "google_reviews", label: "New Google reviews", unit: "count", group: "Marketing", higherIsBetter: true,
    definition: "Google reviews received in the period." },
  { key: "enquiries", label: "Enquiries", unit: "count", group: "Marketing", higherIsBetter: true,
    definition: "Messages, calls, DMs and forms asking about booking in the period." },
  { key: "enquiry_bookings", label: "Enquiries that booked", unit: "count", group: "Marketing", higherIsBetter: true,
    definition: "Enquiries in the period that turned into a booking." },
  { key: "marketing_spend", label: "Marketing spend", unit: "money", group: "Marketing", higherIsBetter: false,
    definition: "Money spent on marketing in the period (ads, printing, promotions, sponsorship)." },
  { key: "ad_spend", label: "Meta ad spend", unit: "money", group: "Digital", higherIsBetter: false,
    definition: "Amount spent on Meta (Facebook/Instagram) ads in the period, from Ads Manager." },
  { key: "ad_impressions", label: "Ad impressions", unit: "count", group: "Digital", higherIsBetter: true,
    definition: "Times your ads were shown (Ads Manager)." },
  { key: "ad_clicks", label: "Ad link clicks", unit: "count", group: "Digital", higherIsBetter: true,
    definition: "Link clicks on your ads (Ads Manager)." },
  { key: "ad_leads", label: "Ad leads / bookings (Meta-attributed)", unit: "count", group: "Digital", higherIsBetter: true,
    definition: "Leads or bookings Meta attributes to your ads. Attribution is Meta's estimate, not verified business revenue." },
  { key: "email_subscribers", label: "Email list size", unit: "count", group: "Digital", higherIsBetter: true,
    definition: "Subscribers on your email list at the end of the period (consented contacts only)." },
  { key: "email_clicks", label: "Email clicks", unit: "count", group: "Digital", higherIsBetter: true,
    definition: "Clicks on links in your emails in the period. Opens are an unreliable signal, so clicks are tracked instead." },
  { key: "instagram_followers", label: "Instagram followers", unit: "count", group: "Digital", higherIsBetter: true,
    definition: "Followers at the end of the period. Useful context, but bookings matter more than followers." },
  { key: "students_enrolled", label: "Students enrolled", unit: "count", group: "Education", higherIsBetter: true,
    definition: "Students who enrolled (paid deposit or in full) in your courses in the period." },
  { key: "course_revenue", label: "Course revenue collected", unit: "money", group: "Education", higherIsBetter: true,
    definition: "Course money actually received in the period (instalments counted when paid)." },
];

export const METRIC_BY_KEY = Object.fromEntries(METRICS.map((m) => [m.key, m])) as Record<string, MetricDef>;

/** Safe division: returns null when inputs are missing or the denominator is zero, so the UI
 *  can show "Add data" / "Not enough data" instead of a misleading 0 or Infinity. */
export function ratio(numerator: number | null | undefined, denominator: number | null | undefined): number | null {
  if (numerator == null || denominator == null) return null;
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null;
  return numerator / denominator;
}

export type DerivedMetric = { key: string; label: string; unit: MetricUnit; value: number | null; formula: string; missing: string[] };

/** Derived metrics for one period, computed from lodged values. */
export function deriveMetrics(v: Record<string, number | undefined>): DerivedMetric[] {
  const need = (...keys: string[]) => keys.filter((k) => v[k] == null).map((k) => METRIC_BY_KEY[k]?.label ?? k);
  const pct = (n?: number, d?: number) => {
    const r = ratio(n, d);
    return r == null ? null : r * 100;
  };
  const rebookFromCounts = pct(v.rebooked_visits, v.visits);
  return [
    { key: "avg_spend", label: "Average spend per visit", unit: "money", formula: "Revenue collected ÷ Client visits",
      value: ratio(v.revenue_collected, v.visits), missing: need("revenue_collected", "visits") },
    { key: "profit", label: "Profit (before tax)", unit: "money", formula: "Revenue collected − Total costs",
      value: v.revenue_collected != null && v.costs_total != null ? v.revenue_collected - v.costs_total : null,
      missing: need("revenue_collected", "costs_total") },
    { key: "rebook_rate", label: "Rebook rate", unit: "percent",
      formula: rebookFromCounts != null ? "Visits rebooked before leaving ÷ Client visits × 100" : "As reported by your booking system",
      value: rebookFromCounts ?? v.rebook_rate_reported ?? null,
      missing: rebookFromCounts != null || v.rebook_rate_reported != null ? [] : need("rebooked_visits", "visits") },
    { key: "utilisation", label: "Diary utilisation", unit: "percent", formula: "Client visits ÷ Available appointment slots × 100",
      value: pct(v.visits, v.capacity_slots), missing: need("visits", "capacity_slots") },
    { key: "retail_share", label: "Retail share of revenue", unit: "percent", formula: "Retail sales ÷ Revenue collected × 100",
      value: pct(v.retail_revenue, v.revenue_collected), missing: need("retail_revenue", "revenue_collected") },
    { key: "enquiry_conversion", label: "Enquiry conversion", unit: "percent", formula: "Enquiries that booked ÷ Enquiries × 100",
      value: pct(v.enquiry_bookings, v.enquiries), missing: need("enquiry_bookings", "enquiries") },
    { key: "cost_per_new_client", label: "Marketing cost per new client", unit: "money", formula: "Marketing spend ÷ New clients",
      value: ratio(v.marketing_spend, v.new_clients), missing: need("marketing_spend", "new_clients") },
    { key: "ctr", label: "Ad click-through rate (CTR)", unit: "percent", formula: "Ad link clicks ÷ Ad impressions × 100",
      value: pct(v.ad_clicks, v.ad_impressions), missing: need("ad_clicks", "ad_impressions") },
    { key: "cpc", label: "Cost per click (CPC)", unit: "money", formula: "Meta ad spend ÷ Ad link clicks",
      value: ratio(v.ad_spend, v.ad_clicks), missing: need("ad_spend", "ad_clicks") },
    { key: "cpl", label: "Cost per lead (CPL, Meta-attributed)", unit: "money", formula: "Meta ad spend ÷ Ad leads",
      value: ratio(v.ad_spend, v.ad_leads), missing: need("ad_spend", "ad_leads") },
  ];
}

export function formatValue(value: number | null | undefined, unit: MetricUnit): string {
  if (value == null || !Number.isFinite(value)) return "Add data";
  switch (unit) {
    case "money":
      return value.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 2 });
    case "percent":
      return `${value.toLocaleString("en-AU", { maximumFractionDigits: 1 })}%`;
    case "count":
      return Math.round(value).toLocaleString("en-AU");
    default:
      return value.toLocaleString("en-AU", { maximumFractionDigits: 2 });
  }
}

/** Progress from baseline to target. Null when the gap can't be measured honestly. */
export function goalProgress(baseline: number | null | undefined, target: number | null | undefined, latest: number | null | undefined) {
  if (baseline == null || target == null || latest == null) return null;
  const gap = target - baseline;
  if (gap === 0) return null;
  const pct = ((latest - baseline) / gap) * 100;
  return { percent: Math.max(-100, Math.min(200, pct)), remaining: target - latest };
}
