"use client";
import { useState } from "react";
import { addGoal } from "@/app/actions";
import { ActionForm } from "./ActionForm";
import { METRICS } from "@/lib/metrics";

/** Add-goal form. Choosing a number pre-fills the starting point from the owner's latest lodged numbers. */
export function GoalForm({ projectId, suggested, latestValues, latestLabel }: { projectId: string; suggested: string[]; latestValues: Record<string, number>; latestLabel: string }) {
  const ordered = [...METRICS.filter((m) => suggested.includes(m.key)), ...METRICS.filter((m) => !suggested.includes(m.key))];
  const first = ordered[0].key;
  const [metric, setMetric] = useState(first);
  const [baseline, setBaseline] = useState(latestValues[first] != null ? String(latestValues[first]) : "");
  const [note, setNote] = useState(latestValues[first] != null ? `My numbers, ${latestLabel}` : "");
  const choose = (k: string) => {
    setMetric(k);
    const v = latestValues[k];
    setBaseline(v != null ? String(v) : "");
    setNote(v != null ? `My numbers, ${latestLabel}` : "");
  };
  return (
    <ActionForm action={addGoal} submit="Add goal" resetOnOk>
      <input type="hidden" name="projectId" value={projectId} />
      <div className="grid g2">
        <label>Number to improve
          <select name="metricKey" value={metric} onChange={(e) => choose(e.target.value)} required>
            {ordered.map((m) => <option key={m.key} value={m.key}>{m.label}{suggested.includes(m.key) ? " (suggested)" : ""}</option>)}
          </select>
        </label>
        <label>Target date<input type="date" name="targetDate" /></label>
        <label>Starting point (baseline) {latestValues[metric] != null && <span className="hint">(from your latest numbers)</span>}<input name="baselineValue" inputMode="decimal" value={baseline} onChange={(e) => setBaseline(e.target.value)} placeholder="e.g. 55" /></label>
        <label>Target<input name="targetValue" inputMode="decimal" required placeholder="e.g. 75" /></label>
      </div>
      <label>Where the starting point came from <span className="hint">(optional)</span><input name="baselineNote" value={note} onChange={(e) => setNote(e.target.value)} /></label>
    </ActionForm>
  );
}
