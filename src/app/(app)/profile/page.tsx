import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/data";
import { ProfileForm } from "@/components/ProfileForm";
import { ActionForm } from "@/components/ActionForm";
import { deleteAccount } from "@/app/actions";
import { db } from "@/lib/db";
import { Reminders } from "@/components/Reminders";
import { Planner } from "@/components/Planner";
import { providers } from "@/lib/reminders";

export default async function Profile() {
  const u = await requireUser();
  const profile = await getProfile(u);
  const plannerConnected = Boolean((await db.business.findUnique({ where: { id: u.businessId }, select: { calendarToken: true } }))?.calendarToken);
  const [reminderSettings, reminderLogs] = await Promise.all([
    db.reminderSettings.findUnique({ where: { businessId: u.businessId } }),
    db.reminderLog.findMany({ where: { businessId: u.businessId }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  return (
    <>
      <h1>Business profile</h1>
      <p className="muted">These are business-wide facts. Project-specific details (like a campaign budget) live in each project and never overwrite these.
        {profile && <> Last updated {profile.updatedAt.toLocaleDateString("en-AU")}.</>}</p>
      <div className="card"><ProfileForm profile={profile} from="profile" /></div>

      <Planner connected={plannerConnected} />
      <Reminders settings={reminderSettings} logs={reminderLogs} providers={providers()} email={u.email} />

      <h1 style={{ marginTop: 30 }}>Account and privacy</h1>
      <div className="grid g2">
        <div className="card">
          <h2>Membership</h2>
          <p className="small muted">Billing isn&apos;t connected in this prototype. In the paid version this is where you&apos;ll manage your subscription.</p>
          <p className="small">Signed in as {u.email}</p>
        </div>
        <div className="card">
          <h2>Export your data</h2>
          <p className="small muted">Download everything stored for your business: profile, projects, chats, tasks, numbers, resources and check-ins.</p>
          <a className="btn ghost" href="/api/export">Download my data (JSON)</a>
        </div>
      </div>
      <div className="card">
        <h2>Delete account</h2>
        <p className="small muted">Permanently deletes your account and every record for your business. This can&apos;t be undone.</p>
        <ActionForm action={deleteAccount} submit="Delete everything">
          <label>Type DELETE to confirm<input name="confirm" autoComplete="off" /></label>
        </ActionForm>
      </div>
    </>
  );
}
