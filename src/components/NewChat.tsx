"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startChat } from "@/app/actions";

export function NewChat({ suggestions }: { suggestions: string[] }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const go = (msg: string) => {
    setError(null);
    start(async () => {
      const res = await startChat(msg);
      if (res.error) { setError(res.error); return; }
      router.push(`/chat/${res.id}`);
    });
  };
  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} disabled={pending} style={{ minHeight: 110 }}
        placeholder="Ask anything about your beauty business, e.g. How do I get more clients in January?"
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && text.trim()) go(text); }} />
      {error && <div className="notice err" role="alert">{error}</div>}
      <div className="row between" style={{ marginTop: 8 }}>
        <span className="small muted">{pending ? "Coach is thinking. This can take up to a minute…" : "Ctrl/⌘ + Enter to send"}</span>
        <button className="btn" disabled={pending || !text.trim()} onClick={() => go(text)}>{pending ? "Asking…" : "Ask"}</button>
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        {suggestions.map((s) => <button key={s} type="button" className="btn ghost small" disabled={pending} onClick={() => go(s)}>{s}</button>)}
      </div>
    </div>
  );
}
