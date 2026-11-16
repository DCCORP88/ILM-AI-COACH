import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ActionForm } from "@/components/ActionForm";
import { saveCheckIn } from "@/app/actions";

export default async function CheckIn() {
  const u = await requireUser();
  const weekAgo = new Date(Date.now() - 7 * 86400_000);
  const [history, doneThisWeek] = await Promise.all([
    db.checkIn.findMany({ where: { businessId: u.businessId }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.task.findMany({ where: { businessId: u.businessId, status: "done", completedAt: { gte: weekAgo } }, select: { title: true, outcome: true } }),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <h1>Weekly check-in</h1>
      <p className="muted">Five minutes, once a week: what you did, what got in the way, your numbers, and your top 3 priorities for next week.</p>
      <div className="card">
        <ActionForm action={saveCheckIn} submit="Save check-in" resetOnOk>
          <label>Week of<input type="date" name="weekOf" defaultValue={today} /></label>
          <label>What did you complete? <span className="hint">({doneThisWeek.length} task{doneThisWeek.length === 1 ? "" : "s"} ticked off in the last 7 days)</span>
            <textarea name="completed" defaultValue={doneThisWeek.map((t) => `- ${t.title}${t.outcome ? ` (${t.outcome})` : ""}`).join("\n")} /></label>
          <label>What got in the way?<textarea name="blockers" /></label>
          <label>Any numbers or results worth noting? <span className="hint">(then <Link href="/numbers">lodge them properly</Link>)</span><textarea name="numbers" /></label>
          <label>Top 3 priorities for next week <span className="hint">(one per line, added as priority tasks)</span><textarea name="priorities" /></label>
        </ActionForm>
      </div>
      {history.length > 0 && (
        <div className="card"><h2>Past check-ins</h2>
          {history.map((c) => (
            <details key={c.id} style={{ marginBottom: 8 }}><summary>Week of {c.weekOf.toLocaleDateString("en-AU", { timeZone: "UTC" })}</summary>
              <div className="small pre"><strong>Completed:</strong> {c.completed || "-"}{"\n"}<strong>Blockers:</strong> {c.blockers || "-"}{"\n"}<strong>Numbers:</strong> {c.numbers || "-"}{"\n"}<strong>Priorities:</strong> {c.priorities || "-"}</div>
            </details>
          ))}
        </div>
      )}
    </>
  );
}
