"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { createSession, destroySession, requireUser } from "@/lib/auth";
import { hashPassword, hashToken, newToken, verifyPassword } from "@/lib/password";
import { coachReply } from "@/lib/coach";
import { parseNumber } from "@/lib/calc";
import { METRIC_BY_KEY } from "@/lib/metrics";
import { PROGRAM } from "@/lib/program";
import { generatePlan, parseIntake, type PlanDraft } from "@/lib/plan";
import { intakeFor, outlineToMarkdown } from "@/lib/intake";
import { deliverReminder, validMobile } from "@/lib/reminders";
import { isAdmin } from "@/lib/admin";
import { checkAllowance, recordUsage } from "@/lib/usage";
import { addResourceVersion, businessPeriods, createResource, deleteMetric, getProject, getResource, getTask, touchProject, upsertMetric } from "@/lib/data";

const str = (f: FormData, k: string, max = 5000) => String(f.get(k) ?? "").trim().slice(0, max);
const dateOrNull = (v: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
};

export type FormState = { error?: string; ok?: string } | undefined;

// ---------- Accounts ----------
export async function signup(_: FormState, f: FormData): Promise<FormState> {
  const email = str(f, "email", 200).toLowerCase();
  const password = String(f.get("password") ?? "");
  const businessName = str(f, "businessName", 120);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 10) return { error: "Use a password of at least 10 characters." };
  if (!businessName) return { error: "Enter your business name." };
  const invite = (process.env.SIGNUP_INVITE_CODE ?? "").trim();
  if (invite && str(f, "invite", 100).toLowerCase() !== invite.toLowerCase()) return { error: "That invite code isn't right. Check the message you were sent." };
  if (await db.user.findUnique({ where: { email } })) return { error: "An account with that email already exists. Log in instead." };
  const business = await db.business.create({ data: { name: businessName } });
  const user = await db.user.create({ data: { email, passwordHash: hashPassword(password), businessId: business.id } });
  await createSession(user.id);
  redirect("/onboarding");
}

