import Link from "next/link";
import { login } from "../actions";
import { ActionForm } from "@/components/ActionForm";
import { AuthLayout } from "@/components/AuthLayout";

export default function Login() {
  return (
    <AuthLayout title="Welcome back" intro="Log in to see your next step.">
      <div className="card">
        <ActionForm action={login} submit="Log in">
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" required /></label>
        </ActionForm>
      </div>
      <p className="small">New here? <Link href="/signup">Create your account</Link></p>
      <p className="small muted">Forgotten your password? Password reset is coming before launch. For now, contact support.</p>
    </AuthLayout>
  );
}
