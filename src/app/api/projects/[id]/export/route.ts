import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getProjectFull } from "@/lib/data";
import { METRIC_BY_KEY } from "@/lib/metrics";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { id } = await params;
  const p = await getProjectFull(u, id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const d = (x?: Date | null) => (x ? x.toISOString().slice(0, 10) : "");
  const md = [
    `# ${p.title}`, ``, `Goal: ${p.goal}`, `Stage: ${p.stage} · Status: ${p.status} · Target date: ${d(p.targetDate)}`, ``,
    `## Summary`, p.summary || "_none_", ``, `## Next step`, p.nextStep || "_none_", ``,
    `## Goals and results`,
    ...p.goals.map((g) => `- ${METRIC_BY_KEY[g.metricKey]?.label ?? g.metricKey}: baseline ${g.baselineValue ?? "-"} → target ${g.targetValue ?? "-"} by ${d(g.targetDate)}`),
    ...p.metrics.map((r) => `  - Result ${METRIC_BY_KEY[r.metricKey]?.label ?? r.metricKey} ${d(r.periodStart)}–${d(r.periodEnd)}: ${r.value} (${r.source})`),
    ``, `## Tasks`, ...p.tasks.map((t) => `- [${t.status === "done" ? "x" : " "}] ${t.title}${t.dueDate ? ` (due ${d(t.dueDate)})` : ""}${t.outcome ? ` — ${t.outcome}` : ""}`),
    ``, `## Decisions`, ...p.decisions.map((x) => `- ${d(x.createdAt)}: ${x.text}`),
    ``, `## Coach conversation`, ...p.messages.map((m) => `### ${m.role === "user" ? "You" : "Coach (AI)"} — ${m.createdAt.toISOString().slice(0, 16).replace("T", " ")}\n\n${m.content}\n`),
  ].join("\n");
  return new NextResponse(md, { headers: { "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="project-${p.id}.md"` } });
}
