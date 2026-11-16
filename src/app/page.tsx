import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Wordmark } from "@/components/Wordmark";

const STEPS = [
  ["Know your numbers", "Lodge your monthly figures. They become your starting point, and the coach reads them before advising."],
  ["Start an activity", "Pricing, policies, rebooking, loyalty, local and digital marketing, teaching, team. Press Start and answer a few questions."],
  ["Get your plan", "Your coach builds a tailored plan: what your numbers show, how you'll get there, and weekly tasks."],
  ["Do it and see it", "Tick off tasks, check in weekly, log results and watch your progress toward each goal."],
];

export default async function Home({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const sp = await searchParams;
  if (await getCurrentUser()) redirect("/dashboard");
  return (
    <>
      <header className="topnav"><div className="topnav-inner" style={{ justifyContent: "space-between" }}>
        <Wordmark href="/" />
        <div className="row"><Link className="btn ghost small" href="/login">Log in</Link><Link className="btn small" href="/signup">Create account</Link></div>
      </div></header>
      <main className="hero">
        {sp.deleted && <div className="notice ok">Your account and all its data have been deleted.</div>}
        <div className="eyebrow">Private pilot · International Lash Masters</div>
        <h1 className="display" style={{ fontSize: "2.8rem", margin: "12px 0" }}>Grow your beauty business with a coach that works from your real numbers.</h1>
        <p className="muted" style={{ fontSize: "1.05rem", maxWidth: 640 }}>
          An AI business coach built on Deanna Campese&apos;s methods, for solo beauty artists, salon owners and aspiring educators.
        </p>
        <div className="row" style={{ margin: "24px 0 40px" }}>
          <Link className="btn accent" href="/signup">Start now →</Link>
          <Link className="btn ghost" href="/login">Log in</Link>
        </div>
        <div className="grid g2">
          {STEPS.map(([t, d], i) => (
            <div className="card" key={t} style={{ margin: 0 }}>
              <h2 className="section-title"><span className="num">{i + 1}</span>{t}</h2>
              <p className="small muted" style={{ marginBottom: 0 }}>{d}</p>
            </div>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: 32 }}>The coach is AI. It uses approved coaching material and the information you provide; it isn&apos;t a personal review by Deanna. Results are goals, not guarantees. Pricing and membership terms aren&apos;t final.</p>
      </main>
    </>
  );
}
