import type { Message } from "@prisma/client";
import { Markdown } from "./Markdown";
import { addTask, saveAsResource, saveDecision } from "@/app/actions";

export function MessageList({ projectId, messages, empty }: { projectId: string; messages: Message[]; empty?: string }) {
  const p = { id: projectId };
  return (
        <div className="chat">
          {messages.length === 0 && <p className="muted">{empty ?? "No messages yet. Try one of the suggestions below, or ask your own question."}</p>}
          {messages.map((m) => {
            let meta: { mode?: string; content?: string[] } = {};
            try { meta = m.meta ? JSON.parse(m.meta) : {}; } catch {}
            return (
              <div key={m.id} className={`msg ${m.role}`}>
                {m.role === "assistant" ? <Markdown text={m.content} /> : <div className="pre">{m.content}</div>}
                {m.role === "assistant" && (
                  <>
                    {meta.content && meta.content.length > 0 && <p className="small muted" style={{ marginTop: 8 }}>Coaching material used: {meta.content.join(" · ")}{meta.mode === "demo" ? " · DEMO" : ""}</p>}
                    <div className="msg-actions">
                      <details><summary>Save as task</summary>
                        <form action={addTask}><input type="hidden" name="projectId" value={p.id} />
                          <input name="title" defaultValue={(m.content.match(/\*\*Next action:\*\*\s*(.+)/)?.[1] ?? "").slice(0, 280)} placeholder="Task" required />
                          <div className="row" style={{ marginTop: 6 }}><input type="date" name="dueDate" style={{ maxWidth: 170 }} /><button className="btn small">Add task</button></div>
                        </form>
                      </details>
                      <details><summary>Save as decision</summary>
                        <form action={saveDecision}><input type="hidden" name="projectId" value={p.id} /><input type="hidden" name="source" value="coach" />
                          <textarea name="text" placeholder="Write the decision you agreed (in your words)" required />
                          <button className="btn small">Save decision</button>
                        </form>
                      </details>
                      <details><summary>Save as resource</summary>
                        <form action={saveAsResource}><input type="hidden" name="projectId" value={p.id} /><input type="hidden" name="content" value={m.content} />
                          <input name="title" placeholder="Title, e.g. Rebooking scripts" required />
                          <div className="row" style={{ marginTop: 6 }}>
                            <select name="kind" style={{ maxWidth: 180 }}><option value="draft">Working draft</option><option value="script">Script</option><option value="sop">SOP</option><option value="campaign">Campaign</option><option value="email">Email draft</option><option value="course-outline">Course outline</option><option value="plan">Plan</option></select>
                            <button className="btn small">Save resource</button>
                          </div>
                        </form>
                      </details>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
  );
}
