import { requireUser } from "@/lib/auth";
import { businessPeriods } from "@/lib/data";
import { db } from "@/lib/db";
import { deriveMetrics, formatValue, METRICS } from "@/lib/metrics";
import { NumbersForm } from "@/components/NumbersForm";
import { removeMetric } from "@/app/actions";

const d = (x: Date) => x.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export default async function Numbers({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const u = await requireUser();
  const sp = await searchParams;
  const periods = (await businessPeriods(u)).slice(0, 6);
  const entries = await db.metricEntry.findMany({ where: { businessId: u.businessId, projectId: null }, orderBy: { periodStart: "desc" }, take: 200 });
  const used = METRICS.filter((m) => periods.some((p) => p.values[m.key] != null));
  return (
    <>
      <h1>My numbers</h1>
      {sp.welcome && <div className="notice ok">Profile saved. Now lodge your starting numbers. They&apos;re your baseline, and every result will be measured against them. Last month is a good place to start.</div>}
      <p className="muted">Your business-wide numbers by period. The coach reads these before giving advice. Calculated figures are worked out by the app with the formula shown.</p>

      <div className="card">
        <h2>History</h2>
        {periods.length === 0 ? <p className="muted">No numbers lodged yet. Add your first period below.</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Number</th>{periods.map((p) => <th key={p.periodStart.toISOString()}>{d(p.periodStart)} – {d(p.periodEnd)}</th>)}</tr></thead>
              <tbody>
                {used.map((m) => (
                  <tr key={m.key}><td title={m.definition}>{m.label}</td>{periods.map((p) => <td key={p.periodStart.toISOString()}>{formatValue(p.values[m.key], m.unit)}</td>)}</tr>
                ))}
                {deriveMetrics({}).map((dm) => (
                  <tr key={dm.key}>
                    <td title={dm.formula}><em>{dm.label}</em><div className="small muted">{dm.formula}</div></td>
                    {periods.map((p) => {
                      const v = deriveMetrics(p.values).find((x) => x.key === dm.key)!;
                      return <td key={p.periodStart.toISOString()} className={v.value == null ? "muted small" : ""}>{v.value == null ? "Not enough data" : formatValue(v.value, v.unit)}</td>;
                    })}
                  </tr>
                ))}
                <tr><td className="small muted">Source / last updated</td>{periods.map((p) => <td key={p.periodStart.toISOString()} className="small muted">{[...new Set(Object.values(p.sources))].join(", ")}<br />{p.updatedAt.toLocaleDateString("en-AU")}</td>)}</tr>
              </tbody>
            </table>
          </div>
        )}
        <p className="small muted">Revenue collected is money received, not booked appointments and not profit. Amounts are shown as entered (AUD); state whether you entered them including GST in the source field.</p>
      </div>

      <div className="card">
        <h2>Lodge numbers for a period</h2>
        <NumbersForm />
      </div>

      {entries.length > 0 && (
        <details className="card">
          <summary>Correct or remove an entry</summary>
          <div className="table-wrap"><table>
            <thead><tr><th>Period</th><th>Number</th><th>Value</th><th>Source</th><th></th></tr></thead>
            <tbody>{entries.map((e) => {
              const m = METRICS.find((x) => x.key === e.metricKey);
              return (
                <tr key={e.id}>
                  <td>{d(e.periodStart)} – {d(e.periodEnd)}</td><td>{m?.label ?? e.metricKey}</td><td>{formatValue(e.value, m?.unit ?? "number")}</td><td className="small">{e.source}</td>
                  <td><form action={removeMetric}><input type="hidden" name="id" value={e.id} /><button className="btn link small">Remove</button></form></td>
                </tr>
              );
            })}</tbody>
          </table></div>
          <p className="small muted">To correct a value, lodge the same period again with the right number; it replaces the old one.</p>
        </details>
      )}
    </>
  );
}
