import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { businessPeriods, getProfile, getProjectFull } from "@/lib/data";
import { goalStatus } from "@/lib/goals";
import { METRIC_BY_KEY, formatValue } from "@/lib/metrics";
import { PROGRAM, PROJECT_CATEGORIES, STEP_WHY } from "@/lib/program";
import { ActionForm } from "@/components/ActionForm";
import { ChatInput } from "@/components/Chat";
import { GoalForm } from "@/components/GoalForm";
import { MessageList } from "@/components/MessageList";
import { IntakeForm, PlanAnalysis, PlanReview } from "@/components/Intake";
import { intakeDefaults, parseIntake, type PlanDraft } from "@/lib/plan";
import { NumbersForm } from "@/components/NumbersForm";
import {
  addTask, completeTask, deleteDecision, reviewProgress, deleteGoal, deleteTask, removeMetric, saveDecision,
  setProjectStatus, updateProject, updateTask,
} from "@/app/actions";

const iso = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
const nice = (d?: Date | null) => (d ? d.toLocaleDateString("en-AU", { timeZone: "UTC" }) : "");

const SUGGESTED_METRICS: Record<string, string[]> = {
  pricing: ["revenue_collected", "visits"], policies: ["no_shows"], retention: ["rebook_rate_reported", "returning_clients"],
  loyalty: ["loyalty_members", "referrals", "returning_clients"], retail: ["retail_revenue"],
  "local-marketing": ["enquiries", "new_clients", "google_reviews"], "digital-marketing": ["enquiries", "instagram_followers"],
  email: ["email_subscribers", "email_clicks"], "meta-ads": ["ad_leads", "new_clients", "ad_spend"],
  course: ["students_enrolled", "course_revenue", "enquiries"], hiring: ["visits", "revenue_collected"], finance: ["revenue_collected", "costs_total"],
};

