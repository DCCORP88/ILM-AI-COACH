import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { newResource } from "@/app/actions";

export default async function Resources() {
  const u = await requireUser();
  const list = await db.resource.findMany({ where: { businessId: u.businessId }, orderBy: { updatedAt: "desc" }, include: { project: { select: { title: true } }, versions: { select: { version: true }, orderBy: { version: "desc" }, take: 1 } } });
  return (
    <>
      <h1>Saved resources</h1>
      <p className="muted">Scripts, SOPs, campaigns, email drafts and plans you&apos;ve saved. Every edit creates a new version.</p>
      <div className="card">
        {list.length === 0 ? <p className="muted">Nothing saved yet. Use &quot;Save as resource&quot; under any coach answer.</p> : (
          <div className="table-wrap"><table><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Project</th><th>Version</th><th>Updated</th></tr></thead>
            <tbody>{list.map((r) => <tr key={r.id}><td><Link href={`/resources/${r.id}`}>{r.title}</Link></td><td className="small">{r.kind}</td><td><span className={`badge ${r.status === "approved" ? "ok" : ""}`}>{r.status}</span></td><td className="small">{r.project?.title ?? "-"}</td><td className="small">v{r.versions[0]?.version ?? 1}</td><td className="small">{r.updatedAt.toLocaleDateString("en-AU")}</td></tr>)}</tbody>
          </table></div>
        )}
      </div>
      <details className="card"><summary>+ New blank resource</summary>
        <form action={newResource}><label>Title<input name="title" required /></label><label>Content<textarea name="content" /></label><button className="btn small">Create</button></form>
      </details>
    </>
  );
}
