// Run once a day (e.g. 8am) by the host's scheduler: `npm run reminders`.
import { db } from "../src/lib/db";
import { deliverReminder, isDue } from "../src/lib/reminders";

async function main() {
  const due = await db.reminderSettings.findMany({ where: { consentAt: { not: null }, OR: [{ emailOn: true }, { smsOn: true }] }, select: { businessId: true } });
  let count = 0;
  for (const { businessId } of due) {
    if (!(await isDue(businessId))) continue;
    const r = await deliverReminder(businessId);
    count += r.length;
  }
  console.log(`Reminders processed: ${count}`);
}
main().finally(() => db.$disconnect());
