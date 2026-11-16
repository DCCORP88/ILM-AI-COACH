import { saveNumbers } from "@/app/actions";
import { ActionForm } from "./ActionForm";
import { METRICS, type MetricDef } from "@/lib/metrics";

function lastMonth() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}

/** Number entry form. `only` limits the metrics shown (e.g. for a project result). */
export function NumbersForm({ projectId, only, submit = "Save numbers" }: { projectId?: string; only?: string[]; submit?: string }) {
  const [s, e] = lastMonth();
  const list: MetricDef[] = only ? METRICS.filter((m) => only.includes(m.key)) : METRICS;
  const groups = [...new Set(list.map((m) => m.group))];
  return (
    <ActionForm action={saveNumbers} submit={submit} resetOnOk>
      {projectId && <input type="hidden" name="projectId" value={projectId} />}
      <div className="grid g3">
        <label>Period start<input type="date" name="periodStart" defaultValue={s} required /></label>
        <label>Period end<input type="date" name="periodEnd" defaultValue={e} required /></label>
        <label>Source <span className="hint">(where the numbers came from)</span><input name="source" placeholder="e.g. Fresha report, Xero, Ads Manager" /></label>
      </div>
      <p className="small muted">Fill in only what you know. Leave the rest blank; blanks show as &quot;Add data&quot;, never as zero.</p>
      {groups.map((g) => (
        <fieldset key={g} style={{ border: "1px solid var(--line)", borderRadius: 10, marginTop: 12 }}>
          <legend style={{ fontWeight: 700, padding: "0 6px" }}>{g}</legend>
          <div className="grid g3">
            {list.filter((m) => m.group === g).map((m) => (
              <label key={m.key} title={m.definition}>
                {m.label} <span className="hint">{m.unit === "money" ? "($)" : m.unit === "percent" ? "(%)" : ""}</span>
                <input name={`m_${m.key}`} inputMode="decimal" />
                <span className="hint small" style={{ fontWeight: 400 }}>{m.definition}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <label>Note <span className="hint">(optional, e.g. &quot;closed 1 week for holidays&quot;)</span><input name="note" /></label>
    </ActionForm>
  );
}
