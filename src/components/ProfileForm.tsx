import type { BusinessProfile } from "@prisma/client";
import { saveProfile } from "@/app/actions";
import { ActionForm } from "./ActionForm";
import { PATHWAYS } from "@/lib/program";

export function ProfileForm({ profile, from }: { profile: BusinessProfile | null; from: "onboarding" | "profile" }) {
  const other = (profile?.otherPathways ?? "").split(",");
  return (
    <ActionForm action={saveProfile} submit={from === "onboarding" ? "Save and continue" : "Save profile"}>
      <input type="hidden" name="from" value={from} />
      <h2>1. Your main pathway</h2>
      <p className="small muted">Choose the one that matters most right now. You can add others too.</p>
      {Object.entries(PATHWAYS).map(([key, p]) => (
        <label key={key} style={{ fontWeight: 400 }}>
          <input type="radio" name="pathway" value={key} defaultChecked={profile?.pathway === key} required />{" "}
          <strong>{p.label}</strong>: <span className="muted">{p.description}</span>
        </label>
      ))}
      <label>Also follow these programs <span className="hint">(optional; their activities are added to My program)</span></label>
      <div className="row">
        {Object.entries(PATHWAYS).map(([key, p]) => (
          <label key={key} style={{ fontWeight: 400, margin: 0 }}>
            <input type="checkbox" name="otherPathways" value={key} defaultChecked={other.includes(key)} /> {p.label}
          </label>
        ))}
      </div>

      <h2 style={{ marginTop: 22 }}>2. Your business today</h2>
      <div className="grid g2">
        <label>Stage <span className="hint">(e.g. just qualified, 2 years in, salon with 4 staff)</span><input name="stage" defaultValue={profile?.stage} /></label>
        <label>Team size <span className="hint">(including you)</span><input name="teamSize" defaultValue={profile?.teamSize} /></label>
        <label>Suburb / city<input name="location" defaultValue={profile?.location} /></label>
        <label>Country and state <span className="hint">(rules differ by place)</span><input name="jurisdiction" defaultValue={profile?.jurisdiction} placeholder="e.g. Australia, VIC" /></label>
      </div>
      <label>Services and current prices <span className="hint">(e.g. Lash lift $95, Classic full set $160)</span><textarea name="services" defaultValue={profile?.services} /></label>

      <h2 style={{ marginTop: 22 }}>3. Your capacity and budget</h2>
      <div className="grid g3">
        <label>Appointments you can do per week<input name="capacityPerWeek" defaultValue={profile?.capacityPerWeek} /></label>
        <label>Hours a week for business work<input name="hoursPerWeek" defaultValue={profile?.hoursPerWeek} /></label>
        <label>Monthly marketing budget<input name="marketingBudget" defaultValue={profile?.marketingBudget} placeholder="$" /></label>
      </div>

      <h2 style={{ marginTop: 22 }}>4. Your goal</h2>
      <label>What do you most want to change in the next 90 days?<textarea name="primaryGoal" defaultValue={profile?.primaryGoal} placeholder="e.g. be fully booked Tues–Sat and stop no-shows" /></label>
      <label>Anything the coach should know about how you like to work? <span className="hint">(optional)</span><textarea name="preferences" defaultValue={profile?.preferences} /></label>
      <p className="small muted">Please don&apos;t enter client health information or client contact details. The coach only needs business totals.</p>
    </ActionForm>
  );
}
