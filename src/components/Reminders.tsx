import type { ReminderLog, ReminderSettings } from "@prisma/client";
import { ActionForm } from "./ActionForm";
import { saveReminderSettings, sendTestReminder } from "@/app/actions";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function Reminders({ settings, logs, providers, email }: { settings: ReminderSettings | null; logs: ReminderLog[]; providers: { email: boolean; sms: boolean }; email: string }) {
  const on = settings?.consentAt && (settings.emailOn || settings.smsOn);
  return (
    <div className="card" id="reminders">
      <h2>Accountability reminders</h2>
      <p className="small muted">Get a nudge with your next step, by email, text or both. You choose the day. Change or stop them any time.</p>
      {(!providers.email || !providers.sms) && (
        <div className="notice warn small">
          Prototype: {!providers.email && "email"}{!providers.email && !providers.sms && " and "}{!providers.sms && "text"} sending isn&apos;t connected yet, so reminders appear below as previews and nothing is sent.
        </div>
      )}
      <ActionForm action={saveReminderSettings} submit="Save reminder settings">
        <label style={{ fontWeight: 400 }}><input type="checkbox" name="emailOn" defaultChecked={settings?.emailOn} /> Email me at {email}</label>
        <label style={{ fontWeight: 400 }}><input type="checkbox" name="smsOn" defaultChecked={settings?.smsOn} /> Text me</label>
        <label>Mobile number <span className="hint">(only for texts, international format, e.g. +61412345678)</span><input name="phone" defaultValue={settings?.phone} inputMode="tel" autoComplete="tel" /></label>
        <div className="grid g2">
          <label>How often
            <select name="frequency" defaultValue={settings?.frequency ?? "weekly"}><option value="weekly">Once a week</option><option value="twice-weekly">Twice a week</option></select>
          </label>
          <label>Day
            <select name="dayOfWeek" defaultValue={String(settings?.dayOfWeek ?? 1)}>{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
          </label>
        </div>
        <label style={{ fontWeight: 400 }}><input type="checkbox" name="overdueAlerts" defaultChecked={settings?.overdueAlerts ?? true} /> Also remind me the day after a task becomes overdue</label>
        <label style={{ fontWeight: 400 }}><input type="checkbox" name="consent" defaultChecked={Boolean(settings?.consentAt)} /> I agree to receive accountability reminders from ILM Business Coach. I can stop them here at any time, or reply STOP to a text.</label>
      </ActionForm>
      {on && (
        <form action={sendTestReminder} style={{ marginTop: 10 }}>
          <button className="btn ghost small">{providers.email || providers.sms ? "Send me a test reminder now" : "Preview my reminder"}</button>
        </form>
      )}
      {logs.length > 0 && (
        <details style={{ marginTop: 12 }} open>
          <summary>Recent reminders</summary>
          {logs.map((l) => (
            <div key={l.id} style={{ borderTop: "1px solid var(--line)", padding: "8px 0" }}>
              <div className="small"><span className={`badge ${l.status === "sent" ? "ok" : l.status === "failed" ? "bad" : "warn"}`}>{l.channel} · {l.status}</span> <span className="muted">{l.createdAt.toLocaleString("en-AU")}</span> {l.detail && <span className="muted">· {l.detail}</span>}</div>
              {l.subject && <div className="small"><strong>{l.subject}</strong></div>}
              <div className="small pre muted">{l.body}</div>
            </div>
          ))}
        </details>
      )}
    </div>
  );
}
