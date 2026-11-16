import Link from "next/link";
import type { PeriodValues } from "@/lib/data";
import { formatValue } from "@/lib/metrics";
import { aggregate, pctChange, RANGES, series, splitRange, TREND_DEFS, type Range, type TrendKey } from "@/lib/trends";
import { BarChart, Sparkline } from "./Charts";

const KPI_KEYS: TrendKey[] = ["revenue_collected", "visits", "new_clients", "rebook_rate", "avg_spend", "retail_revenue"];
const nice = (d: Date) => d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Shopify-style "business at a glance": KPI cards with trend lines, a period picker and a monthly chart. */
export function BusinessGlance({ periods, range, metric }: { periods: PeriodValues[]; range: Range; metric: TrendKey }) {
  const { current, previous } = splitRange(periods, range);
  const href = (r: Range, m: TrendKey) => `/dashboard?range=${r}&metric=${m}#numbers`;
  const from = current.at(-1)?.periodStart, to = current[0]?.periodEnd;
  const chart = series(periods, metric, 12);
  const def = TREND_DEFS[metric];
  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}>
        <div className="pills" role="group" aria-label="Choose period">
          {RANGES.map((r) => <Link key={r.key} href={href(r.key, metric)} className={`pill${r.key === range ? " active" : ""}`} aria-current={r.key === range ? "true" : undefined}>{r.label}</Link>)}
        </div>
        {from && to && <span className="small muted">{nice(from)} – {nice(to)} · {current.length} month{current.length === 1 ? "" : "s"}{previous.length ? ` · compared with the ${previous.length} month${previous.length === 1 ? "" : "s"} before` : ""}</span>}
      </div>
      <div className="kpis">
        {KPI_KEYS.map((k) => {
          const d = TREND_DEFS[k];
          const cur = aggregate(current, k), prev = aggregate(previous, k);
          const c = pctChange(cur, prev);
          const good = c == null ? null : (c >= 0) === d.higherIsBetter;
          return (
            <Link key={k} href={href(range, k)} className={`kpi${k === metric ? " active" : ""}`} title={d.definition} aria-label={`${d.label}: ${formatValue(cur, d.unit)}. Show on chart`}>
              <div className="stat-label">{d.label}</div>
              <div className={cur == null ? "stat empty" : "stat"}>{cur == null ? "Add data" : formatValue(cur, d.unit)}</div>
              <div className="row between" style={{ alignItems: "flex-end", flexWrap: "nowrap" }}>
                <span className="small" style={{ color: good == null ? "var(--muted)" : good ? "var(--ok)" : "var(--bad)" }}>
                  {c == null ? (previous.length ? "No comparison" : " ") : `${c >= 0 ? "▲" : "▼"} ${Math.abs(c).toFixed(1)}%`}
                </span>
                <Sparkline data={series(periods, k, 12)} width={90} height={30} />
              </div>
            </Link>
          );
        })}
      </div>
      <div style={{ marginTop: 18 }}>
        <div className="row between">
          <div><div className="stat-label">{def.label} by month</div><div className="small muted">{def.definition}</div></div>
        </div>
        <BarChart data={chart} unit={def.unit} height={chart.length < 3 ? 160 : 220} />
        {chart.length < 3 && <p className="small muted" style={{ margin: "4px 0 8px" }}>Your chart and trend lines fill in as you lodge each month. Add earlier months on <Link href="/numbers">My numbers</Link> to see your history straight away.</p>}
        <details>
          <summary>See as a table</summary>
          <div className="table-wrap"><table>
            <thead><tr><th>Month</th><th>{def.label}</th></tr></thead>
            <tbody>{[...chart].reverse().map((p) => <tr key={p.label}><td>{p.label}</td><td>{p.value == null ? "Add data" : formatValue(p.value, def.unit)}</td></tr>)}</tbody>
          </table></div>
        </details>
      </div>
    </>
  );
}
