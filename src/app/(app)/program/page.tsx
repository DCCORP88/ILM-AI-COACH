import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getProfile, businessPeriods } from "@/lib/data";
import { programSections, PATHWAYS, STEP_WHY, type Pathway } from "@/lib/program";
import { METRIC_BY_KEY, formatValue } from "@/lib/metrics";
import { setPathway, setStepStatus, startStep } from "@/app/actions";
import { getNextStep } from "@/lib/nextstep";
import { NextStepCard } from "@/components/NextStep";

export default async function Program() {
  const u = await requireUser();
  const profile = await getProfile(u);
  const pathway = (profile?.pathway ?? "solo") as Pathway;
  const others = (profile?.otherPathways ?? "").split(",").filter(Boolean);
  const sections = programSections(pathway, profile?.otherPathways ?? "");
  const steps = sections.flatMap((s) => s.steps);
  const progress = await db.programStep.findMany({ where: { businessId: u.businessId } });
  const byKey = Object.fromEntries(progress.map((p) => [p.stepKey, p]));
  const projects = await db.project.findMany({ where: { businessId: u.businessId, stepKey: { not: "" }, status: { not: "chat" } }, select: { id: true, stepKey: true }, orderBy: { createdAt: "asc" } });
  const linked: Record<string, string> = Object.fromEntries(projects.map((p) => [p.stepKey, p.id]));
  const latest = (await businessPeriods(u))[0];
  const doneCount = steps.filter((s) => byKey[s.key]?.status === "done").length;
  return (
    <>
      <h1>My program</h1>
      <p className="muted">Work through these activities in order. Press <strong>Start</strong> and the coach asks you a few questions, then builds a plan tailored to you. Each activity comes with a number that shows whether it&apos;s working. Finishing an activity is training progress; your lodged numbers show the business result.</p>
      <NextStepCard step={await getNextStep(u)} />
      <div className="notice warn small">Program activities are drafted from Deanna&apos;s methods and are waiting for her final review and curriculum.</div>
      <div className="card">
        <h2>Your programs</h2>
        <p className="small muted">Your main program comes first. Add another program to follow both (for example, a salon owner who wants to start teaching). Switching never deletes your progress, projects or numbers, and activities you&apos;ve finished stay done.</p>
        <div className="grid g3">
          {(Object.keys(PATHWAYS) as Pathway[]).map((pw) => {
            const isMain = pw === pathway;
            const isExtra = others.includes(pw);
            return (
              <div key={pw} style={{ border: `1px solid ${isMain ? "var(--accent)" : "var(--line)"}`, borderRadius: 4, padding: 12 }}>
                <div className="row between"><strong>{PATHWAYS[pw].label}</strong>{isMain ? <span className="badge">Main</span> : isExtra ? <span className="badge ok">Also following</span> : null}</div>
                <p className="small muted" style={{ margin: "6px 0 10px" }}>{PATHWAYS[pw].description}</p>
                {!isMain && (
                  <div className="row">
                    <form action={setPathway}>
                      <input type="hidden" name="pathway" value={pw} /><input type="hidden" name="mode" value="main" /><input type="hidden" name="keepOld" value="on" />
                      <button className="btn small">Make this my main program</button>
                    </form>
                    <form action={setPathway}>
                      <input type="hidden" name="pathway" value={pw} /><input type="hidden" name="mode" value={isExtra ? "remove" : "add"} />
                      <button className="btn ghost small">{isExtra ? "Stop following" : "Also follow"}</button>
                    </form>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>&quot;Make this my main program&quot; keeps your current program as an extra, so nothing disappears. Remove it with &quot;Stop following&quot; if you don&apos;t want it.</p>
      </div>
      <div className="card">
        <div className="row between"><strong>{doneCount} of {steps.length} activities done</strong></div>
        <div className="bar" style={{ marginTop: 8 }}><span style={{ width: `${steps.length ? (doneCount / steps.length) * 100 : 0}%` }} /></div>
      </div>
      {sections.map((sec) => (
        <section key={sec.pathway}>
        <h2 style={{ marginTop: 24 }}>{sec.main ? `${PATHWAYS[sec.pathway].label} program` : `Also: ${PATHWAYS[sec.pathway].label}`}</h2>
        {!sec.main && <p className="small muted">Extra activities from this program that aren&apos;t already in your main one.</p>}
      {[...new Set(sec.steps.map((s) => s.module))].map((mod) => (
        <div className="card" key={sec.pathway + mod}>
          <h2>{mod}</h2>
          {sec.steps.filter((s) => s.module === mod).map((s) => {
            const st = byKey[s.key]?.status ?? "not-started";
            return (
              <div key={s.key} className={`step ${st === "done" ? "done-step" : st === "in-progress" ? "progress" : ""}`}>
                <div className="row between">
                  <h3 style={{ margin: 0 }}>{s.title}</h3>
                  <span className={`badge ${st === "done" ? "ok" : st === "in-progress" ? "" : "warn"}`}>{st.replace("-", " ")}</span>
                </div>
                <p>{s.activity}</p>
                {STEP_WHY[s.key] && <p className="small muted"><strong>Why it matters:</strong> {STEP_WHY[s.key]}</p>}
                {s.measure.length > 0 && (
                  <p className="small">Measure: {s.measure.map((k) => (
                    <span key={k} style={{ marginRight: 10 }}>{METRIC_BY_KEY[k]?.label}: <strong>{latest ? formatValue(latest.values[k], METRIC_BY_KEY[k].unit) : "Add data"}</strong></span>
                  ))}</p>
                )}
                <div className="row">
                  {st === "done" ? (
                    <>
                      {linked[s.key] && <Link className="btn ghost small" href={`/projects/${linked[s.key]}`}>Open project</Link>}
                      <form action={setStepStatus}><input type="hidden" name="stepKey" value={s.key} /><input type="hidden" name="status" value="in-progress" /><button className="btn link small">Reopen</button></form>
                    </>
                  ) : (
                    <>
                      <form action={startStep}><input type="hidden" name="stepKey" value={s.key} /><button className="btn small">{st === "in-progress" ? "Continue" : "Start"}</button></form>
                      {st === "in-progress" && <form action={setStepStatus}><input type="hidden" name="stepKey" value={s.key} /><input type="hidden" name="status" value="done" /><button className="btn ghost small">Mark done</button></form>}
                    </>
                  )}
                </div>
                {st === "not-started" && <p className="small muted" style={{ marginTop: 6 }}>{s.projectCategory ? "Start opens a few questions about your business, then the coach builds your tailored plan for this activity." : `Start takes you to ${s.tool?.label ?? "the right page"}.`}</p>}
              </div>
            );
          })}
        </div>
      ))}
        </section>
      ))}
    </>
  );
}
