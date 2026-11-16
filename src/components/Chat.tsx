"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessage } from "@/app/actions";

export function ChatInput({ projectId, suggestions }: { projectId: string; suggestions: string[] }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const send = (msg: string) => {
    setError(null);
    start(async () => {
      const res = await sendMessage(projectId, msg);
      if (res.error) { setError(res.error); return; }
      setText("");
      router.refresh();
    });
  };
  return (
    <div>
      {suggestions.length > 0 && (
        <div className="row" style={{ marginBottom: 8 }}>
          {suggestions.map((s) => <button key={s} type="button" className="btn ghost small" disabled={pending} onClick={() => send(s)}>{s}</button>)}
        </div>
      )}
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask your coach… (e.g. Based on my numbers, what should I fix first?)" disabled={pending}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && text.trim()) send(text); }} />
      {error && <div className="notice err" role="alert">{error}</div>}
      <div className="row between" style={{ marginTop: 8 }}>
        <span className="small muted">{pending ? "Coach is thinking. This can take up to a minute…" : "Ctrl/⌘ + Enter to send. The coach is AI."}</span>
        <button className="btn" disabled={pending || !text.trim()} onClick={() => send(text)}>{pending ? "Sending…" : "Send"}</button>
      </div>
    </div>
  );
}
