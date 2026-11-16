// Works out the ONE thing a customer should do next, so the program is never confusing.
// Used by the dashboard card and by accountability reminders.
import { db } from "./db";
import { businessPeriods, type Scope } from "./data";
import { fullProgram } from "./program";
import { goalStatus } from "./goals";
import { METRIC_BY_KEY } from "./metrics";

export type NextStep = {
  kind: "onboarding" | "numbers" | "goal-result" | "intake" | "plan-review" | "overdue" | "checkin" | "monthly-numbers" | "program" | "today-task" | "all-done";
  title: string;
  why: string;
  cta: string;
  href?: string;          // link target
  startStepKey?: string;  // when set, the button starts this program activity
};

const DAY = 86400_000;

export async function getNextStep(s: Scope, now = new Date()): Promise<NextStep> {
  const profile = await db.businessProfile.findUnique({ where: { businessId: s.businessId } });
  if (!profile?.onboardedAt) {
    return { kind: "onboarding", title: "Tell the coach about your business", why: "About 5 minutes. The coach uses this so it never asks you the same thing twice.", cta: "Start onboarding", href: "/onboarding" };
  }
  const periods = await businessPeriods(s);
  if (periods.length === 0) {
    return { kind: "numbers", title: "Lodge your starting numbers", why: "Your baseline. Every result is measured against it, and the coach bases its advice on it.", cta: "Add my numbers", href: "/numbers" };
  }

  const projects = await db.project.findMany({ where: { businessId: s.businessId, status: "active" }, orderBy: { lastActivityAt: "desc" } });
  const needsPlanReview = projects.find((p) => p.planDraft);
  if (needsPlanReview) {
    return { kind: "plan-review", title: `Review your plan: ${needsPlanReview.title}`, why: "Your coach has built a tailored plan. Check the targets, tick what you'll do, and add it to your project.", cta: "Review my plan", href: `/projects/${needsPlanReview.id}#plan` };
  }
  const needsIntake = projects.find((p) => !p.intakeAt);
  if (needsIntake) {
    return { kind: "intake", title: `Answer the questions for: ${needsIntake.title}`, why: "A few questions about your business, then the coach builds a plan just for you.", cta: "Answer the questions", href: `/projects/${needsIntake.id}#intake` };
  }

  const open = await db.task.findMany({ where: { businessId: s.businessId, status: "todo" }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }], include: { project: { select: { id: true, title: true } } } });
  const overdue = open.filter((t) => t.dueDate && t.dueDate < now);
  if (overdue.length) {
    const t = overdue[0];
    return { kind: "overdue", title: overdue.length === 1 ? `Overdue: ${t.title}` : `${overdue.length} tasks are overdue. Start with: ${t.title}`, why: "Do it, or move the due date to something realistic. Either way, record what happened.", cta: "Open the task", href: t.project ? `/projects/${t.project.id}` : "/dashboard" };
  }

  const lastCheckIn = await db.checkIn.findFirst({ where: { businessId: s.businessId }, orderBy: { createdAt: "desc" } });
  if (!lastCheckIn || now.getTime() - lastCheckIn.createdAt.getTime() > 7 * DAY) {
    return { kind: "checkin", title: "Do your weekly check-in", why: "Five minutes: what you did, what got in the way, and your top 3 for next week.", cta: "Start check-in", href: "/checkin" };
  }

  const latestEnd = periods[0].periodEnd;
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)); // last day of previous month
  if (latestEnd < monthEnd && now.getTime() - monthEnd.getTime() > 2 * DAY) {
    return { kind: "monthly-numbers", title: "Lodge last month's numbers", why: "This is how you and your coach see whether your actions are moving your results.", cta: "Add my numbers", href: "/numbers" };
  }

  // A goal with no result for over 5 weeks: prompt to log one so progress stays visible.
  const goalRows = await db.goal.findMany({ where: { businessId: s.businessId, project: { status: "active" } }, include: { project: { include: { metrics: true } } } });
  for (const g of goalRows) {
    const st = goalStatus(g, g.project.metrics, periods, now);
    if (st.stale && now.getTime() - g.createdAt.getTime() > 28 * DAY) {
      return { kind: "goal-result", title: `Log your latest ${METRIC_BY_KEY[g.metricKey]?.label.toLowerCase() ?? "result"}`, why: `So you can see your progress on "${g.project.title}". It takes a minute, and your coach uses it to adjust your plan.`, cta: "Log my result", href: `/projects/${g.projectId}` };
    }
  }

  const dueSoon = open.find((t) => t.dueDate && t.dueDate.getTime() - now.getTime() < 3 * DAY);
  if (dueSoon) {
    return { kind: "today-task", title: `Due soon: ${dueSoon.title}`, why: dueSoon.project ? `Part of your project "${dueSoon.project.title}".` : "One of this week's priorities.", cta: "Open the task", href: dueSoon.project ? `/projects/${dueSoon.project.id}` : "/dashboard" };
  }

  const steps = await db.programStep.findMany({ where: { businessId: s.businessId } });
  const status = (k: string) => steps.find((x) => x.stepKey === k)?.status ?? "not-started";
  const program = fullProgram(profile.pathway, profile.otherPathways).filter((st) => st.key !== "baseline");
  const inProgress = program.find((st) => status(st.key) === "in-progress");
  if (inProgress && open.length === 0) {
    return { kind: "program", title: `Finish: ${inProgress.title}`, why: "All your tasks are done. Log your result, then mark this activity done or ask the coach what's next.", cta: "Continue", startStepKey: inProgress.key };
  }
  if (open.length) {
    const t = open[0];
    return { kind: "today-task", title: `Keep going: ${t.title}`, why: t.project ? `Next task in "${t.project.title}".` : "Next task on your list.", cta: "Open the task", href: t.project ? `/projects/${t.project.id}` : "/dashboard" };
  }
  const next = program.find((st) => status(st.key) === "not-started");
  if (next) {
    return { kind: "program", title: `Start your next activity: ${next.title}`, why: next.activity, cta: "Start", startStepKey: next.key };
  }
  return { kind: "all-done", title: "You've worked through your program", why: "Keep lodging your numbers monthly and doing your weekly check-in. Ask the coach where to focus next.", cta: "Ask the coach", href: "/chat" };
}
