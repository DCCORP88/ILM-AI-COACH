import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listProjects } from "@/lib/data";
import { createProject } from "@/app/actions";
import { ActionForm } from "@/components/ActionForm";
import { PROJECT_CATEGORIES } from "@/lib/program";

export default async function Projects({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; category?: string; new?: string; title?: string; step?: string }> }) {
  const u = await requireUser();
  const sp = await searchParams;
  const status = sp.status ?? "active";
  const projects = await listProjects(u, { status, q: sp.q, category: sp.category });
  return (
    <>
      <h1>Projects</h1>
      <p className="muted">Each piece of work gets its own project with its own coach chat, goals, results, tasks and decisions, so nothing gets mixed up.</p>
      <div className="card">
        <form className="row" method="get">
          <input name="q" placeholder="Search projects" defaultValue={sp.q} style={{ maxWidth: 260 }} />
          <select name="status" defaultValue={status} style={{ maxWidth: 160 }}>
            <option value="active">Active</option><option value="completed">Completed</option><option value="archived">Archived</option><option value="all">All</option>
          </select>
          <select name="category" defaultValue={sp.category ?? ""} style={{ maxWidth: 220 }}>
            <option value="">All categories</option>
            {Object.entries(PROJECT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className="btn ghost small">Filter</button>
        </form>
        {projects.length === 0 ? <p className="muted" style={{ marginTop: 12 }}>No projects match.</p> : (
          <div className="table-wrap" style={{ marginTop: 12 }}><table>
            <thead><tr><th>Project</th><th>Category</th><th>Stage</th><th>Next step</th><th>Tasks done</th><th>Last activity</th></tr></thead>
            <tbody>{projects.map((p) => {
              const done = p.tasks.filter((t) => t.status === "done").length;
              return (
                <tr key={p.id}>
                  <td><Link href={`/projects/${p.id}`}>{p.title}</Link> {p.status !== "active" && <span className="badge">{p.status}</span>}</td>
                  <td className="small">{PROJECT_CATEGORIES[p.category] ?? p.category}</td>
                  <td className="small">{p.stage}</td>
                  <td className="small">{p.nextStep || <span className="muted">Not set</span>}</td>
                  <td className="small">{p.tasks.length ? `${done}/${p.tasks.length}` : "-"}</td>
                  <td className="small">{p.lastActivityAt.toLocaleDateString("en-AU")}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        )}
      </div>
      <div className="card" id="new">
        <h2>Start a new project</h2>
        <ActionForm action={createProject} submit="Create project">
          <input type="hidden" name="stepKey" value={sp.step ?? ""} />
          <div className="grid g2">
            <label>Name<input name="title" required defaultValue={sp.title} placeholder="e.g. Christmas client campaign" /></label>
            <label>Category
              <select name="category" defaultValue={sp.new ?? "other"}>
                {Object.entries(PROJECT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label>Goal <span className="hint">(what will be different?)</span><input name="goal" placeholder="e.g. 20 extra bookings in December" /></label>
            <label>Target date<input type="date" name="targetDate" /></label>
          </div>
        </ActionForm>
      </div>
    </>
  );
}
