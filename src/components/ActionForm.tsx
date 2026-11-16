"use client";
import { useActionState } from "react";
import type { FormState } from "@/app/actions";

export function ActionForm({
  action, children, submit = "Save", className, resetOnOk = false,
}: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  children: React.ReactNode; submit?: string; className?: string; resetOnOk?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className} key={resetOnOk && state?.ok ? state.ok + Date.now() : undefined}>
      {children}
      {state?.error && <div className="notice err" role="alert">{state.error}</div>}
      {state?.ok && <div className="notice ok" role="status">{state.ok}</div>}
      <div style={{ marginTop: 12 }}>
        <button className="btn" disabled={pending}>{pending ? "Saving…" : submit}</button>
      </div>
    </form>
  );
}
