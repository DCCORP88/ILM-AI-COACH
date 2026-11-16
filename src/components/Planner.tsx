"use client";
import { useActionState } from "react";
import { connectPlanner, disconnectPlanner } from "@/app/actions";

export function Planner({ connected }: { connected: boolean }) {
  const [state, action, pending] = useActionState(connectPlanner, undefined);
  const link = state && "link" in state ? state.link : undefined;
  return (
    <div className="card" id="planner">
      <h2>Connect your planner</h2>
      <p className="small muted">See your tasks (on their due dates) and your weekly check-in in the calendar you already use: Google Calendar, Apple Calendar or Outlook. It updates automatically every few hours. It&apos;s read-only, so ticking things off still happens here.</p>
      {connected && !link && <div className="notice ok small">Your planner is connected. Lost the link? Make a new one (the old link stops working).</div>}
      <form action={action}>
        <button className="btn" disabled={pending}>{pending ? "Creating…" : connected ? "Make a new calendar link" : "Create my calendar link"}</button>
      </form>
      {link && (
        <div style={{ marginTop: 12 }}>
          <div className="notice ok small">{state?.ok}</div>
          <label>Your private calendar link<input readOnly value={link} onFocus={(e) => e.currentTarget.select()} /></label>
          <div className="row" style={{ marginTop: 8 }}>
            <button type="button" className="btn ghost small" onClick={() => navigator.clipboard?.writeText(link)}>Copy link</button>
            <a className="btn ghost small" href={link.replace(/^https?:/, "webcal:")}>Open in Apple Calendar / Outlook</a>
          </div>
          <details style={{ marginTop: 10 }}>
            <summary>How to add it to Google Calendar</summary>
            <ol className="small">
              <li>Open Google Calendar on a computer.</li>
              <li>Next to &quot;Other calendars&quot;, click <strong>+</strong> → <strong>From URL</strong>.</li>
              <li>Paste your link and click <strong>Add calendar</strong>.</li>
            </ol>
            <p className="small muted">Google only accepts links to apps that are online, so this works once the coach is live (not from a test copy on a single computer).</p>
          </details>
          <p className="small muted">Keep this link private: anyone with it can see your task titles.</p>
        </div>
      )}
      {connected && <form action={disconnectPlanner} style={{ marginTop: 10 }}><button className="btn link small">Disconnect my planner</button></form>}
    </div>
  );
}
