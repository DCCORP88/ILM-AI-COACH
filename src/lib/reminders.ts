// Accountability reminders by email and/or SMS.
// - Opt-in only (consent recorded). Every message says how to stop.
// - Sends only when a provider is configured: RESEND_API_KEY + REMINDER_FROM_EMAIL for email,
//   TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM for SMS. Otherwise the message is logged
//   as a "preview" so the owner can see exactly what would be sent.
// - Run on a schedule with `npm run reminders` (e.g. a daily cron on the host).
import { db } from "./db";
import { getNextStep } from "./nextstep";

const APP_URL = () => process.env.APP_URL || "http://localhost:3000";

export function providers() {
  return {
    email: Boolean(process.env.RESEND_API_KEY && process.env.REMINDER_FROM_EMAIL),
    sms: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM),
  };
}

export function validMobile(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone.replace(/\s/g, ""));
}

export type ReminderMessage = { kind: string; subject: string; email: string; sms: string };

export async function composeReminder(businessId: string, now = new Date()): Promise<ReminderMessage> {
  const [business, step, overdue, doneThisWeek] = await Promise.all([
    db.business.findUnique({ where: { id: businessId } }),
    getNextStep({ businessId }, now),
    db.task.count({ where: { businessId, status: "todo", dueDate: { lt: now } } }),
    db.task.count({ where: { businessId, status: "done", completedAt: { gte: new Date(now.getTime() - 7 * 86400_000) } } }),
  ]);
  const link = `${APP_URL()}${step.href ?? "/dashboard"}`;
  const name = business?.name ?? "there";
  const subject = `Your next step: ${step.title}`.slice(0, 120);
  const email = [
    `Hi ${name},`,
    ``,
    doneThisWeek > 0 ? `You ticked off ${doneThisWeek} task${doneThisWeek === 1 ? "" : "s"} this week. Nice work.` : `Here's your nudge for this week.`,
    overdue > 0 ? `You have ${overdue} overdue task${overdue === 1 ? "" : "s"}.` : ``,
    ``,
    `YOUR NEXT STEP: ${step.title}`,
    step.why,
    ``,
    `${step.cta}: ${link}`,
    ``,
    `This is an automated reminder from your ILM Business Coach. To change or stop reminders: ${APP_URL()}/profile#reminders`,
  ].filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");
  const sms = `ILM Coach: next step: ${step.title}. ${link} Reply STOP to opt out.`.slice(0, 300);
  return { kind: step.kind, subject, email, sms };
}

async function sendEmail(to: string, subject: string, text: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.REMINDER_FROM_EMAIL, to: [to], subject, text }),
  });
  if (!res.ok) throw new Error(`Email provider returned ${res.status}`);
}

async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: to, From: process.env.TWILIO_FROM!, Body: body }),
  });
  if (!res.ok) throw new Error(`SMS provider returned ${res.status}`);
}

/** Sends (or previews) one business's reminder on its opted-in channels. */
export async function deliverReminder(businessId: string, now = new Date()) {
  const settings = await db.reminderSettings.findUnique({ where: { businessId } });
  if (!settings?.consentAt || (!settings.emailOn && !settings.smsOn)) return [];
  const user = await db.user.findFirst({ where: { businessId }, orderBy: { createdAt: "asc" } });
  const msg = await composeReminder(businessId, now);
  const p = providers();
  const results: { channel: string; status: string }[] = [];
  const log = (channel: string, status: string, detail = "") =>
    db.reminderLog.create({ data: { businessId, channel, kind: msg.kind, subject: channel === "email" ? msg.subject : "", body: channel === "email" ? msg.email : msg.sms, status, detail } });

  if (settings.emailOn && user) {
    if (!p.email) { await log("email", "preview", "Email provider not set up yet. Nothing was sent."); results.push({ channel: "email", status: "preview" }); }
    else {
      try { await sendEmail(user.email, msg.subject, msg.email); await log("email", "sent"); results.push({ channel: "email", status: "sent" }); }
      catch (e) { await log("email", "failed", e instanceof Error ? e.message : "error"); results.push({ channel: "email", status: "failed" }); }
    }
  }
  if (settings.smsOn && validMobile(settings.phone)) {
    if (!p.sms) { await log("sms", "preview", "SMS provider not set up yet. Nothing was sent."); results.push({ channel: "sms", status: "preview" }); }
    else {
      try { await sendSms(settings.phone.replace(/\s/g, ""), msg.sms); await log("sms", "sent"); results.push({ channel: "sms", status: "sent" }); }
      catch (e) { await log("sms", "failed", e instanceof Error ? e.message : "error"); results.push({ channel: "sms", status: "failed" }); }
    }
  }
  return results;
}

/** Whether a business is due a reminder today (by its chosen day and frequency, max one a day). */
export async function isDue(businessId: string, now = new Date()): Promise<boolean> {
  const s = await db.reminderSettings.findUnique({ where: { businessId } });
  if (!s?.consentAt || (!s.emailOn && !s.smsOn)) return false;
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const already = await db.reminderLog.count({ where: { businessId, createdAt: { gte: startOfDay } } });
  if (already) return false;
  const day = now.getDay();
  const days = s.frequency === "twice-weekly" ? [s.dayOfWeek, (s.dayOfWeek + 3) % 7] : [s.dayOfWeek];
  if (days.includes(day)) return true;
  if (s.overdueAlerts) {
    const overdue = await db.task.count({ where: { businessId, status: "todo", dueDate: { lt: now, gte: new Date(now.getTime() - 86400_000) } } });
    return overdue > 0; // a task became overdue in the last day
  }
  return false;
}
