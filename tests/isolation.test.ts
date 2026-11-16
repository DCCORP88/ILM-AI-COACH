// Account and project isolation through the tenant-scoped data layer.
import { beforeAll, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";
import { db } from "@/lib/db";
import { addResourceVersion, createResource, getProject, getProjectFull, getResource, getTask, listProjects, numbersSummary, upsertMetric, deleteMetric, businessPeriods } from "@/lib/data";

let A: { businessId: string }, B: { businessId: string };
let projA: string, projA2: string, projB: string;

beforeAll(async () => {
  // Throwaway test database file, created fresh for every run (never the dev or production database).
  fs.rmSync("prisma/test.db", { force: true });
  execSync("npx prisma db push --skip-generate", { env: { ...process.env, DATABASE_URL: "file:./test.db" }, stdio: "ignore" });
  const a = await db.business.create({ data: { name: "Test A" } });
  const b = await db.business.create({ data: { name: "Test B" } });
  A = { businessId: a.id }; B = { businessId: b.id };
  projA = (await db.project.create({ data: { businessId: a.id, title: "A course", category: "course", budget: "$500" } })).id;
  projA2 = (await db.project.create({ data: { businessId: a.id, title: "A ads", category: "meta-ads", budget: "$300" } })).id;
  projB = (await db.project.create({ data: { businessId: b.id, title: "B secret", category: "pricing" } })).id;
  await db.task.create({ data: { businessId: b.id, projectId: projB, title: "B task" } });
});

describe("account isolation", () => {
  it("cannot read another business's project by ID", async () => {
    expect(await getProject(A, projB)).toBeNull();
    expect(await getProjectFull(A, projB)).toBeNull();
    expect(await getProject(B, projB)).not.toBeNull();
  });
  it("lists only own projects", async () => {
    const list = await listProjects(A, { status: "all" });
    expect(list.map((p) => p.title).sort()).toEqual(["A ads", "A course"]);
  });
  it("cannot read or edit another business's task or resource", async () => {
    const bTask = await db.task.findFirstOrThrow({ where: { businessId: B.businessId } });
    expect(await getTask(A, bTask.id)).toBeNull();
    const res = await createResource(B, { title: "B script", kind: "script", content: "v1" });
    expect(await getResource(A, res.id)).toBeNull();
    expect(await addResourceVersion(A, res.id, "hacked")).toBeNull();
    expect((await getResource(B, res.id))!.versions.length).toBe(1);
  });
  it("cannot attach records to another business's project", async () => {
    const r = await createResource(A, { title: "x", kind: "draft", content: "y", projectId: projB });
    expect(r.projectId).toBeNull();
    await expect(upsertMetric(A, { metricKey: "enquiries", periodStart: new Date("2026-10-01"), periodEnd: new Date("2026-10-31"), value: 5, projectId: projB })).rejects.toThrow();
  });
  it("cannot delete another business's numbers", async () => {
    const m = await upsertMetric(B, { metricKey: "visits", periodStart: new Date("2026-10-01"), periodEnd: new Date("2026-10-31"), value: 40 });
    await deleteMetric(A, m.id);
    expect(await db.metricEntry.findUnique({ where: { id: m.id } })).not.toBeNull();
  });
  it("numbers summary never includes another business's figures", async () => {
    const s = await numbersSummary(A);
    expect(s).toContain("No business numbers");
  });
});

describe("project isolation and numbers", () => {
  it("project budgets stay separate and don't touch the business profile", async () => {
    const [p1, p2] = [await getProject(A, projA), await getProject(A, projA2)];
    expect(p1!.budget).toBe("$500");
    expect(p2!.budget).toBe("$300");
    expect(await db.businessProfile.findUnique({ where: { businessId: A.businessId } })).toBeNull();
  });
  it("project results don't mix into business-wide numbers", async () => {
    await upsertMetric(A, { metricKey: "ad_leads", periodStart: new Date("2026-10-01"), periodEnd: new Date("2026-10-31"), value: 9, projectId: projA2 });
    expect(await businessPeriods(A)).toEqual([]);
  });
  it("re-entering the same period updates instead of duplicating", async () => {
    const args = { metricKey: "revenue_collected", periodStart: new Date("2026-10-01"), periodEnd: new Date("2026-10-31") };
    await upsertMetric(A, { ...args, value: 1000 });
    await upsertMetric(A, { ...args, value: 1200 });
    const rows = await db.metricEntry.findMany({ where: { businessId: A.businessId, projectId: null, metricKey: "revenue_collected" } });
    expect(rows.length).toBe(1);
    expect(rows[0].value).toBe(1200);
  });
  it("rejects unknown metrics and reversed periods", async () => {
    await expect(upsertMetric(A, { metricKey: "made_up", periodStart: new Date(), periodEnd: new Date(), value: 1 })).rejects.toThrow();
    await expect(upsertMetric(A, { metricKey: "visits", periodStart: new Date("2026-10-31"), periodEnd: new Date("2026-10-01"), value: 1 })).rejects.toThrow();
  });
});

describe("next step and reminders", () => {
  it("sends a new business to onboarding first, then numbers", async () => {
    const { getNextStep } = await import("@/lib/nextstep");
    const biz = await db.business.create({ data: { name: "Fresh" } });
    expect((await getNextStep({ businessId: biz.id })).kind).toBe("onboarding");
    await db.businessProfile.create({ data: { businessId: biz.id, pathway: "salon", onboardedAt: new Date() } });
    expect((await getNextStep({ businessId: biz.id })).kind).toBe("numbers");
  });
  it("never sends reminders without consent, and previews when no provider is set", async () => {
    const { deliverReminder, isDue, composeReminder } = await import("@/lib/reminders");
    const biz = await db.business.create({ data: { name: "Remind" } });
    await db.user.create({ data: { email: "remind@example.test", passwordHash: "x", businessId: biz.id } });
    await db.reminderSettings.create({ data: { businessId: biz.id, emailOn: true } }); // no consentAt
    expect(await deliverReminder(biz.id)).toEqual([]);
    expect(await isDue(biz.id)).toBe(false);
    await db.reminderSettings.update({ where: { businessId: biz.id }, data: { consentAt: new Date() } });
    const r = await deliverReminder(biz.id);
    expect(r).toEqual([{ channel: "email", status: "preview" }]);
    const msg = await composeReminder(biz.id);
    expect(msg.email).toContain("stop reminders");
    expect(msg.sms).toContain("STOP");
  });
});

describe("goal progress", () => {
  it("uses monthly numbers lodged after the goal, or a newer project result", async () => {
    const { goalStatus } = await import("@/lib/goals");
    const goal = { id: "g", businessId: "b", projectId: "p", metricKey: "rebook_rate_reported", baselineValue: 50, baselineNote: "", targetValue: 80, targetDate: null, createdAt: new Date("2026-11-01") };
    const periods = [{ periodStart: new Date("2026-11-01"), periodEnd: new Date("2026-11-30"), values: { rebook_rate_reported: 65 }, sources: {}, updatedAt: new Date() }];
    const st = goalStatus(goal, [], periods, new Date("2026-12-05"));
    expect(st.latest).toBe(65);
    expect(st.latestSource).toBe("monthly numbers");
    expect(st.progress!.percent).toBe(50);
    const proj = [{ id: "m", businessId: "b", projectId: "p", metricKey: "rebook_rate_reported", periodStart: new Date("2026-12-01"), periodEnd: new Date("2026-12-04"), value: 70, source: "", note: "", createdAt: new Date(), updatedAt: new Date() }];
    expect(goalStatus(goal, proj, periods, new Date("2026-12-05")).latestSource).toBe("project");
    const old = [{ ...periods[0], periodEnd: new Date("2026-10-31"), periodStart: new Date("2026-10-01") }];
    expect(goalStatus(goal, [], old, new Date("2026-12-05")).latest).toBeNull(); // baseline-era numbers don't count as progress
  });
});

describe("planner calendar feed", () => {
  it("serves tasks only for the matching secret link", async () => {
    const { GET } = await import("@/app/api/calendar/[token]/route");
    const { hashToken } = await import("@/lib/password");
    const biz = await db.business.create({ data: { name: "Cal", calendarToken: hashToken("secret-abc") } });
    await db.task.create({ data: { businessId: biz.id, title: "Ask for Google reviews", dueDate: new Date("2026-12-01") } });
    const ok = await GET(new Request("http://x"), { params: Promise.resolve({ token: "secret-abc.ics" }) });
    const body = await ok.text();
    expect(ok.status).toBe(200);
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("Ask for Google reviews");
    expect(body).toContain("DTSTART;VALUE=DATE:20261201");
    const bad = await GET(new Request("http://x"), { params: Promise.resolve({ token: "wrong.ics" }) });
    expect(bad.status).toBe(404);
  });
});
