import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { businessPeriods, listProjects } from "@/lib/data";
import { deriveMetrics, formatValue, METRIC_BY_KEY } from "@/lib/metrics";
import { PROJECT_CATEGORIES } from "@/lib/program";

const MARKETING_CATS = ["local-marketing", "loyalty", "digital-marketing", "email", "meta-ads", "retail"];
const QUICK = [
  { cat: "local-marketing", title: "Local salon marketing plan", blurb: "Google profile, reviews, local partnerships and events, built around your dream client." },
  { cat: "loyalty", title: "Loyalty & referral program", blurb: "Reward rebooking, reviews and referrals, using Lash'd's program as an example." },
  { cat: "digital-marketing", title: "Content plan & offer message", blurb: "Content pillars, a month of batched posts, and every post with a next step." },
  { cat: "email", title: "Email list & welcome sequence", blurb: "Consented list, lead magnet and welcome emails. Drafts only; nothing is sent from the app." },
  { cat: "meta-ads", title: "Meta ads campaign plan", blurb: "Plan a cold + retargeting campaign. The app never launches ads or spends money." },
  { cat: "retail", title: "Aftercare & retail sales", blurb: "Recommend aftercare when the client can see the result, and track retail share." },
];
const SHOW = ["enquiries", "new_clients", "google_reviews", "referrals", "loyalty_members", "email_subscribers", "marketing_spend", "ad_spend"];

export default async function Marketing() {
  const u = await requireUser();
  const [periods, projects] = await Promise.all([businessPeriods(u), listProjects(u, { status: "active" })]);
  const latest = periods[0];
  const derived = latest ? deriveMetrics(latest.values) : [];
  const pick = (k: string) => derived.find((d) => d.key === k);
  const mine = projects.filter((p) => MARKETING_CATS.includes(p.category));
  return (
    <>
      <h1>Marketing</h1>
      <p className="muted">Local salon marketing, loyalty and digital marketing, all measured by your numbers. Deanna&apos;s rule: fix retention first, then get local, then go digital, and ads come last.</p>

      <div className="card">
        <div className="row between"><h2>Marketing numbers {latest && <span className="small muted">({latest.periodStart.toLocaleDateString("en-AU", { timeZone: "UTC" })} – {latest.periodEnd.toLocaleDateString("en-AU", { timeZone: "UTC" })})</span>}</h2><Link href="/numbers" className="small">Add / update numbers</Link></div>
        <div className="grid g3">
          {SHOW.map((k) => (
            <div key={k}><div className="small muted">{METRIC_BY_KEY[k].label}</div><div className={latest?.values[k] == null ? "stat empty" : "stat"}>{formatValue(latest?.values[k], METRIC_BY_KEY[k].unit)}</div></div>
          ))}
          {["enquiry_conversion", "cost_per_new_client", "ctr", "cpl", "retail_share"].map((k) => {
            const d = pick(k);
            return <div key={k}><div className="small muted" title={d?.formula}>{d?.label ?? k}</div><div className={d?.value == null ? "stat empty" : "stat"}>{d?.value == null ? "Not enough data" : formatValue(d.value, d.unit)}</div></div>;
          })}
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>Ad leads are Meta-attributed estimates. Check real bookings and revenue in your booking system before deciding an ad worked.</p>
      </div>

      <div className="card">
        <h2>Your marketing projects</h2>
        {mine.length === 0 ? <p className="muted">None yet. Start one below.</p> : (
          <ul>{mine.map((p) => <li key={p.id}><Link href={`/projects/${p.id}`}>{p.title}</Link> <span className="small muted">{PROJECT_CATEGORIES[p.category]} · next: {p.nextStep || "not set"}</span></li>)}</ul>
        )}
      </div>

      <h2>Start a marketing project</h2>
      <div className="grid g3">
        {QUICK.map((q) => (
          <div className="card" key={q.cat}>
            <h3>{q.title}</h3><p className="small muted">{q.blurb}</p>
            <Link className="btn ghost small" href={`/projects?new=${q.cat}&title=${encodeURIComponent(q.title)}#new`}>Start</Link>
          </div>
        ))}
      </div>
      <p className="small muted">Campaign, email and post drafts are saved as resources marked &quot;draft&quot;. This app never publishes posts, sends emails or spends ad money.</p>
    </>
  );
}
