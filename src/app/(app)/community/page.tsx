import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { ActionForm } from "@/components/ActionForm";
import { addComment, createPost, deleteComment, deletePost, joinCommunity, moderatePost, reportPost, toggleLike } from "@/app/actions";

const CATS: Record<string, string> = { all: "All", wins: "Wins", questions: "Questions", marketing: "Marketing", education: "Educators", general: "General" };
const ago = (d: Date) => {
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  if (m < 1) return "just now"; if (m < 60) return `${m}m`; const h = Math.round(m / 60); if (h < 24) return `${h}h`;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
};
const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

function Avatar({ name }: { name: string }) {
  return <span aria-hidden="true" style={{ display: "inline-grid", placeItems: "center", width: 36, height: 36, borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 600, fontSize: ".78rem", flex: "none" }}>{initials(name)}</span>;
}

export default async function Community({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const u = await requireUser();
  const sp = await searchParams;
  const cat = sp.c && CATS[sp.c] ? sp.c : "all";
  const admin = isAdmin(u.email);
  const me = await db.communityMember.findUnique({ where: { businessId: u.businessId } });
  const external = process.env.COMMUNITY_EXTERNAL_URL;

  if (!me || me.banned) {
    return (
      <>
        <div className="welcome">
          <div className="eyebrow">Community</div>
          <h1 className="display">Share wins, ask questions, grow together</h1>
          <p className="muted" style={{ margin: 0 }}>A private space for ILM Business Coach members. Celebrate results, ask other owners and educators for ideas, and learn from each other.</p>
        </div>
        {me?.banned ? <div className="notice err">Your community access has been paused. Contact support if you think this is a mistake.</div> : (
          <div className="card">
            <h2>Join the community</h2>
            <p className="small muted">Only your display name is shown to other members. Your business numbers, projects and coach chats are never visible here.</p>
            <ActionForm action={joinCommunity} submit="Join">
              <label>Display name <span className="hint">(e.g. your first name + business, &quot;Sam · Brow Bar Geelong&quot;)</span><input name="displayName" required maxLength={60} /></label>
              <label>Short bio <span className="hint">(optional)</span><input name="bio" maxLength={200} placeholder="Lash artist, 3 years in, building my first course" /></label>
              <Guidelines />
              <label style={{ fontWeight: 400 }}><input type="checkbox" name="guidelines" /> I agree to the community guidelines.</label>
            </ActionForm>
          </div>
        )}
        {external && <p className="small">Also join our group: <a href={external} target="_blank" rel="noopener noreferrer">{external}</a></p>}
      </>
    );
  }

  const posts = await db.communityPost.findMany({
    where: { ...(cat !== "all" ? { category: cat } : {}), ...(admin ? {} : { OR: [{ hidden: false }, { businessId: u.businessId }] }) },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 50,
    include: {
      business: { select: { communityMember: { select: { displayName: true } } } },
      likes: { select: { businessId: true } },
      comments: { where: admin ? {} : { hidden: false }, orderBy: { createdAt: "asc" }, include: { business: { select: { communityMember: { select: { displayName: true } } } } } },
      reports: admin ? { where: { resolved: false } } : false,
    },
  });

  return (
    <>
      <div className="welcome">
        <div className="eyebrow">Community</div>
        <h1 className="display">Hi {me.displayName}</h1>
        <p className="muted" style={{ margin: 0 }}>Share a win, ask a question, help someone else. Be kind and keep client details private.</p>
      </div>

      <div className="card">
        <h2>Start a post</h2>
        <ActionForm action={createPost} submit="Post" resetOnOk>
          <div className="row" style={{ gap: 12, flexWrap: "nowrap", alignItems: "flex-start" }}>
            <Avatar name={me.displayName} />
            <div style={{ flex: 1 }}>
              <textarea name="body" required maxLength={3000} placeholder="Share a win, ask a question or offer a tip…" style={{ minHeight: 80 }} />
              <label>Topic
                <select name="category" defaultValue="general">{Object.entries(CATS).filter(([k]) => k !== "all").map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              </label>
            </div>
          </div>
        </ActionForm>
      </div>

      <div className="pills" style={{ marginBottom: 14 }} role="group" aria-label="Filter posts">
        {Object.entries(CATS).map(([k, v]) => <Link key={k} href={`/community${k === "all" ? "" : `?c=${k}`}`} className={`pill${k === cat ? " active" : ""}`}>{v}</Link>)}
      </div>

      {posts.length === 0 && <div className="card"><p className="muted" style={{ margin: 0 }}>No posts here yet. Be the first!</p></div>}
      {posts.map((p) => {
        const name = p.business.communityMember?.displayName ?? "Member";
        const liked = p.likes.some((l) => l.businessId === u.businessId);
        const mine = p.businessId === u.businessId;
        return (
          <article key={p.id} className="card" style={p.hidden ? { opacity: .6 } : undefined}>
            <div className="row between" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
              <div className="row" style={{ gap: 10, flexWrap: "nowrap" }}>
                <Avatar name={name} />
                <div><strong>{name}</strong><div className="small muted">{ago(p.createdAt)} · {CATS[p.category] ?? p.category}</div></div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                {p.pinned && <span className="badge">Pinned</span>}
                {p.hidden && <span className="badge bad">Hidden</span>}
                {admin && Array.isArray(p.reports) && p.reports.length > 0 && <span className="badge bad">{p.reports.length} report{p.reports.length === 1 ? "" : "s"}</span>}
              </div>
            </div>
            <p className="pre" style={{ margin: "12px 0" }}>{p.body}</p>
            <div className="row" style={{ gap: 14, borderTop: "1px solid var(--line)", paddingTop: 8 }}>
              <form action={toggleLike}><input type="hidden" name="postId" value={p.id} /><button className="btn link small" style={{ textDecoration: "none", fontWeight: liked ? 700 : 500 }} aria-pressed={liked}>{liked ? "♥" : "♡"} {p.likes.length || ""} {liked ? "Liked" : "Like"}</button></form>
              <span className="small muted">{p.comments.length} comment{p.comments.length === 1 ? "" : "s"}</span>
              {(mine || admin) && <form action={deletePost}><input type="hidden" name="postId" value={p.id} /><button className="btn link small">Delete</button></form>}
              {!mine && (
                <details><summary className="small" style={{ color: "var(--muted)", fontWeight: 500 }}>Report</summary>
                  <form action={reportPost} className="row" style={{ marginTop: 6 }}><input type="hidden" name="postId" value={p.id} /><input name="reason" placeholder="What's wrong?" style={{ maxWidth: 240 }} /><button className="btn ghost small">Send report</button></form>
                </details>
              )}
              {admin && (
                <span className="row" style={{ gap: 6 }}>
                  {[[p.pinned ? "unpin" : "pin", p.pinned ? "Unpin" : "Pin"], [p.hidden ? "unhide" : "hide", p.hidden ? "Unhide" : "Hide"], ...(Array.isArray(p.reports) && p.reports.length ? [["resolve", "Mark reports resolved"]] : []), ...(!mine ? [["ban", "Pause member"]] : [])].map(([a, l]) => (
                    <form key={a} action={moderatePost}><input type="hidden" name="postId" value={p.id} /><input type="hidden" name="action" value={a} /><button className="btn ghost small">{l}</button></form>
                  ))}
                </span>
              )}
            </div>
            {p.comments.length > 0 && (
              <div style={{ marginTop: 10 }}>
                {p.comments.map((c) => (
                  <div key={c.id} className="row" style={{ gap: 10, flexWrap: "nowrap", alignItems: "flex-start", padding: "8px 0" }}>
                    <Avatar name={c.business.communityMember?.displayName ?? "Member"} />
                    <div style={{ background: "var(--surface-2)", borderRadius: 10, padding: "8px 12px", flex: 1, minWidth: 0 }}>
                      <div className="small"><strong>{c.business.communityMember?.displayName ?? "Member"}</strong> <span className="muted">· {ago(c.createdAt)}</span></div>
                      <div className="pre small">{c.body}</div>
                      {(c.businessId === u.businessId || admin) && <form action={deleteComment}><input type="hidden" name="commentId" value={c.id} /><button className="btn link small">Delete</button></form>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!p.hidden && (
              <form action={addComment} className="row" style={{ marginTop: 8, flexWrap: "nowrap" }}>
                <input type="hidden" name="postId" value={p.id} />
                <input name="body" placeholder="Write a comment…" maxLength={1500} required />
                <button className="btn small">Reply</button>
              </form>
            )}
          </article>
        );
      })}
      <details className="card"><summary>Community guidelines</summary><Guidelines /></details>
      {external && <p className="small">Also join our group: <a href={external} target="_blank" rel="noopener noreferrer">{external}</a></p>}
    </>
  );
}

function Guidelines() {
  return (
    <ul className="small muted">
      <li>Be kind and supportive. We&apos;re all building something.</li>
      <li>Never share client names, photos without consent, health details or anyone&apos;s personal information.</li>
      <li>No spam, selling or recruiting without permission.</li>
      <li>Advice from members is their experience, not professional, legal or medical advice.</li>
      <li>Moderators may hide posts or pause members who break these guidelines.</li>
    </ul>
  );
}
