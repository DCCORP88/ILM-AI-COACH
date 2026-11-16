import Link from "next/link";
import type { NextStep } from "@/lib/nextstep";
import { startStep } from "@/app/actions";

export function NextStepCard({ step }: { step: NextStep }) {
  return (
    <div className="card feature">
      <div className="eyebrow">Your next step</div>
      <h2 style={{ margin: "8px 0 4px", fontSize: "1.05rem" }}>{step.title}</h2>
      <p className="muted" style={{ marginTop: 0 }}>{step.why}</p>
      {step.startStepKey ? (
        <form action={startStep}><input type="hidden" name="stepKey" value={step.startStepKey} /><button className="btn accent">{step.cta} →</button></form>
      ) : (
        <Link className="btn accent" href={step.href ?? "/dashboard"}>{step.cta} →</Link>
      )}
    </div>
  );
}

const STAGES = [
  { n: 1, title: "Know your numbers", text: "Lodge your monthly numbers. They're your starting point.", href: "/numbers" },
  { n: 2, title: "Start an activity", text: "In My program, press Start. Answer a few questions about your business.", href: "/program" },
  { n: 3, title: "Get your plan", text: "Your coach builds a tailored plan with goals and weekly tasks.", href: "/projects" },
  { n: 4, title: "Do it and track it", text: "Tick off tasks, check in weekly, log results, and ask the coach to review.", href: "/checkin" },
];

export function HowItWorks({ current }: { current: number }) {
  return (
    <details className="card" open={current <= 2}>
      <summary style={{ fontSize: ".95rem" }}>How the program works</summary>
      <div className="grid g3" style={{ marginTop: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {STAGES.map((s) => (
          <Link key={s.n} href={s.href} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ borderTop: `3px solid ${s.n === current ? "var(--accent)" : "var(--line)"}`, paddingTop: 8 }}>
              <div className="small" style={{ color: s.n === current ? "var(--accent)" : "var(--muted)", fontWeight: 600 }}>STEP {s.n}{s.n === current ? " · YOU ARE HERE" : ""}</div>
              <strong>{s.title}</strong>
              <p className="small muted" style={{ margin: "4px 0 0" }}>{s.text}</p>
            </div>
          </Link>
        ))}
      </div>
    </details>
  );
}

export function stageFor(step: NextStep): number {
  switch (step.kind) {
    case "onboarding": case "numbers": case "monthly-numbers": return 1;
    case "goal-result": return 4;
    case "program": return 2;
    case "intake": case "plan-review": return 3;
    default: return 4;
  }
}
