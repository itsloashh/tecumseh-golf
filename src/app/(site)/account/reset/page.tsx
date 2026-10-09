"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { browserSupabase } from "@/lib/auth/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) { setError("Use at least 8 characters."); return; }
    setBusy(true); setError(null);
    const { error } = (await browserSupabase()?.auth.updateUser({ password: pw })) ?? { error: new Error("Not available") };
    setBusy(false);
    if (error) { setError("That reset link has expired — request a new one from the sign-in page."); return; }
    router.replace("/account");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-md px-4 pt-14">
      <h1 className="display text-[3rem]">New password</h1>
      <form onSubmit={submit} className="card mt-6 space-y-4 p-6">
        <label className="block"><span className="mb-1.5 block text-[13.5px] font-semibold">New password</span>
          <input className="field" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" minLength={8} required />
        </label>
        {error && <p role="alert" className="rounded-xl bg-clay/10 px-3.5 py-2.5 text-[14px] text-clay">{error}</p>}
        <button disabled={busy} className="btn btn-flag w-full">{busy ? "Saving…" : "Save password"}</button>
      </form>
    </div>
  );
}
