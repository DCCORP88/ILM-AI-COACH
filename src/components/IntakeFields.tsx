"use client";
import { useState } from "react";
import type { IntakeQuestion } from "@/lib/intake";

function visible(q: IntakeQuestion, a: Record<string, string>) {
  return !q.showIf || q.showIf.values.includes(a[q.showIf.key] ?? "");
}

/** Intake questions with follow-ups that appear based on earlier answers (e.g. in person vs online). */
export function IntakeFields({ questions, initial, prefilled }: { questions: IntakeQuestion[]; initial: Record<string, string>; prefilled: string[] }) {
  const [answers, setAnswers] = useState(initial);
  const set = (k: string, v: string) => setAnswers((a) => ({ ...a, [k]: v }));
  let n = 0;
  return (
    <>
      {questions.map((q) => {
        if (!visible(q, answers)) return null;
        n++;
        const value = answers[q.key] ?? "";
        const common = { name: `q_${q.key}`, value, onChange: (e: { target: { value: string } }) => set(q.key, e.target.value) };
        return (
          <div key={q.key}>
            {q.section && <h3 style={{ marginTop: 18, color: "var(--accent)" }}>{q.section}</h3>}
            <label>
              {n}. {q.label}
              {q.help && <span className="hint"> ({q.help})</span>}
              {prefilled.includes(q.key) && <span className="hint"> (already known, change if needed)</span>}
              {q.type === "long" ? <textarea {...common} style={{ minHeight: 70 }} />
                : q.type === "choice" ? (
                  <select {...common}>
                    <option value="">Choose…</option>
                    {q.options!.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : <input {...common} inputMode={q.type === "number" ? "decimal" : undefined} />}
            </label>
          </div>
        );
      })}
    </>
  );
}
