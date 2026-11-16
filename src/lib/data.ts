// Tenant-scoped data access. EVERY read and write takes the businessId resolved from the
// signed-in session (src/lib/auth.ts) and filters by it, so changing an ID in a URL or form
// can never reach another business's records. Do not query business data anywhere else.

import { db } from "./db";
import { deriveMetrics, METRIC_BY_KEY } from "./metrics";

export type Scope = { businessId: string };

export async function getProfile(s: Scope) {
  return db.businessProfile.findUnique({ where: { businessId: s.businessId } });
}

// ---------- Projects ----------
export async function listProjects(s: Scope, opts: { status?: string; q?: string; category?: string } = {}) {
  return db.project.findMany({
    where: {
      businessId: s.businessId,
      ...(opts.status && opts.status !== "all" ? { status: opts.status } : { status: { not: "chat" } }),
      ...(opts.category ? { category: opts.category } : {}),
      ...(opts.q ? { OR: [{ title: { contains: opts.q } }, { goal: { contains: opts.q } }, { summary: { contains: opts.q } }] } : {}),
    },
    orderBy: { lastActivityAt: "desc" },
    include: { tasks: { select: { status: true } } },
  });
}

export async function listChats(s: Scope) {
  return db.project.findMany({ where: { businessId: s.businessId, status: "chat" }, orderBy: { lastActivityAt: "desc" }, take: 50 });
}

export async function getProject(s: Scope, projectId: string) {
  return db.project.findFirst({ where: { id: projectId, businessId: s.businessId } });
}

export async function getProjectFull(s: Scope, projectId: string) {
  return db.project.findFirst({
    where: { id: projectId, businessId: s.businessId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      tasks: { orderBy: [{ status: "desc" }, { dueDate: "asc" }, { createdAt: "asc" }] },
      decisions: { orderBy: { createdAt: "asc" } },
      goals: { orderBy: { createdAt: "asc" } },
      metrics: { orderBy: { periodStart: "asc" } },
      resources: { orderBy: { updatedAt: "desc" } },
    },
  });
}

export async function touchProject(s: Scope, projectId: string) {
  await db.project.updateMany({ where: { id: projectId, businessId: s.businessId }, data: { lastActivityAt: new Date() } });
}

// ---------- Tasks ----------
export async function getTask(s: Scope, taskId: string) {
  return db.task.findFirst({ where: { id: taskId, businessId: s.businessId } });
}

// ---------- Resources ----------
export async function getResource(s: Scope, resourceId: string) {
  return db.resource.findFirst({
    where: { id: resourceId, businessId: s.businessId },
    include: { versions: { orderBy: { version: "desc" } }, project: { select: { id: true, title: true } } },
  });
}

export async function createResource(s: Scope, data: { title: string; kind: string; content: string; projectId?: string | null }) {
  // Only attach to a project that belongs to this business.
  const projectId = data.projectId ? (await getProject(s, data.projectId))?.id ?? null : null;
  return db.resource.create({
    data: {
      businessId: s.businessId, title: data.title, kind: data.kind, projectId,
      versions: { create: { businessId: s.businessId, version: 1, content: data.content } },
    },
  });
}

export async function addResourceVersion(s: Scope, resourceId: string, content: string) {
  const res = await getResource(s, resourceId);
  if (!res) return null;
  const next = (res.versions[0]?.version ?? 0) + 1;
  await db.resourceVersion.create({ data: { businessId: s.businessId, resourceId, version: next, content } });
  await db.resource.update({ where: { id: resourceId }, data: { updatedAt: new Date() } });
  return next;
}

// ---------- Numbers ----------
export type PeriodValues = { periodStart: Date; periodEnd: Date; values: Record<string, number>; sources: Record<string, string>; updatedAt: Date };

/** Business-wide (projectId null) entries grouped by period, newest first. */
export async function businessPeriods(s: Scope): Promise<PeriodValues[]> {
  const rows = await db.metricEntry.findMany({ where: { businessId: s.businessId, projectId: null }, orderBy: { periodStart: "desc" } });
  const map = new Map<string, PeriodValues>();
  for (const r of rows) {
    const k = `${r.periodStart.toISOString()}|${r.periodEnd.toISOString()}`;
    const p = map.get(k) ?? { periodStart: r.periodStart, periodEnd: r.periodEnd, values: {}, sources: {}, updatedAt: r.updatedAt };
    p.values[r.metricKey] = r.value;
    p.sources[r.metricKey] = r.source;
    if (r.updatedAt > p.updatedAt) p.updatedAt = r.updatedAt;
    map.set(k, p);
  }
  return [...map.values()];
}

export async function upsertMetric(
  s: Scope,
  data: { metricKey: string; periodStart: Date; periodEnd: Date; value: number; projectId?: string | null; source?: string; note?: string },
) {
  if (!METRIC_BY_KEY[data.metricKey]) throw new Error("Unknown metric");
  if (data.periodEnd < data.periodStart) throw new Error("Period end is before period start");
  const projectId = data.projectId ? (await getProject(s, data.projectId))?.id ?? null : null;
  if (data.projectId && !projectId) throw new Error("Project not found");
  // Unique per business + project + metric + period: re-entering the same period updates it
  // instead of creating a duplicate.
  const existing = await db.metricEntry.findFirst({
    where: { businessId: s.businessId, projectId, metricKey: data.metricKey, periodStart: data.periodStart, periodEnd: data.periodEnd },
  });
  if (existing) {
    return db.metricEntry.update({ where: { id: existing.id }, data: { value: data.value, note: data.note ?? existing.note, source: data.source ?? existing.source } });
  }
  return db.metricEntry.create({
    data: { businessId: s.businessId, projectId, metricKey: data.metricKey, periodStart: data.periodStart, periodEnd: data.periodEnd, value: data.value, source: data.source ?? "Manual entry", note: data.note ?? "" },
  });
}

export async function deleteMetric(s: Scope, id: string) {
  return db.metricEntry.deleteMany({ where: { id, businessId: s.businessId } });
}

/** Plain-text numbers summary for the coach: latest period vs previous, plus derived metrics
 *  calculated in code. Missing values are stated as missing, never guessed. */
export async function numbersSummary(s: Scope): Promise<string> {
  const periods = await businessPeriods(s);
  if (periods.length === 0) return "No business numbers have been lodged yet.";
  const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
  const lines: string[] = [];
  periods.slice(0, 3).forEach((p, i) => {
    lines.push(`${i === 0 ? "Latest" : "Earlier"} period ${fmtDate(p.periodStart)} to ${fmtDate(p.periodEnd)} (last updated ${fmtDate(p.updatedAt)}):`);
    for (const [k, v] of Object.entries(p.values)) lines.push(`  - ${METRIC_BY_KEY[k]?.label ?? k}: ${v} (source: ${p.sources[k]})`);
    for (const d of deriveMetrics(p.values)) {
      if (d.value != null) lines.push(`  - [calculated] ${d.label}: ${Math.round(d.value * 100) / 100} (${d.formula})`);
    }
  });
  return lines.join("\n");
}
