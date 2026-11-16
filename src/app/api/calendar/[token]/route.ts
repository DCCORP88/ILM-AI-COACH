// Private calendar feed (iCalendar). Subscribed from Google/Apple/Outlook calendar.
// The link contains a random secret; only its hash is stored. Read-only: tasks with due dates
// and the weekly check-in. Nothing in the calendar can change the app.
import { db } from "@/lib/db";
import { hashToken } from "@/lib/password";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const day = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const fold = (line: string) => line.length <= 74 ? line : line.match(/.{1,74}/g)!.join("\r\n ");

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const raw = token.replace(/\.ics$/, "");
  const biz = await db.business.findUnique({ where: { calendarToken: hashToken(raw) } });
  if (!biz) return new Response("Not found", { status: 404 });
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const [tasks, settings] = await Promise.all([
    db.task.findMany({ where: { businessId: biz.id, status: "todo", dueDate: { not: null } }, include: { project: { select: { id: true, title: true } } } }),
    db.reminderSettings.findUnique({ where: { businessId: biz.id } }),
  ]);
  const now = stamp(new Date());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ILM Business Coach//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:ILM Business Coach", "REFRESH-INTERVAL;VALUE=DURATION:PT6H", "X-PUBLISHED-TTL:PT6H"];
  for (const t of tasks) {
    const start = t.dueDate!;
    const end = new Date(start.getTime() + 86400_000);
    lines.push("BEGIN:VEVENT", `UID:task-${t.id}@ilm-coach`, `DTSTAMP:${now}`, `DTSTART;VALUE=DATE:${day(start)}`, `DTEND;VALUE=DATE:${day(end)}`,
      fold(`SUMMARY:${esc(`✓ ${t.title}`)}`),
      fold(`DESCRIPTION:${esc(`${t.project ? `Project: ${t.project.title}\n` : ""}${t.detail ? `${t.detail}\n` : ""}Tick it off: ${appUrl}${t.project ? `/projects/${t.project.id}` : "/dashboard"}`)}`),
      "TRANSP:TRANSPARENT", "END:VEVENT");
  }
  // Weekly check-in on the owner's reminder day (default Monday), recurring.
  const dow = settings?.dayOfWeek ?? 1;
  const first = new Date(); first.setUTCHours(0, 0, 0, 0);
  while (first.getUTCDay() !== dow) first.setUTCDate(first.getUTCDate() + 1);
  lines.push("BEGIN:VEVENT", `UID:checkin-${biz.id}@ilm-coach`, `DTSTAMP:${now}`, `DTSTART;VALUE=DATE:${day(first)}`, `DTEND;VALUE=DATE:${day(new Date(first.getTime() + 86400_000))}`,
    "RRULE:FREQ=WEEKLY", "SUMMARY:Weekly check-in (5 min)", fold(`DESCRIPTION:${esc(`What you did, what got in the way, and your top 3 for next week: ${appUrl}/checkin`)}`), "TRANSP:TRANSPARENT", "END:VEVENT");
  lines.push("END:VCALENDAR");
  return new Response(lines.join("\r\n") + "\r\n", { headers: { "Content-Type": "text/calendar; charset=utf-8", "Cache-Control": "private, max-age=900" } });
}