const STARTERS: Record<string, string[]> = {
  pricing: ["Are my prices right for my numbers?", "How do I raise my prices?"],
  policies: ["Help me set my deposit and cancellation policy", "Write my no-show message"],
  retention: ["Look at my numbers. How do I improve my rebook rate?", "Give me rebooking scripts"],
  loyalty: ["Design a loyalty program for my salon", "What referral reward should I offer?"],
  retail: ["How do I sell more aftercare without being pushy?"],
  "local-marketing": ["Build my 4-week local marketing plan", "Do I need more clients or more rebooking?"],
  "digital-marketing": ["Plan a month of content for me", "Write my one-sentence offer message"],
  email: ["Plan my welcome email sequence"], "meta-ads": ["Am I ready for Meta ads?", "Help me write a campaign brief"],
  course: ["Am I ready to teach?", "Help me write my course outcomes"],
  hiring: ["Am I ready to hire?", "Plan a trial service for a new artist"], finance: ["What should I set aside for tax and GST?"],
};

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const { id } = await params;
  const p = await getProjectFull(u, id);
  if (!p) notFound(); // also covers another business's project ID

  const goalKeys = p.goals.map((g) => g.metricKey);
  const suggested = SUGGESTED_METRICS[p.category] ?? [];
  const periods = await businessPeriods(u);
  const step = PROGRAM.find((s) => s.key === p.stepKey);
  const profilePathway = (await getProfile(u))?.pathway ?? "";
  const relatedSteps = PROGRAM.filter((s) => s.projectCategory === p.category && s.key !== p.stepKey);
  const openTasks = p.tasks.filter((t) => t.status !== "done");

  return (
    <>
      <div className="row between">
        <div>
          <p className="small muted" style={{ margin: 0 }}><Link href="/projects">Projects</Link> / {PROJECT_CATEGORIES[p.category] ?? p.category}</p>
          <h1>{p.title} {p.status !== "active" && <span className="badge">{p.status}</span>}</h1>
          {p.goal && <p className="muted" style={{ margin: 0 }}>Goal: {p.goal}</p>}
        </div>
        <div className="row">
          <a className="btn ghost small" href={`/api/projects/${p.id}/export`}>Export</a>
          {p.status === "active" ? (
            <>
              <form action={setProjectStatus}><input type="hidden" name="projectId" value={p.id} /><input type="hidden" name="status" value="completed" /><button className="btn ghost small">Mark complete</button></form>
              <form action={setProjectStatus}><input type="hidden" name="projectId" value={p.id} /><input type="hidden" name="status" value="archived" /><button className="btn ghost small">Archive</button></form>
            </>
          ) : (
            <form action={setProjectStatus}><input type="hidden" name="projectId" value={p.id} /><input type="hidden" name="status" value="active" /><button className="btn ghost small">Reopen</button></form>
          )}
        </div>
      </div>

      {step && (
        <div className="card">
          <p className="small muted" style={{ margin: 0 }}>Program activity · {step.module}</p>
          <h2 style={{ marginTop: 4 }}>{step.title}</h2>
          <p><strong>What you&apos;ll do:</strong> {step.activity}</p>
          {STEP_WHY[step.key] && <p><strong>Why it matters:</strong> {STEP_WHY[step.key]}</p>}
          {step.measure.length > 0 && <p className="small"><strong>How you&apos;ll know it&apos;s working:</strong> {step.measure.map((k) => METRIC_BY_KEY[k]?.label).join(", ")}</p>}
          <p className="small muted" style={{ margin: 0 }}>
            {!p.intakeAt ? "Step 1: answer the questions below. Step 2: review the plan the coach builds. Step 3: add it to your project and work through it." : <Link href="/program">Back to My program</Link>}
          </p>
        </div>
      )}
      {!p.intakeAt && p.status === "active" && (
        <IntakeForm projectId={p.id} category={p.category} stepKey={p.stepKey} pathway={profilePathway} answers={parseIntake(p.intake)} defaults={await intakeDefaults(u, p)} />
      )}
      {p.planAnalysis && !p.planDraft && <PlanAnalysis raw={p.planAnalysis} />}
      {p.planDraft && <PlanReview projectId={p.id} plan={JSON.parse(p.planDraft) as PlanDraft} />}
      {p.intakeAt && !p.planDraft && p.status === "active" && (
        <details className="small" style={{ marginBottom: 10 }}><summary>Update my intake answers</summary>
          <IntakeForm projectId={p.id} category={p.category} stepKey={p.stepKey} pathway={profilePathway} answers={parseIntake(p.intake)} defaults={await intakeDefaults(u, p)} />
        </details>
      )}
      {(p.nextStep || p.messages.length > 0) && (
        <div className="card" style={{ borderColor: "var(--brand)" }}>
          <h3>Resume where you left off</h3>
          <p style={{ margin: 0 }}>{p.nextStep ? <>Next step: <strong>{p.nextStep}</strong></> : "No next step set yet. Add one below."}
            {openTasks.length > 0 && <> · {openTasks.length} open task{openTasks.length === 1 ? "" : "s"}</>}
            {" "}· last activity {p.lastActivityAt.toLocaleDateString("en-AU")}</p>
        </div>
      )}

      {/* Goals and results */}
      <div className="card">
        <h2>Goals and results</h2>
        <p className="small muted">Set a starting point and a target for the numbers this project should move, then log results as you go.</p>
        {p.goals.length === 0 && <p className="muted">No goals yet. Add one so progress can be measured.</p>}
        {p.goals.map((g) => {
          const m = METRIC_BY_KEY[g.metricKey];
          const results = p.metrics.filter((r) => r.metricKey === g.metricKey);
          const st = goalStatus(g, p.metrics, periods);
          const prog = st.progress;
          return (
            <div key={g.id} className="step progress">
              <div className="row between">
                <strong>{m?.label ?? g.metricKey}</strong>
                <form action={deleteGoal}><input type="hidden" name="id" value={g.id} /><input type="hidden" name="projectId" value={p.id} /><button className="btn link small">Remove goal</button></form>
              </div>
              <div className="grid g3 small" style={{ margin: "6px 0" }}>
                <div>Baseline: <strong>{formatValue(g.baselineValue, m?.unit ?? "number")}</strong> {g.baselineNote && <span className="muted">({g.baselineNote})</span>}</div>
                <div>Target: <strong>{formatValue(g.targetValue, m?.unit ?? "number")}</strong>{g.targetDate && <> by {nice(g.targetDate)}</>}</div>
                <div>Latest: <strong>{st.latest != null ? formatValue(st.latest, m?.unit ?? "number") : "No result yet"}</strong>{st.latestPeriodEnd && <span className="muted"> (to {nice(st.latestPeriodEnd)}, from {st.latestSource === "project" ? "this project" : "your monthly numbers"})</span>}</div>
              </div>
              {prog ? (
                <>
                  <div className="bar"><span style={{ width: `${Math.max(0, Math.min(100, prog.percent))}%` }} /></div>
                  <p className="small muted">{Math.round(prog.percent)}% of the way from baseline to target · remaining gap {formatValue(Math.abs(prog.remaining), m?.unit ?? "number")}{prog.remaining < 0 && m?.higherIsBetter ? " (target passed)" : ""}</p>
                </>
              ) : <p className="small muted">Progress shows once there's a starting point, a target and a newer result (logged here or in your monthly numbers).</p>}
              {results.length > 0 && (
                <details><summary>Results log ({results.length})</summary>
                  <table><tbody>{results.map((r) => (
                    <tr key={r.id}><td>{nice(r.periodStart)} – {nice(r.periodEnd)}</td><td>{formatValue(r.value, m?.unit ?? "number")}</td><td className="small muted">{r.source}{r.note && ` · ${r.note}`}</td>
                      <td><form action={removeMetric}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="projectId" value={p.id} /><button className="btn link small">Remove</button></form></td></tr>
                  ))}</tbody></table>
                </details>
              )}
            </div>
          );
        })}
        {p.goals.length > 0 && (
          <form action={reviewProgress} style={{ marginTop: 12 }}>
            <input type="hidden" name="projectId" value={p.id} />
            <button className="btn small">Ask the coach to review my progress</button>
            <span className="small muted" style={{ marginLeft: 8 }}>Log your latest result first. The coach compares it with your baseline and target and adjusts your plan.</span>
          </form>
        )}
        <div className="grid g2" style={{ marginTop: 14 }}>
          <details><summary>+ Add a goal</summary><GoalForm projectId={p.id} suggested={suggested} latestValues={periods[0]?.values ?? {}} latestLabel={periods[0] ? `period ending ${nice(periods[0].periodEnd)}` : ""} /></details>
          {p.goals.length > 0 && <details><summary>+ Log a result</summary><NumbersForm projectId={p.id} only={goalKeys} submit="Log result" /></details>}
        </div>
      </div>

      <div className="grid g2">
        {/* Tasks */}
        <div className="card">
          <h2>Action plan</h2>
          <ul className="tasks">
            {p.tasks.length === 0 && <li className="muted">No tasks yet.</li>}
            {p.tasks.map((t) => (
              <li key={t.id}>
                <div className="row between">
                  <form action={completeTask} className="row" style={{ gap: 8 }}>
                    <input type="hidden" name="taskId" value={t.id} />
                    <button className={`tick${t.status === "done" ? " on" : ""}`} title={t.status === "done" ? "Mark not done" : "Mark done"} aria-label={t.status === "done" ? "Mark not done" : "Mark done"}>✓</button>
                    <span className={t.status === "done" ? "done" : ""}>{t.title}</span>
                    {t.isPriority && <span className="badge">priority</span>}
                    {t.dueDate && t.status !== "done" && <span className={`badge ${t.dueDate < new Date() ? "bad" : ""}`}>due {nice(t.dueDate)}</span>}
                  </form>
                </div>
                {t.detail && t.status !== "done" && <details style={{ marginLeft: 28 }}><summary className="small">How to do this</summary><p className="small pre" style={{ margin: "4px 0" }}>{t.detail}</p></details>}
                {t.outcome && <p className="small muted" style={{ margin: "4px 0 0 28px" }}>Outcome: {t.outcome}</p>}
                <details style={{ marginLeft: 28 }}><summary className="small">Edit / record outcome</summary>
                  <form action={updateTask}>
                    <input type="hidden" name="taskId" value={t.id} />
                    <label>Due date<input type="date" name="dueDate" defaultValue={iso(t.dueDate)} /></label>
                    <label>What happened? <span className="hint">(the result of doing this)</span><input name="outcome" defaultValue={t.outcome} /></label>
                    <label style={{ fontWeight: 400 }}><input type="checkbox" name="isPriority" defaultChecked={t.isPriority} /> Priority this week</label>
                    <div className="row"><button className="btn small">Save</button></div>
                  </form>
                  <form action={deleteTask}><input type="hidden" name="taskId" value={t.id} /><button className="btn link small">Delete task</button></form>
                </details>
              </li>
            ))}
          </ul>
          <form action={addTask} style={{ marginTop: 10 }}>
            <input type="hidden" name="projectId" value={p.id} />
            <div className="row"><input name="title" placeholder="Add a task" required style={{ flex: 2, minWidth: 180 }} /><input type="date" name="dueDate" style={{ flex: 1, minWidth: 140 }} /><button className="btn small">Add</button></div>
          </form>
        </div>

        {/* Project details & decisions */}
        <div className="card">
          <h2>Project details</h2>
          <ActionForm action={updateProject} submit="Save details">
            <input type="hidden" name="projectId" value={p.id} />
            <label>Name<input name="title" defaultValue={p.title} /></label>
            <label>Goal<input name="goal" defaultValue={p.goal} /></label>
            <div className="grid g2">
              <label>Stage<input name="stage" defaultValue={p.stage} /></label>
              <label>Target date<input type="date" name="targetDate" defaultValue={iso(p.targetDate)} /></label>
            </div>
            <label>Next step<input name="nextStep" defaultValue={p.nextStep} /></label>
            <label>Project budget <span className="hint">(only for this project; your business budget is unchanged)</span><input name="budget" defaultValue={p.budget} /></label>
            <label>Summary <span className="hint">(what the coach should remember about this project)</span><textarea name="summary" defaultValue={p.summary} /></label>
          </ActionForm>
          <h3 style={{ marginTop: 18 }}>Decisions</h3>
          {p.decisions.length === 0 && <p className="small muted">Agreed decisions you save appear here, and the coach remembers them.</p>}
          <ul className="tasks">{p.decisions.map((d) => (
            <li key={d.id} className="row between"><span>{d.text} <span className="small muted">({d.createdAt.toLocaleDateString("en-AU")})</span></span>
              <form action={deleteDecision}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="projectId" value={p.id} /><button className="btn link small">Remove</button></form></li>
          ))}</ul>
          <form action={saveDecision} className="row" style={{ marginTop: 8 }}>
            <input type="hidden" name="projectId" value={p.id} />
            <input name="text" placeholder="Record a decision" required style={{ flex: 1 }} /><button className="btn small">Save</button>
          </form>
        </div>
      </div>

      {/* Coach chat */}
      <div className="card" id="coach">
        <h2>Coach</h2>
        <p className="small muted">This chat belongs to this project only. The coach reads your business profile, your lodged numbers and this project&apos;s goals, tasks and decisions. It&apos;s AI, so check important advice. Nothing is saved from an answer unless you save it.</p>
        <MessageList projectId={p.id} messages={p.messages} />
        <div style={{ marginTop: 14 }}><ChatInput projectId={p.id} suggestions={p.messages.length === 0 ? STARTERS[p.category] ?? ["What should I focus on first?"] : []} /></div>
      </div>

      {relatedSteps.length > 0 && (
        <div className="card">
          <h3>Program activities linked to this project</h3>
          <ul>{relatedSteps.map((s) => <li key={s.key}><strong>{s.title}</strong>: <span className="muted">{s.activity}</span></li>)}</ul>
          <Link href="/program" className="small">Update your program progress →</Link>
        </div>
      )}

      {p.resources.length > 0 && (
        <div className="card"><h3>Saved resources</h3>
          <ul>{p.resources.map((r) => <li key={r.id}><Link href={`/resources/${r.id}`}>{r.title}</Link> <span className="badge">{r.status}</span></li>)}</ul>
        </div>
      )}
    </>
  );
}
