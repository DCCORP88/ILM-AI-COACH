import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { businessPeriods, getProfile } from "@/lib/data";
import { deriveMetrics, formatValue, METRIC_BY_KEY } from "@/lib/metrics";
import { PATHWAYS, fullProgram, PROJECT_CATEGORIES, type Pathway } from "@/lib/program";
import { goalStatus } from "@/lib/goals";
import { completeTask } from "@/app/actions";
import { getNextStep } from "@/lib/nextstep";
import { HowItWorks, NextStepCard, stageFor } from "@/components/NextStep";
import { ProgressRing } from "@/components/ProgressRing";
import { BusinessGlance } from "@/components/BusinessGlance";
import { TREND_DEFS, type Range, type TrendKey } from "@/lib/trends";

const greeting = (d: Date) => { const h = Number(d.toLocaleString("en-AU", { hour: "numeric", hour12: false, timeZone: "Australia/Melbourne" })); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };
const nice = (d: Date) => d.toLocaleDateString("en-AU", { day: "numeric", month: "short", timeZone: "UTC" });
const KEY_NUMBERS = ["revenue_collected", "new_clients"];
const MORE_NUMBERS = ["visits", "returning_clients"];

function Section({ n, title, action, children }: { n: number; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="card">
      <div className="row between" style={{ marginBottom: 8 }}>
        <h2 className="section-title"><span className="num">{n}</span>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Change({ cur, prev }: { cur?: number | null; prev?: number | null }) {
  if (cur == null || prev == null || prev === 0) return null;
  const c = ((cur - prev) / Math.abs(prev)) * 100;
  return <div className="small" style={{ color: c >= 0 ? "var(--ok)" : "var(--bad)" }}>{c >= 0 ? "▲" : "▼"} {Math.abs(c).toFixed(1)}% vs previous</div>;
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ range?: string; metric?: string }> }) {
  const sp = await searchParams;
  const range: Range = (["1", "3", "6", "12", "all"] as const).includes(sp.range as Range) ? (sp.range as Range) : "3";
  const metric: TrendKey = sp.metric && sp.metric in TREND_DEFS ? (sp.metric as TrendKey) : "revenue_collected";
  const u = await requireUser();
  const profile = await getProfile(u);
  if (!profile?.onboardedAt) redirect("/onboarding");
  const now = new Date();
  const [periods, projects, openTasks, steps, lastCheckIn, next] = await Promise.all([
    businessPeriods(u),
    db.project.findMany({ where: { businessId: u.businessId, status: "active" }, orderBy: { lastActivityAt: "desc" }, include: { tasks: { select: { status: true } }, goals: true, metrics: true } }),
    db.task.findMany({ where: { businessId: u.businessId, status: "todo" }, orderBy: [{ isPriority: "desc" }, { dueDate: "asc" }, { createdAt: "asc" }], include: { project: { select: { id: true, title: true } } } }),
    db.programStep.findMany({ where: { businessId: u.businessId } }),
    db.checkIn.findFirst({ where: { businessId: u.businessId }, orderBy: { createdAt: "desc" } }),
    getNextStep(u, now),
  ]);
  const [latest, previous] = periods;
  const dLatest = latest ? deriveMetrics(latest.values) : [];
  const dPrev = previous ? deriveMetrics(previous.values) : [];
  const overdue = openTasks.filter((t) => t.dueDate && t.dueDate < now);
  const program = fullProgram(profile.pathway, profile.otherPathways);
  const done = program.filter((s) => steps.find((x) => x.stepKey === s.key && x.status === "done")).length;
  const upNext = program.find((s) => !steps.find((x) => x.stepKey === s.key && x.status === "done"));
  const checkInDue = !lastCheckIn || now.getTime() - lastCheckIn.createdAt.getTime() > 6 * 86400_000;
  const stale = latest && now.getTime() - latest.periodEnd.getTime() > 45 * 86400_000;
  const goals = projects.flatMap((p) => p.goals.map((g) => ({ g, p, st: goalStatus(g, p.metrics, periods, now) })));
  const stage = stageFor(next);
  const pathways = [profile.pathway, ...profile.otherPathways.split(",").filter(Boolean)].map((p) => PATHWAYS[p as Pathway]?.label).filter(Boolean).join(" + ");

  return (
    <>
      <div className="welcome">
        <div className="eyebrow">{now.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}</div>
        <h1 className="display">{greeting(now)}, {u.businessName}</h1>
        <p className="muted" style={{ margin: 0 }}>{pathways}{profile.primaryGoal && <> · <strong style={{ color: "var(--ink)" }}>Your goal:</strong> {profile.primaryGoal}</>}{!profile.primaryGoal && <> · <Link href="/profile">Set your 90-day goal</Link></>}</p>
      </div>

      {/* 1. Business at a glance (top of the page) */}
      <div id="numbers" /><Section n={1} title="Your business at a glance" action={<Link className="btn ghost small" href="/numbers">Add / update</Link>}>
        {!latest ? (
          <p className="muted">No numbers yet. <Link href="/numbers">Add data</Link> so your coach can base its advice on your real figures.</p>
        ) : (
          <>
                        {stale && <div className="notice warn small">These numbers are over 45 days old. Lodge your latest month.</div>}
            <BusinessGlance periods={periods} range={range} metric={metric} />
            <details style={{ marginTop: 12 }}>
              <summary>See all your numbers</summary>
              <div className="grid g3" style={{ marginTop: 10, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
                {MORE_NUMBERS.map((k) => (
                  <div key={k} title={METRIC_BY_KEY[k].definition}>
                    <div className="stat-label">{METRIC_BY_KEY[k].label}</div>
                    <div className={latest.values[k] == null ? "stat empty" : "stat"}>{formatValue(latest.values[k], METRIC_BY_KEY[k].unit)}</div>
                    <Change cur={latest.values[k]} prev={previous?.values[k]} />
                  </div>
                ))}
                {["utilisation", "profit"].map((k) => {
                  const d = dLatest.find((x) => x.key === k)!;
                  return (
                    <div key={k} title={d.formula}>
                      <div className="stat-label">{d.label}</div>
                      <div className={d.value == null ? "stat empty" : "stat"}>{d.value == null ? "Not enough data" : formatValue(d.value, d.unit)}</div>
                      <div className="small muted">{d.value == null ? `Needs: ${d.missing.join(", ")}` : d.formula}</div>
                    </div>
                  );
                })}
              </div>
              <p className="small muted">Source: {[...new Set(Object.values(latest.sources))].join(", ")} · updated {latest.updatedAt.toLocaleDateString("en-AU")}. Revenue collected is money received. It isn&apos;t booked revenue and it isn&apos;t profit. Profit shows when you lodge total costs (including your own wage). <Link href="/numbers">Full history →</Link></p>
            </details>
          </>
        )}
      </Section>

      {/* The one thing to do now */}
      <NextStepCard step={next} />
      {stage <= 2 && <HowItWorks current={stage} />}

      {/* 2. This week */}
      <Section n={2} title="This week" action={<Link className={checkInDue ? "btn small" : "btn ghost small"} href="/checkin">{checkInDue ? "Weekly check-in due" : "Weekly check-in"}</Link>}>
        {overdue.length > 0 && <div className="notice err small">{overdue.length} task{overdue.length === 1 ? " is" : "s are"} overdue. Tick them off or move the date.</div>}
        {openTasks.length === 0 ? (
          <p className="muted">Nothing on your list yet. Start an activity in <Link href="/program">My program</Link> and your coach will build your tasks.</p>
        ) : (
          <ul className="tasks">
            {openTasks.slice(0, 5).map((t) => (
              <li key={t.id} className="row between">
                <form action={completeTask} className="row" style={{ gap: 10, flex: 1, minWidth: 0, flexWrap: "nowrap", alignItems: "flex-start" }}>
                  <input type="hidden" name="taskId" value={t.id} />
                  <button className="tick" title="Mark done" aria-label={`Mark "${t.title}" done`}>✓</button>
                  <span style={{ minWidth: 0 }}>{t.title}{t.project && <Link href={`/projects/${t.project.id}`} className="small muted" style={{ display: "block" }}>{t.project.title}</Link>}</span>
                </form>
                {t.dueDate && <span className={`badge ${t.dueDate < now ? "bad" : ""}`}>{t.dueDate < now ? "overdue · " : "due "}{nice(t.dueDate)}</span>}
              </li>
            ))}
          </ul>
        )}
        {openTasks.length > 5 && <p className="small muted">+ {openTasks.length - 5} more in your projects.</p>}
        {lastCheckIn && <p className="small muted" style={{ marginBottom: 0 }}>Last check-in: {lastCheckIn.createdAt.toLocaleDateString("en-AU")}</p>}
      </Section>

      {/* 3. Progress */}
      <Section n={3} title="Your progress" action={<Link className="btn ghost small" href="/program">My program</Link>}>
        <div className="row" style={{ gap: 18, alignItems: "center", marginBottom: 14, flexWrap: "nowrap" }}>
          <ProgressRing value={done} total={program.length} label="done" />
          <div style={{ minWidth: 0 }}>
            <div className="stat-label">Program activities</div>
            <div><strong>{done} of {program.length} done</strong></div>
            {upNext && <div className="small">Up next: <strong>{upNext.title}</strong></div>}
          </div>
        </div>
        <div className="stat-label" style={{ marginTop: 6 }}>Goals</div>
        {goals.length === 0 ? (
          <p className="small muted">No goals yet. When your coach builds a plan, you&apos;ll set goals like &quot;rebook rate 58% → 75%&quot; and track them here.</p>
        ) : goals.map(({ g, p, st }) => {
          const m = METRIC_BY_KEY[g.metricKey];
          return (
            <div key={g.id} style={{ margin: "8px 0" }}>
              <div className="row between">
                <span><strong>{m?.label}</strong>: {formatValue(g.baselineValue, m?.unit ?? "number")} → {formatValue(g.targetValue, m?.unit ?? "number")}{g.targetDate && <span className="small muted"> by {nice(g.targetDate)}</span>}</span>
                <Link href={`/projects/${p.id}`} className="small">{p.title}</Link>
              </div>
              {st.progress ? (
                <>
                  <div className="bar" style={{ marginTop: 4 }}><span style={{ width: `${Math.max(0, Math.min(100, st.progress.percent))}%` }} /></div>
                  <div className="small muted">Now {formatValue(st.latest, m?.unit ?? "number")} · {Math.round(st.progress.percent)}% of the way</div>
                </>
              ) : <div className="small muted">{st.stale ? "Log your latest result to see progress." : "Progress shows after your next result."}</div>}
            </div>
          );
        })}
      </Section>

      {/* 4. Projects */}
      <Section n={4} title="Your projects" action={<Link className="btn ghost small" href="/projects#new">New project</Link>}>
        {projects.length === 0 ? <p className="muted">No active projects yet. Pressing Start on a program activity creates one.</p> : (
          <div className="grid g2">
            {projects.slice(0, 8).map((p) => {
              const d = p.tasks.filter((t) => t.status === "done").length;
              return (
                <Link key={p.id} href={`/projects/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="tile">
                    <div className="small muted">{PROJECT_CATEGORIES[p.category] ?? p.category} · {p.stage}</div>
                    <strong>{p.title}</strong>
                    <p className="small" style={{ margin: "6px 0" }}>Next: {p.nextStep || <span className="muted">not set</span>}</p>
                    {p.tasks.length > 0 && <div className="bar"><span style={{ width: `${(d / p.tasks.length) * 100}%` }} /></div>}
                    <div className="small muted" style={{ marginTop: 4 }}>{p.tasks.length ? `${d}/${p.tasks.length} tasks done · ` : ""}last activity {p.lastActivityAt.toLocaleDateString("en-AU")}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        {projects.length > 8 && <p className="small"><Link href="/projects">See all projects →</Link></p>}
      </Section>

      {stage > 2 && <HowItWorks current={stage} />}
    </>
  );
}
