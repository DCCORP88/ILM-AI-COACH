import { applyPlan, discardPlan, rebuildPlan, saveIntake, skipIntake } from "@/app/actions";
import { ActionForm } from "./ActionForm";
import { intakeFor, outlineToMarkdown } from "@/lib/intake";
import { IntakeFields } from "./IntakeFields";
import { Markdown } from "./Markdown";
import { METRIC_BY_KEY } from "@/lib/metrics";
import type { IntakeAnswers, PlanDraft } from "@/lib/plan";

export function IntakeForm({ projectId, category, stepKey, pathway, answers, defaults }: { projectId: string; category: string; stepKey: string; pathway: string; answers: IntakeAnswers; defaults: IntakeAnswers }) {
  const qs = intakeFor(category, stepKey, pathway);
  const initial: IntakeAnswers = { ...defaults, ...Object.fromEntries(Object.entries(answers).filter(([, v]) => v)) };
  const prefilled = Object.keys(defaults).filter((k) => !answers[k]);
  return (
    <div className="card" style={{ borderColor: "var(--accent)" }} id="intake">
      <h2>Let&apos;s tailor your plan</h2>
      <p className="small muted">Answer what you can; skip anything you don&apos;t know. Some questions appear depending on your answers. Anything you&apos;ve already told the coach is filled in.</p>
      <ActionForm action={saveIntake} submit="Build my plan">
        <input type="hidden" name="projectId" value={projectId} />
        <IntakeFields questions={qs} initial={initial} prefilled={prefilled} />
        <p className="small muted" style={{ marginTop: 10 }}>Building the plan can take up to a minute{stepKey === "course-design" ? " (a little longer, because your coach also drafts your course outline)" : ""}.</p>
      </ActionForm>
      <form action={skipIntake} style={{ marginTop: 6 }}><input type="hidden" name="projectId" value={projectId} /><button className="btn link small">Skip for now</button></form>
    </div>
  );
}

export function PlanReview({ projectId, plan }: { projectId: string; plan: PlanDraft }) {
  return (
    <div className="card" style={{ borderColor: "var(--accent)" }} id="plan">
      <div className="row between">
        <h2>Your tailored plan {plan.source === "template" && <span className="badge warn">Template (demo mode)</span>}</h2>
        <div className="row">
          <form action={rebuildPlan}><input type="hidden" name="projectId" value={projectId} /><button className="btn ghost small">Rebuild my plan</button></form>
          <form action={discardPlan}><input type="hidden" name="projectId" value={projectId} /><button className="btn link small">Discard</button></form>
        </div>
      </div>
      <p><strong>What your answers show:</strong> {plan.diagnosis}</p>
      {plan.strategy?.length > 0 && <><p><strong>How you&apos;ll get there:</strong></p><ol>{plan.strategy.map((s) => <li key={s}>{s}</li>)}</ol></>}
      {plan.assumptions.length > 0 && <><p className="small"><strong>Assumptions</strong> (check these):</p><ul className="small">{plan.assumptions.map((a) => <li key={a}>{a}</li>)}</ul></>}
      {plan.missingInfo.length > 0 && <><p className="small"><strong>Still needed:</strong></p><ul className="small">{plan.missingInfo.map((a) => <li key={a}>{a}</li>)}</ul></>}
      <form action={applyPlan}>
        <input type="hidden" name="projectId" value={projectId} />
        {plan.goals.length > 0 && (
          <>
            <h3 style={{ marginTop: 14 }}>Goals to track</h3>
            <p className="small muted">Your starting point is taken from your own numbers or answers, never guessed. Adjust any target before adding.</p>
            {plan.goals.map((g, i) => (
              <div key={i} className="row" style={{ margin: "6px 0" }}>
                <label style={{ fontWeight: 400, margin: 0, flex: 2, minWidth: 220 }}><input type="checkbox" name={`goal_${i}`} defaultChecked /> <strong>{METRIC_BY_KEY[g.metricKey]?.label}</strong> <span className="small muted">{g.why}</span></label>
                <input name={`goal_target_${i}`} defaultValue={g.target ?? ""} placeholder="Target" inputMode="decimal" style={{ flex: 1, maxWidth: 140 }} />
              </div>
            ))}
          </>
        )}
        <h3 style={{ marginTop: 14 }}>Action plan</h3>
        {plan.tasks.map((t, i) => (
          <label key={i} style={{ fontWeight: 400, display: "flex", gap: 8, alignItems: "flex-start" }}>
            <input type="checkbox" name={`task_${i}`} defaultChecked style={{ marginTop: 5 }} />
            <span><span className="badge">Week {t.week}</span> <strong>{t.title}</strong>{t.detail && <span className="small muted"> · {t.detail}</span>}</span>
          </label>
        ))}
        {plan.courseOutline && (
          <div style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
            <h3>Draft course outline</h3>
            <div style={{ maxHeight: 420, overflowY: "auto", padding: "0 4px" }}><Markdown text={outlineToMarkdown(plan.courseOutline)} /></div>
            <label style={{ fontWeight: 400 }}><input type="checkbox" name="saveOutline" defaultChecked /> Save this outline to my resources, where I can edit it</label>
          </div>
        )}
        <p className="small" style={{ marginTop: 10 }}><strong>First step:</strong> {plan.nextStep}</p>
        {plan.contentUsed.length > 0 && <p className="small muted">Based on: {plan.contentUsed.join(" · ")}</p>}
        <button className="btn" style={{ marginTop: 10 }}>Add ticked items to my project</button>
      </form>
    </div>
  );
}

type Analysis = { source: string; diagnosis: string; strategy: string[]; assumptions: string[]; missingInfo: string[]; contentUsed: string[]; createdAt: string };

export function PlanAnalysis({ raw }: { raw: string }) {
  let a: Analysis;
  try { a = JSON.parse(raw); } catch { return null; }
  return (
    <details className="card" open>
      <summary style={{ fontSize: "1rem" }}>Your coach&apos;s analysis and plan {a.source === "template" && <span className="badge warn">Template (demo mode)</span>}</summary>
      <p style={{ marginTop: 10 }}><strong>What your answers show:</strong> {a.diagnosis}</p>
      {a.strategy.length > 0 && <><p><strong>How you&apos;ll get there:</strong></p><ol>{a.strategy.map((s) => <li key={s}>{s}</li>)}</ol></>}
      {a.missingInfo.length > 0 && <p className="small"><strong>Still needed:</strong> {a.missingInfo.join(" · ")}</p>}
      {a.assumptions.length > 0 && <p className="small muted"><strong>Assumptions:</strong> {a.assumptions.join(" · ")}</p>}
      <p className="small muted">Built {new Date(a.createdAt).toLocaleDateString("en-AU")}{a.contentUsed.length > 0 && <> · based on {a.contentUsed.join(", ")}</>}. Update your intake answers any time to rebuild it.</p>
    </details>
  );
}
