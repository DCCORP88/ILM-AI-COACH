import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listChats } from "@/lib/data";
import { NewChat } from "@/components/NewChat";

const SUGGESTIONS = [
  "Based on my numbers, what should I focus on first?",
  "How do I get more clients locally?",
  "Should I raise my prices?",
  "How do I start a loyalty program?",
  "What should I post on Instagram this week?",
  "Am I ready to become an educator?",
];

export default async function Chat() {
  const u = await requireUser();
  const chats = await listChats(u);
  return (
    <>
      <h1>Ask the coach</h1>
      <p className="muted">Ask any business question. The coach knows your business profile and the numbers you&apos;ve lodged. When something turns into real work, turn the chat into a project to track goals, tasks and results.</p>
      <div className="card"><NewChat suggestions={SUGGESTIONS} /></div>
      <div className="card">
        <h2>Previous chats</h2>
        {chats.length === 0 ? <p className="muted">No chats yet.</p> : (
          <ul className="tasks">{chats.map((c) => (
            <li key={c.id} className="row between"><Link href={`/chat/${c.id}`}>{c.title}</Link><span className="small muted">{c.lastActivityAt.toLocaleDateString("en-AU")}</span></li>
          ))}</ul>
        )}
      </div>
      <p className="small muted">The coach is AI. It uses Deanna&apos;s coaching material and your information; it isn&apos;t a personal review by Deanna. Check important advice, and see a qualified professional for tax, legal or health questions.</p>
    </>
  );
}
