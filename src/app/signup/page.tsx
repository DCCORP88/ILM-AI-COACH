import Link from "next/link";
import { signup } from "../actions";
import { ActionForm } from "@/components/ActionForm";
import { AuthLayout } from "@/components/AuthLayout";

// Read SIGNUP_INVITE_CODE on each request (not baked in at build time).
export const dynamic = "force-dynamic";

export default function Signup() {
  return (
    <AuthLayout title="Create your account" intro="It takes about a minute. Next, you'll tell your coach a little about your business.">
      <div className="card">
        <ActionForm action={signup} submit="Create account">
          {process.env.SIGNUP_INVITE_CODE && <label>Invite code <span className="hint">(from your invitation)</span><input name="invite" required autoComplete="off" /></label>}
          <label>Business name<input name="businessName" required maxLength={120} autoComplete="organization" /></label>
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password <span className="hint">(at least 10 characters)</span><input name="password" type="password" autoComplete="new-password" minLength={10} required /></label>
        </ActionForm>
      </div>
      <p className="small">Already have an account? <Link href="/login">Log in</Link></p>
      <p className="small muted">Private pilot: by invitation only. No payment is taken.</p>
    </AuthLayout>
  );
}
