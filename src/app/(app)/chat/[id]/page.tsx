import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getProjectFull } from "@/lib/data";
import { ChatInput } from "@/components/Chat";
import { MessageList } from "@/components/MessageList";
import { chatToProject, deleteChat } from "@/app/actions";
import { PROJECT_CATEGORIES } from "@/lib/program";

export default async function ChatThread({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const { id } = await params;
  const c = await getProjectFull(u, id);
  if (!c || c.status !== "chat") notFound();
  return (
    <>
      <p className="small muted" style={{ margin: 0 }}><Link href="/chat">Ask the coach</Link></p>
      <h1>{c.title}</h1>
      <div className="row" style={{ marginBottom: 12 }}>
        <details className="card" style={{ margin: 0, padding: "10px 14px" }}>
          <summary>Turn into a project</summary>
          <p className="small muted">Keeps this conversation and adds goals, results tracking, an action plan and decisions.</p>
          <form action={chatToProject}>
            <input type="hidden" name="projectId" value={c.id} />
            <label>Project name<input name="title" defaultValue={c.title} required /></label>
            <label>Category<select name="category" defaultValue="other">{Object.entries(PROJECT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
            <label>Goal<input name="goal" placeholder="What will be different?" /></label>
            <button className="btn small" style={{ marginTop: 10 }}>Create project</button>
          </form>
        </details>
        <form action={deleteChat}><input type="hidden" name="projectId" value={c.id} /><button className="btn link small">Delete chat</button></form>
      </div>
      <div className="card">
        <MessageList projectId={c.id} messages={c.messages} />
        <div style={{ marginTop: 14 }}><ChatInput projectId={c.id} suggestions={[]} /></div>
      </div>
    </>
  );
}
