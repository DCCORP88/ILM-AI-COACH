import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/data";
import { ProfileForm } from "@/components/ProfileForm";

export default async function Onboarding() {
  const u = await requireUser();
  const profile = await getProfile(u);
  return (
    <>
      <div className="welcome">
        <div className="eyebrow">Welcome to your coach</div>
        <h1 className="display">Let&apos;s get to know your business</h1>
        <p className="muted" style={{ margin: 0 }}>About 5 minutes. Your coach uses this so it never asks you the same thing twice.</p>
        <div className="row" style={{ marginTop: 16, gap: 18 }}>
          {["About your business", "Your starting numbers", "Your first activity"].map((s, i) => (
            <span key={s} className="small" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? "var(--ink)" : "var(--muted)" }}>
              <span className="num" style={{ width: 22, height: 22, fontSize: ".7rem", opacity: i === 0 ? 1 : .45 }}>{i + 1}</span>{s}
            </span>
          ))}
        </div>
      </div>
      <div className="card"><ProfileForm profile={profile} from="onboarding" /></div>
    </>
  );
}