export async function login(_: FormState, f: FormData): Promise<FormState> {
  const email = str(f, "email", 200).toLowerCase();
  const password = String(f.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) return { error: "Email or password is incorrect." };
  await createSession(user.id);
  const profile = await db.businessProfile.findUnique({ where: { businessId: user.businessId } });
  redirect(profile?.onboardedAt ? "/dashboard" : "/onboarding");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

// ---------- Onboarding & profile ----------
export async function saveProfile(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireUser();
  const pathway = str(f, "pathway", 20);
  if (!["solo", "educator", "salon"].includes(pathway)) return { error: "Choose your main pathway." };
  const data = {
    pathway,
    otherPathways: f.getAll("otherPathways").map(String).filter((p) => p !== pathway).join(","),
    stage: str(f, "stage", 200),
    services: str(f, "services", 1000),
    location: str(f, "location", 200),
    jurisdiction: str(f, "jurisdiction", 100),
    teamSize: str(f, "teamSize", 50),
    capacityPerWeek: str(f, "capacityPerWeek", 50),
    hoursPerWeek: str(f, "hoursPerWeek", 50),
    marketingBudget: str(f, "marketingBudget", 50),
    primaryGoal: str(f, "primaryGoal", 500),
    preferences: str(f, "preferences", 1000),
  };
  const existing = await db.businessProfile.findUnique({ where: { businessId: u.businessId } });
  await db.businessProfile.upsert({
    where: { businessId: u.businessId },
    create: { businessId: u.businessId, ...data, onboardedAt: new Date() },
    update: { ...data, onboardedAt: existing?.onboardedAt ?? new Date() },
  });
  revalidatePath("/", "layout");
  if (f.get("from") === "onboarding") redirect("/numbers?welcome=1");
  return { ok: "Profile saved." };
}

// ---------- Numbers ----------
export async function saveNumbers(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireUser();
  const start = dateOrNull(str(f, "periodStart"));
  const end = dateOrNull(str(f, "periodEnd"));
  if (!start || !end) return { error: "Choose the start and end dates for this period." };
  if (end < start) return { error: "The period end must be after the start." };
  const projectId = str(f, "projectId") || null;
  let saved = 0;
  const bad: string[] = [];
  for (const [key, raw] of f.entries()) {
    if (!key.startsWith("m_")) continue;
    const metricKey = key.slice(2);
    if (!METRIC_BY_KEY[metricKey] || String(raw).trim() === "") continue;
    const value = parseNumber(String(raw));
    if (value == null || value < 0) { bad.push(METRIC_BY_KEY[metricKey].label); continue; }
    if (METRIC_BY_KEY[metricKey].unit === "percent" && value > 100) { bad.push(METRIC_BY_KEY[metricKey].label); continue; }
    try {
      await upsertMetric(u, { metricKey, periodStart: start, periodEnd: end, value, projectId, source: str(f, "source", 100) || "Manual entry", note: str(f, "note", 500) });
      saved++;
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Could not save numbers." };
    }
  }
  if (projectId) await touchProject(u, projectId);
  revalidatePath("/numbers"); revalidatePath("/dashboard");
  if (projectId) revalidatePath(`/projects/${projectId}`);
  if (bad.length) return { error: `Saved ${saved}. Not saved (must be a number${bad.length ? ", percentages 0–100" : ""}): ${bad.join(", ")}.` };
  if (saved === 0) return { error: "No numbers entered. Fill in at least one box." };
  return { ok: `Saved ${saved} number${saved === 1 ? "" : "s"}. Re-entering the same period updates it rather than duplicating.` };
}

export async function removeMetric(f: FormData) {
  const u = await requireUser();
  await deleteMetric(u, str(f, "id"));
  revalidatePath("/numbers"); revalidatePath("/dashboard");
  const p = str(f, "projectId"); if (p) revalidatePath(`/projects/${p}`);
}

// ---------- Projects ----------
export async function createProject(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireUser();
  const title = str(f, "title", 150);
  if (!title) return { error: "Give the project a name." };
  const profile = await db.businessProfile.findUnique({ where: { businessId: u.businessId } });
  const p = await db.project.create({
    data: {
      stepKey: PROGRAM.some((s) => s.key === str(f, "stepKey", 60)) ? str(f, "stepKey", 60) : "",
      businessId: u.businessId, title,
      category: str(f, "category", 40) || "other",
      goal: str(f, "goal", 500),
      pathway: profile?.pathway ?? "",
      targetDate: dateOrNull(str(f, "targetDate")),
      nextStep: str(f, "nextStep", 300),
    },
  });
  const stepKey = str(f, "stepKey", 60);
  if (stepKey && PROGRAM.some((s) => s.key === stepKey)) {
    await db.programStep.upsert({
      where: { businessId_stepKey: { businessId: u.businessId, stepKey } },
      create: { businessId: u.businessId, stepKey, status: "in-progress" },
      update: { status: "in-progress" },
    });
  }
  redirect(`/projects/${p.id}`);
}

export async function updateProject(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireUser();
  const id = str(f, "projectId");
  if (!(await getProject(u, id))) return { error: "Project not found." };
  await db.project.update({
    where: { id },
    data: {
      title: str(f, "title", 150) || "Untitled project",
      goal: str(f, "goal", 500),
      stage: str(f, "stage", 100),
      summary: str(f, "summary", 4000),
      nextStep: str(f, "nextStep", 300),
      budget: str(f, "budget", 100),
      targetDate: dateOrNull(str(f, "targetDate")),
      lastActivityAt: new Date(),
    },
  });
  revalidatePath(`/projects/${id}`);
  return { ok: "Saved." };
}

export async function setProjectStatus(f: FormData) {
  const u = await requireUser();
  const id = str(f, "projectId");
  const status = str(f, "status");
  if (!["active", "archived", "completed"].includes(status)) return;
  await db.project.updateMany({ where: { id, businessId: u.businessId }, data: { status } });
  revalidatePath("/projects"); revalidatePath(`/projects/${id}`); revalidatePath("/dashboard");
}

// ---------- Coach chat ----------
export async function sendMessage(projectId: string, text: string): Promise<{ error?: string }> {
  const u = await requireUser();
  const message = text.trim().slice(0, 8000);
  if (!message) return { error: "Type a message first." };
  const project = await getProject(u, projectId);
  if (!project) return { error: "Project not found." };
  const limit = await checkAllowance(u.businessId);
  if (limit) return { error: limit };
  let reply;
  try {
    reply = await coachReply(u, project.id, message);
    await recordUsage(u.businessId, "chat");
  } catch (e) {
    console.error("coach error", e instanceof Error ? e.message : e);
    return { error: "The coach couldn't respond just now. Your message was not saved — please try again." };
  }
  await db.$transaction([
    db.message.create({ data: { businessId: u.businessId, projectId: project.id, role: "user", content: message } }),
    db.message.create({ data: { businessId: u.businessId, projectId: project.id, role: "assistant", content: reply.text, meta: JSON.stringify(reply.meta) } }),
    db.project.update({ where: { id: project.id }, data: { lastActivityAt: new Date() } }),
  ]);
  revalidatePath(`/projects/${project.id}`);
  return {};
}

// ---------- Saving from coach answers ----------
export async function saveDecision(f: FormData) {
  const u = await requireUser();
  const projectId = str(f, "projectId");
  const text = str(f, "text", 2000);
  if (!text || !(await getProject(u, projectId))) return;
  await db.decision.create({ data: { businessId: u.businessId, projectId, text, source: str(f, "source", 20) || "owner" } });
  await touchProject(u, projectId);
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteDecision(f: FormData) {
  const u = await requireUser();
  await db.decision.deleteMany({ where: { id: str(f, "id"), businessId: u.businessId } });
  revalidatePath(`/projects/${str(f, "projectId")}`);
}

export async function saveAsResource(f: FormData) {
  const u = await requireUser();
  const content = str(f, "content", 50000);
  if (!content) return;
  const r = await createResource(u, { title: str(f, "title", 150) || "Saved coach answer", kind: str(f, "kind", 40) || "draft", content, projectId: str(f, "projectId") || null });
  revalidatePath("/resources");
  redirect(`/resources/${r.id}`);
}

// ---------- Tasks ----------
export async function addTask(f: FormData) {
  const u = await requireUser();
  const title = str(f, "title", 300);
  if (!title) return;
  const projectId = str(f, "projectId") || null;
  if (projectId && !(await getProject(u, projectId))) return;
  await db.task.create({
    data: { businessId: u.businessId, projectId, title, detail: str(f, "detail", 2000), dueDate: dateOrNull(str(f, "dueDate")), isPriority: f.get("isPriority") === "on" },
  });
  if (projectId) { await touchProject(u, projectId); revalidatePath(`/projects/${projectId}`); }
  revalidatePath("/dashboard");
}

export async function completeTask(f: FormData) {
  const u = await requireUser();
  const t = await getTask(u, str(f, "taskId"));
  if (!t) return;
  const done = t.status !== "done";
  await db.task.update({ where: { id: t.id }, data: { status: done ? "done" : "todo", completedAt: done ? new Date() : null, outcome: str(f, "outcome", 1000) || t.outcome } });
  if (t.projectId) revalidatePath(`/projects/${t.projectId}`);
  revalidatePath("/dashboard");
}

export async function updateTask(f: FormData) {
  const u = await requireUser();
  const t = await getTask(u, str(f, "taskId"));
  if (!t) return;
  await db.task.update({ where: { id: t.id }, data: { dueDate: dateOrNull(str(f, "dueDate")), outcome: str(f, "outcome", 1000), isPriority: f.get("isPriority") === "on" } });
  if (t.projectId) revalidatePath(`/projects/${t.projectId}`);
  revalidatePath("/dashboard");
}

export async function deleteTask(f: FormData) {
  const u = await requireUser();
  const t = await getTask(u, str(f, "taskId"));
  if (!t) return;
  await db.task.delete({ where: { id: t.id } });
  if (t.projectId) revalidatePath(`/projects/${t.projectId}`);
  revalidatePath("/dashboard");
}

// ---------- Goals ----------
export async function addGoal(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireUser();
  const projectId = str(f, "projectId");
  const metricKey = str(f, "metricKey");
  if (!(await getProject(u, projectId))) return { error: "Project not found." };
  if (!METRIC_BY_KEY[metricKey]) return { error: "Choose a number to track." };
  const baseline = parseNumber(str(f, "baselineValue"));
  const target = parseNumber(str(f, "targetValue"));
  if (target == null) return { error: "Enter a target number." };
  await db.goal.create({ data: { businessId: u.businessId, projectId, metricKey, baselineValue: baseline, baselineNote: str(f, "baselineNote", 200), targetValue: target, targetDate: dateOrNull(str(f, "targetDate")) } });
  revalidatePath(`/projects/${projectId}`);
  return { ok: "Goal added." };
}

export async function deleteGoal(f: FormData) {
  const u = await requireUser();
  await db.goal.deleteMany({ where: { id: str(f, "id"), businessId: u.businessId } });
  revalidatePath(`/projects/${str(f, "projectId")}`);
}

// ---------- Program ----------
export async function setStepStatus(f: FormData) {
  const u = await requireUser();
  const stepKey = str(f, "stepKey", 60);
  const status = str(f, "status", 20);
  if (!PROGRAM.some((s) => s.key === stepKey) || !["not-started", "in-progress", "done"].includes(status)) return;
  await db.programStep.upsert({
    where: { businessId_stepKey: { businessId: u.businessId, stepKey } },
    create: { businessId: u.businessId, stepKey, status, note: str(f, "note", 1000), completedAt: status === "done" ? new Date() : null },
    update: { status, note: str(f, "note", 1000), completedAt: status === "done" ? new Date() : null },
  });
  revalidatePath("/program"); revalidatePath("/dashboard");
}

// ---------- Resources ----------
export async function saveResourceVersion(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireUser();
  const id = str(f, "resourceId");
  const content = str(f, "content", 50000);
  const v = await addResourceVersion(u, id, content);
  if (!v) return { error: "Resource not found." };
  const title = str(f, "title", 150);
  const status = str(f, "status", 30);
  await db.resource.updateMany({
    where: { id, businessId: u.businessId },
    data: { ...(title ? { title } : {}), ...(["draft", "approved", "sent-externally"].includes(status) ? { status } : {}) },
  });
  revalidatePath(`/resources/${id}`); revalidatePath("/resources");
  return { ok: `Saved as version ${v}.` };
}

export async function newResource(f: FormData) {
  const u = await requireUser();
  const r = await createResource(u, { title: str(f, "title", 150) || "New draft", kind: str(f, "kind", 40) || "draft", content: str(f, "content", 50000) || "", projectId: str(f, "projectId") || null });
  redirect(`/resources/${r.id}`);
}

export async function deleteResource(f: FormData) {
  const u = await requireUser();
  const r = await getResource(u, str(f, "resourceId"));
  if (!r) return;
  await db.resource.delete({ where: { id: r.id } });
  revalidatePath("/resources");
  redirect("/resources");
}

// ---------- Weekly check-in ----------
export async function saveCheckIn(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireUser();
  const weekOf = dateOrNull(str(f, "weekOf")) ?? new Date();
  await db.checkIn.create({
    data: { businessId: u.businessId, weekOf, completed: str(f, "completed", 3000), blockers: str(f, "blockers", 3000), numbers: str(f, "numbers", 3000), priorities: str(f, "priorities", 3000) },
  });
  // Priorities become this week's priority tasks (one per line, max 3).
  const lines = str(f, "priorities", 3000).split("\n").map((l) => l.replace(/^[-*\d.\s]+/, "").trim()).filter(Boolean).slice(0, 3);
  const due = new Date(weekOf.getTime() + 7 * 86400_000);
  for (const title of lines) await db.task.create({ data: { businessId: u.businessId, title, isPriority: true, dueDate: due } });
  revalidatePath("/checkin"); revalidatePath("/dashboard");
  return { ok: `Check-in saved${lines.length ? ` and ${lines.length} priorit${lines.length === 1 ? "y" : "ies"} added to this week` : ""}. Lodge this week's numbers on the Numbers page.` };
}

// ---------- Account & privacy ----------
export async function deleteAccount(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireUser();
  if (str(f, "confirm") !== "DELETE") return { error: 'Type DELETE to confirm.' };
  await destroySession();
  await db.business.delete({ where: { id: u.businessId } }); // cascades to all business records
  redirect("/?deleted=1");
}

// ---------- Ask the coach (general chats) ----------
export async function startChat(text: string): Promise<{ error?: string; id?: string }> {
  const u = await requireUser();
  const message = text.trim().slice(0, 8000);
  if (!message) return { error: "Type a question first." };
  const title = message.replace(/\s+/g, " ").slice(0, 70) + (message.length > 70 ? "…" : "");
  const chat = await db.project.create({ data: { businessId: u.businessId, title, category: "other", status: "chat" } });
  const res = await sendMessage(chat.id, message);
  if (res.error) {
    await db.project.deleteMany({ where: { id: chat.id, businessId: u.businessId } });
    return res;
  }
  revalidatePath("/chat");
  return { id: chat.id };
}

export async function chatToProject(f: FormData) {
  const u = await requireUser();
  const id = str(f, "projectId");
  const p = await getProject(u, id);
  if (!p || p.status !== "chat") return;
  await db.project.update({
    where: { id },
    data: { status: "active", title: str(f, "title", 150) || p.title, category: str(f, "category", 40) || "other", goal: str(f, "goal", 500) },
  });
  revalidatePath("/chat"); revalidatePath("/projects");
  redirect(`/projects/${id}`);
}

export async function deleteChat(f: FormData) {
  const u = await requireUser();
  await db.project.deleteMany({ where: { id: str(f, "projectId"), businessId: u.businessId, status: "chat" } });
  revalidatePath("/chat");
  redirect("/chat");
}

// ---------- Project intake & tailored plan ----------
export async function saveIntake(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireUser();
  const id = str(f, "projectId");
  const p = await getProject(u, id);
  if (!p) return { error: "Project not found." };
  const answers: Record<string, string> = {};
  for (const [k, v] of f.entries()) if (k.startsWith("q_")) answers[k.slice(2)] = String(v).trim().slice(0, 2000);
  await db.project.update({ where: { id }, data: { intake: JSON.stringify(answers), intakeAt: new Date(), lastActivityAt: new Date() } });
  const limit = await checkAllowance(u.businessId);
  if (limit) { revalidatePath(`/projects/${id}`); return { error: `Your answers are saved. ${limit}` }; }
  try {
    const plan = await generatePlan(u, id);
    await recordUsage(u.businessId, "plan");
    await db.project.update({ where: { id }, data: { planDraft: JSON.stringify(plan) } });
  } catch (e) {
    console.error("plan error", e instanceof Error ? e.message : e);
    revalidatePath(`/projects/${id}`);
    return { error: "Your answers are saved, but the coach couldn't build the plan just now. Use \"Rebuild my plan\" to try again." };
  }
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${id}#plan`);
}

export async function rebuildPlan(f: FormData) {
  const u = await requireUser();
  const id = str(f, "projectId");
  if (!(await getProject(u, id))) return;
  if (await checkAllowance(u.businessId)) return;
  try {
    const plan = await generatePlan(u, id);
    await recordUsage(u.businessId, "plan");
    await db.project.update({ where: { id }, data: { planDraft: JSON.stringify(plan) } });
  } catch (e) {
    console.error("plan error", e instanceof Error ? e.message : e);
  }
  revalidatePath(`/projects/${id}`);
}

export async function skipIntake(f: FormData) {
  const u = await requireUser();
  const id = str(f, "projectId");
  await db.project.updateMany({ where: { id, businessId: u.businessId }, data: { intakeAt: new Date() } });
  revalidatePath(`/projects/${id}`);
}

export async function discardPlan(f: FormData) {
  const u = await requireUser();
  const id = str(f, "projectId");
  await db.project.updateMany({ where: { id, businessId: u.businessId }, data: { planDraft: "" } });
  revalidatePath(`/projects/${id}`);
}

export async function applyPlan(f: FormData) {
  const u = await requireUser();
  const id = str(f, "projectId");
  const p = await getProject(u, id);
  if (!p || !p.planDraft) return;
  const plan = JSON.parse(p.planDraft) as PlanDraft;
  const intake = parseIntake(p.intake);
  const latest = (await businessPeriods(u))[0];
  const questions = intakeFor(p.category, p.stepKey, (await db.businessProfile.findUnique({ where: { businessId: u.businessId } }))?.pathway ?? "");
  const today = new Date();
  // Tasks the owner ticked, due at the end of their plan week.
  // Skip anything already on the project, so rebuilding a plan never duplicates tasks or goals.
  const existingTitles = new Set((await db.task.findMany({ where: { projectId: id, businessId: u.businessId }, select: { title: true } })).map((x) => x.title.toLowerCase()));
  const existingGoals = new Set((await db.goal.findMany({ where: { projectId: id, businessId: u.businessId }, select: { metricKey: true } })).map((x) => x.metricKey));
  const tasks = plan.tasks.filter((t, i) => f.get(`task_${i}`) === "on" && !existingTitles.has(t.title.toLowerCase()));
  for (const t of tasks) {
    await db.task.create({ data: { businessId: u.businessId, projectId: id, title: t.title.slice(0, 300), detail: t.detail.slice(0, 2000), dueDate: new Date(today.getTime() + t.week * 7 * 86400_000) } });
  }
  // Goals: baseline always comes from the owner's own data (lodged numbers or intake answer), never the model.
  for (let i = 0; i < plan.goals.length; i++) {
    if (f.get(`goal_${i}`) !== "on") continue;
    const g = plan.goals[i];
    if (!METRIC_BY_KEY[g.metricKey] || existingGoals.has(g.metricKey)) continue;
    const q = questions.find((x) => x.metricKey === g.metricKey);
    const fromIntake = q ? parseNumber(intake[q.key]) : null;
    const baseline = latest?.values[g.metricKey] ?? fromIntake ?? null;
    const baselineNote = latest?.values[g.metricKey] != null ? `Lodged numbers, period ending ${latest.periodEnd.toISOString().slice(0, 10)}` : fromIntake != null ? "From project intake answers" : "";
    await db.goal.create({ data: { businessId: u.businessId, projectId: id, metricKey: g.metricKey, baselineValue: baseline, baselineNote, targetValue: parseNumber(str(f, `goal_target_${i}`)), targetDate: p.targetDate } });
  }
  if (plan.courseOutline && f.get("saveOutline") === "on") {
    await createResource(u, { title: `Course outline: ${plan.courseOutline.title}`, kind: "course-outline", content: outlineToMarkdown(plan.courseOutline), projectId: id });
    revalidatePath("/resources");
  }
  await db.project.update({
    where: { id },
    data: { planDraft: "", planAnalysis: JSON.stringify({ source: plan.source, diagnosis: plan.diagnosis, strategy: plan.strategy ?? [], assumptions: plan.assumptions, missingInfo: plan.missingInfo, contentUsed: plan.contentUsed, createdAt: new Date().toISOString() }), nextStep: p.nextStep && p.nextStep !== "Answer the tailoring questions" ? p.nextStep : plan.nextStep.slice(0, 300), summary: p.summary || plan.summary.slice(0, 4000), stage: "Plan in progress", lastActivityAt: new Date() },
  });
  revalidatePath(`/projects/${id}`); revalidatePath("/dashboard");
}

// ---------- Starting a program activity ----------
/** One "Start" button: marks the activity in progress, then opens (or creates) its project,
 *  which begins with the tailored intake questions. Activities without a project type go to their tool. */
export async function startStep(f: FormData) {
  const u = await requireUser();
  const stepKey = str(f, "stepKey", 60);
  const step = PROGRAM.find((s) => s.key === stepKey);
  if (!step) return;
  await db.programStep.upsert({
    where: { businessId_stepKey: { businessId: u.businessId, stepKey } },
    create: { businessId: u.businessId, stepKey, status: "in-progress" },
    update: { status: "in-progress" },
  });
  revalidatePath("/program"); revalidatePath("/dashboard");
  if (!step.projectCategory) redirect(step.tool?.href ?? "/numbers");
  const existing = await db.project.findFirst({ where: { businessId: u.businessId, stepKey, status: { not: "chat" } }, orderBy: { createdAt: "desc" } });
  if (existing) {
    if (existing.status !== "active") await db.project.update({ where: { id: existing.id }, data: { status: "active" } });
    redirect(`/projects/${existing.id}`);
  }
  const profile = await db.businessProfile.findUnique({ where: { businessId: u.businessId } });
  const p = await db.project.create({
    data: { businessId: u.businessId, title: step.title, category: step.projectCategory, pathway: profile?.pathway ?? "", stepKey, goal: "", nextStep: "Answer the tailoring questions" },
  });
  redirect(`/projects/${p.id}`);
}

export async function reviewProgress(f: FormData) {
  const u = await requireUser();
  const id = str(f, "projectId");
  await sendMessage(id, "Please review my progress on this project. Compare my latest results with my baseline and targets, look at which tasks I've done and what happened, tell me honestly whether I'm on track, and adjust my plan: what should I keep doing, change or add next?");
  redirect(`/projects/${id}#coach`);
}

// ---------- Accountability reminders ----------
export async function saveReminderSettings(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireUser();
  const emailOn = f.get("emailOn") === "on";
  const smsOn = f.get("smsOn") === "on";
  const phone = str(f, "phone", 30).replace(/\s/g, "");
  const consent = f.get("consent") === "on";
  if ((emailOn || smsOn) && !consent) return { error: "Tick the box to agree to receive reminders." };
  if (smsOn && !validMobile(phone)) return { error: "Enter your mobile in international format, e.g. +61412345678." };
  const day = Number(str(f, "dayOfWeek"));
  const data = {
    emailOn, smsOn, phone: smsOn ? phone : "",
    frequency: str(f, "frequency") === "twice-weekly" ? "twice-weekly" : "weekly",
    dayOfWeek: Number.isInteger(day) && day >= 0 && day <= 6 ? day : 1,
    overdueAlerts: f.get("overdueAlerts") === "on",
    consentAt: emailOn || smsOn ? new Date() : null,
  };
  await db.reminderSettings.upsert({ where: { businessId: u.businessId }, create: { businessId: u.businessId, ...data }, update: data });
  revalidatePath("/profile");
  return { ok: emailOn || smsOn ? "Reminders saved. You can change or stop them here any time." : "Reminders are off." };
}

export async function sendTestReminder(f: FormData) {
  void f;
  const u = await requireUser();
  await deliverReminder(u.businessId);
  revalidatePath("/profile");
}

// ---------- Switching / adding pathways ----------
export async function setPathway(f: FormData) {
  const u = await requireUser();
  const pathway = str(f, "pathway", 20);
  const mode = str(f, "mode", 20); // main | add | remove
  if (!["solo", "educator", "salon"].includes(pathway)) return;
  const profile = await db.businessProfile.findUnique({ where: { businessId: u.businessId } });
  if (!profile) return;
  const others = new Set(profile.otherPathways.split(",").filter(Boolean));
  let main = profile.pathway;
  if (mode === "main") {
    others.delete(pathway);
    if (f.get("keepOld") === "on" && main !== pathway) others.add(main); // keep the previous program as an extra
    main = pathway;
  } else if (mode === "add" && pathway !== main) others.add(pathway);
  else if (mode === "remove") others.delete(pathway);
  await db.businessProfile.update({ where: { businessId: u.businessId }, data: { pathway: main, otherPathways: [...others].join(",") } });
  revalidatePath("/program"); revalidatePath("/dashboard"); revalidatePath("/profile");
}

// ---------- Planner (calendar feed) ----------
export async function connectPlanner(_: FormState, f: FormData): Promise<FormState & { link?: string }> {
  void f;
  const u = await requireUser();
  const token = newToken();
  await db.business.update({ where: { id: u.businessId }, data: { calendarToken: hashToken(token) } });
  revalidatePath("/profile");
  const base = process.env.APP_URL || "http://localhost:3000";
  return { ok: "Your private calendar link is ready. Copy it now: it's only shown once. Making a new link turns the old one off.", link: `${base}/api/calendar/${token}.ics` };
}

export async function disconnectPlanner(f: FormData) {
  void f;
  const u = await requireUser();
  await db.business.update({ where: { id: u.businessId }, data: { calendarToken: null } });
  revalidatePath("/profile");
}

// ---------- Community ----------
const CATEGORIES = ["wins", "questions", "marketing", "education", "general"];

async function member(businessId: string) {
  return db.communityMember.findUnique({ where: { businessId } });
}

export async function joinCommunity(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireUser();
  const displayName = str(f, "displayName", 60);
  if (displayName.length < 2) return { error: "Choose a display name (at least 2 characters)." };
  if (f.get("guidelines") !== "on") return { error: "Please agree to the community guidelines." };
  await db.communityMember.upsert({
    where: { businessId: u.businessId },
    create: { businessId: u.businessId, displayName, bio: str(f, "bio", 200) },
    update: { displayName, bio: str(f, "bio", 200) },
  });
  revalidatePath("/community");
  return { ok: "Welcome to the community!" };
}

export async function createPost(_: FormState, f: FormData): Promise<FormState> {
  const u = await requireUser();
  const m = await member(u.businessId);
  if (!m || m.banned) return { error: "Join the community to post." };
  const body = str(f, "body", 3000);
  if (body.length < 3) return { error: "Write something first." };
  const category = CATEGORIES.includes(str(f, "category")) ? str(f, "category") : "general";
  const today = await db.communityPost.count({ where: { businessId: u.businessId, createdAt: { gte: new Date(Date.now() - 86400_000) } } });
  if (today >= 10) return { error: "You've reached today's limit of 10 posts. Try again tomorrow." };
  await db.communityPost.create({ data: { businessId: u.businessId, category, body } });
  revalidatePath("/community");
  return { ok: "Posted." };
}

export async function addComment(f: FormData) {
  const u = await requireUser();
  const m = await member(u.businessId);
  const body = str(f, "body", 1500);
  const postId = str(f, "postId");
  if (!m || m.banned || body.length < 1) return;
  const post = await db.communityPost.findFirst({ where: { id: postId, hidden: false } });
  if (!post) return;
  const today = await db.communityComment.count({ where: { businessId: u.businessId, createdAt: { gte: new Date(Date.now() - 86400_000) } } });
  if (today >= 50) return;
  await db.communityComment.create({ data: { postId, businessId: u.businessId, body } });
  revalidatePath("/community");
}

export async function toggleLike(f: FormData) {
  const u = await requireUser();
  const m = await member(u.businessId);
  const postId = str(f, "postId");
  if (!m || m.banned || !(await db.communityPost.findFirst({ where: { id: postId, hidden: false } }))) return;
  const existing = await db.communityLike.findUnique({ where: { postId_businessId: { postId, businessId: u.businessId } } });
  if (existing) await db.communityLike.delete({ where: { id: existing.id } });
  else await db.communityLike.create({ data: { postId, businessId: u.businessId } });
  revalidatePath("/community");
}

export async function deletePost(f: FormData) {
  const u = await requireUser();
  const id = str(f, "postId");
  if (isAdmin(u.email)) await db.communityPost.deleteMany({ where: { id } });
  else await db.communityPost.deleteMany({ where: { id, businessId: u.businessId } }); // only your own
  revalidatePath("/community");
}

export async function deleteComment(f: FormData) {
  const u = await requireUser();
  const id = str(f, "commentId");
  if (isAdmin(u.email)) await db.communityComment.deleteMany({ where: { id } });
  else await db.communityComment.deleteMany({ where: { id, businessId: u.businessId } });
  revalidatePath("/community");
}

export async function reportPost(f: FormData) {
  const u = await requireUser();
  const postId = str(f, "postId");
  if (!(await db.communityPost.findUnique({ where: { id: postId } }))) return;
  await db.communityReport.create({ data: { postId, commentId: str(f, "commentId"), reporterId: u.businessId, reason: str(f, "reason", 300) || "Reported" } });
  revalidatePath("/community");
}

// Moderator actions (ADMIN_EMAILS only)
export async function moderatePost(f: FormData) {
  const u = await requireUser();
  if (!isAdmin(u.email)) return;
  const id = str(f, "postId");
  const action = str(f, "action");
  if (action === "pin") await db.communityPost.updateMany({ where: { id }, data: { pinned: true } });
  if (action === "unpin") await db.communityPost.updateMany({ where: { id }, data: { pinned: false } });
  if (action === "hide") await db.communityPost.updateMany({ where: { id }, data: { hidden: true } });
  if (action === "unhide") await db.communityPost.updateMany({ where: { id }, data: { hidden: false } });
  if (action === "resolve") await db.communityReport.updateMany({ where: { postId: id }, data: { resolved: true } });
  if (action === "ban") {
    const p = await db.communityPost.findUnique({ where: { id } });
    if (p) { await db.communityMember.updateMany({ where: { businessId: p.businessId }, data: { banned: true } }); await db.communityPost.updateMany({ where: { businessId: p.businessId }, data: { hidden: true } }); }
  }
  revalidatePath("/community");
}
