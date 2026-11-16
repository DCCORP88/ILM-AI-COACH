// Seeds ONE clearly labelled synthetic demo business for trying the app.
// Never run against production. Demo businesses are flagged isDemo and badged in the UI.
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient();
const D = (s: string) => new Date(`${s}T00:00:00.000Z`);

async function main() {
  const email = "demo@example.test";
  await db.business.deleteMany({ where: { isDemo: true, users: { some: { email } } } });
  const biz = await db.business.create({ data: { name: "Demo Lash Studio (synthetic data)", isDemo: true } });
  await db.user.create({ data: { email, passwordHash: hashPassword("demo-password-123"), businessId: biz.id } });
  await db.businessProfile.create({
    data: {
      businessId: biz.id, pathway: "solo", otherPathways: "educator", stage: "Solo lash artist, 2 years in, home studio",
      services: "Lash lift + tint $95; Classic full set $160; Classic fill $70", location: "Fictional suburb", jurisdiction: "Australia, VIC",
      teamSize: "1", capacityPerWeek: "25", hoursPerWeek: "5", marketingBudget: "$200", primaryGoal: "Be fully booked Tues–Sat and cut no-shows",
      onboardedAt: new Date(),
    },
  });
  const periods: [string, string, Record<string, number>][] = [
    ["2026-09-01", "2026-09-30", { revenue_collected: 6200, visits: 74, new_clients: 14, returning_clients: 60, rebook_rate_reported: 52, no_shows: 7, enquiries: 30, enquiry_bookings: 14, retail_revenue: 180, capacity_slots: 100, costs_total: 4100 }],
    ["2026-10-01", "2026-10-31", { revenue_collected: 6650, visits: 78, new_clients: 12, returning_clients: 66, rebook_rate_reported: 58, no_shows: 4, enquiries: 28, enquiry_bookings: 12, retail_revenue: 260, capacity_slots: 100, costs_total: 4200 }],
  ];
  for (const [s, e, vals] of periods)
    for (const [k, v] of Object.entries(vals))
      await db.metricEntry.create({ data: { businessId: biz.id, metricKey: k, periodStart: D(s), periodEnd: D(e), value: v, source: "Synthetic demo data" } });
  const p = await db.project.create({
    data: { businessId: biz.id, title: "Rebooking & retention", category: "retention", pathway: "solo", goal: "Rebook rate from 52% to 75% by end of December",
      stage: "Testing rebooking scripts", nextStep: "Rebook every client before they leave for 2 weeks", summary: "Main leak: clients say they'll book later." },
  });
  await db.goal.create({ data: { businessId: biz.id, projectId: p.id, metricKey: "rebook_rate_reported", baselineValue: 52, baselineNote: "Sept 2026 (synthetic)", targetValue: 75, targetDate: D("2026-12-31") } });
  await db.metricEntry.create({ data: { businessId: biz.id, projectId: p.id, metricKey: "rebook_rate_reported", periodStart: D("2026-10-01"), periodEnd: D("2026-10-31"), value: 58, source: "Synthetic demo data" } });
  await db.task.createMany({ data: [
    { businessId: biz.id, projectId: p.id, title: "Use the rebooking line with every client this week", dueDate: D("2026-11-22"), isPriority: true },
    { businessId: biz.id, projectId: p.id, title: "Turn on Fresha 8-week lapsed-client reminder", dueDate: D("2026-11-20") },
  ] });
  await db.decision.create({ data: { businessId: biz.id, projectId: p.id, text: "Take a 50% deposit on all rebookings" } });
  await db.programStep.create({ data: { businessId: biz.id, stepKey: "baseline", status: "done", completedAt: new Date() } });
  console.log("Demo business created. Log in with demo@example.test / demo-password-123");
}
main().finally(() => db.$disconnect());
