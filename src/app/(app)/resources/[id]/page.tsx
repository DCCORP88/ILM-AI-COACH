import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getResource } from "@/lib/data";
import { ActionForm } from "@/components/ActionForm";
import { deleteResource, saveResourceVersion } from "@/app/actions";

export default async function ResourcePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string }> }) {
  const u = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const r = await getResource(u, id);
  if (!r) notFound();
  const current = r.versions[0];
  const viewing = sp.v ? r.versions.find((v) => String(v.version) === sp.v) ?? current : current;
  return (
    <>
      <p className="small muted"><Link href="/resources">Saved resources</Link>{r.project && <> · <Link href={`/projects/${r.project.id}`}>{r.project.title}</Link></>}</p>
      <h1>{r.title} <span className="badge">{r.status}</span></h1>
      {r.status !== "sent-externally" && <p className="small muted">Draft: not sent or published. This app never sends or posts anything for you.</p>}
      <div className="card">
        <ActionForm action={saveResourceVersion} submit="Save new version">
          <input type="hidden" name="resourceId" value={r.id} />
          <div className="grid g2">
            <label>Title<input name="title" defaultValue={r.title} /></label>
            <label>Status
              <select name="status" defaultValue={r.status}><option value="draft">Draft</option><option value="approved">Approved by me</option><option value="sent-externally">I&apos;ve used/sent this outside the app</option></select>
            </label>
          </div>
          <label>Content {viewing && viewing !== current && <span className="hint">(showing version {viewing.version}; saving makes it the newest version)</span>}<textarea name="content" defaultValue={viewing?.content} style={{ minHeight: 320 }} /></label>
        </ActionForm>
      </div>
      <div className="grid g2">
        <div className="card"><h3>Versions</h3>
          <ul>{r.versions.map((v) => <li key={v.id}><Link href={`/resources/${r.id}?v=${v.version}`}>Version {v.version}</Link> <span className="small muted">{v.createdAt.toLocaleString("en-AU")}</span></li>)}</ul>
        </div>
        <div className="card"><h3>Download or delete</h3>
          <a className="btn ghost small" href={`/api/resources/${r.id}`}>Download (.md)</a>
          <form action={deleteResource} style={{ marginTop: 10 }}><input type="hidden" name="resourceId" value={r.id} /><button className="btn link small">Delete this resource and all versions</button></form>
        </div>
      </div>
    </>
  );
}
