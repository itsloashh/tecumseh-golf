"use client";
import { useActionState } from "react";
import { signIn } from "@/app/admin/actions";

export function LoginForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <main className="dimples grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <img src="/brand/logo-full-white.png" alt="Tecumseh Golf" width={445} height={471} className="mx-auto w-36" />
        <p className="label mt-5 text-center text-flag">Staff dashboard</p>
        <div className="card mt-6 p-6 shadow-2xl">
          {configured ? (
            <form action={action} className="space-y-4">
              <label className="block"><span className="mb-1.5 block text-[13.5px] font-semibold">Email</span><input name="email" type="email" autoComplete="email" required className="field" /></label>
              <label className="block"><span className="mb-1.5 block text-[13.5px] font-semibold">Password</span><input name="password" type="password" autoComplete="current-password" required className="field" /></label>
              {state?.error && <p role="alert" className="rounded-xl bg-clay/10 px-3.5 py-2.5 text-[14px] text-clay">{state.error}</p>}
              <button disabled={pending} className="btn btn-flag w-full">{pending ? "Signing in…" : "Sign in"}</button>
            </form>
          ) : (
            <div className="space-y-3 text-[14px]">
              <p className="display text-[1.6rem]">Connect Supabase to turn on the dashboard.</p>
              <ol className="list-decimal space-y-1.5 pl-5 text-[13.5px] text-muted">
                <li>Run <code>0001_init.sql</code> then <code>seed.sql</code> in the SQL Editor.</li>
                <li>Add the Supabase env vars in Vercel.</li>
                <li>Create your user under Authentication → Users.</li>
                <li>Add your email to <code>ADMIN_EMAILS</code>.</li>
              </ol>
            </div>
          )}
        </div>
        <a href="/" className="mt-6 block text-center text-[13px] font-semibold text-cream/70 hover:text-cream">← Back to site</a>
      </div>
    </main>
  );
}
