"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { browserSupabase } from "@/lib/auth/client";
import { IconMail, cx } from "@/components/ui/primitives";

type Mode = "signin" | "signup" | "forgot";

export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);
  const [next, setNext] = useState("/account");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const n = p.get("next");
    if (n?.startsWith("/") && !n.startsWith("//")) setNext(n);
    if (p.get("link") === "expired") setExpired(true);
    if (p.get("mode") === "signup") setMode("signup");
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sb = browserSupabase();
    if (!sb) return;
    setBusy(true); setError(null);
    const origin = window.location.origin;
    try {
      if (mode === "signin") {
        const { error } = await sb.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: pw });
        if (error) throw new Error(/confirm/i.test(error.message) ? "Please confirm your email first — check your inbox for the link." : "That email and password don't match.");
        router.replace(next);
        router.refresh();
      } else if (mode === "signup") {
        if (pw.length < 8) throw new Error("Use at least 8 characters for your password.");
        const { data, error } = await sb.auth.signUp({
          email: email.trim().toLowerCase(), password: pw,
          options: { data: { name: name.trim(), phone: phone.trim() }, emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}` },
        });
        if (error) throw new Error(error.message);
        if (data.session) { router.replace(next); router.refresh(); } else setSent("confirm");
      } else {
        const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${origin}/auth/confirm?next=/account/reset` });
        if (error) throw new Error(error.message);
        setSent("reset");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 pt-10 sm:px-6 sm:pt-14 md:grid-cols-[1fr_440px] md:items-start">
      <div className="hidden md:block">
        <p className="label text-green">Your account</p>
        <h1 className="display display-i mt-2 text-[4.4rem] leading-[0.86]">Members of the <span className="text-green">pro shop.</span></h1>
        <ul className="mt-8 space-y-3 text-[15.5px]">
          {["Every order and pickup status in one place", "Faster checkout — your details are remembered", "Track fitting, lesson and repair requests"].map((t) => (
            <li key={t} className="flex gap-3"><span className="mt-2 size-2 shrink-0 rounded-full bg-flag-deep" />{t}</li>
          ))}
        </ul>
        <img src="/brand/mascot.png" alt="" width={340} height={420} className="mt-10 w-32 opacity-90" />
      </div>

      <div className="card p-6 sm:p-7">
        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div key="sent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="py-6 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-leaf text-green"><IconMail size={26} /></span>
              <h2 className="display mt-4 text-[2rem]">Check your email</h2>
              <p className="mt-2 text-[14.5px] text-muted">
                {sent === "confirm" ? <>We sent a confirmation link to <b className="text-ink">{email}</b>. Tap it to finish creating your account.</> : <>If <b className="text-ink">{email}</b> has an account, a reset link is on its way.</>}
              </p>
              <p className="mt-3 text-[12.5px] text-faint">Not there? Check spam — the link expires in 24 hours.</p>
              <button onClick={() => { setSent(null); setMode("signin"); setPw(""); }} className="btn btn-green mt-6 w-full">Back to sign in</button>
            </motion.div>
          ) : (
            <motion.form key={mode} onSubmit={submit} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {mode !== "forgot" ? (
                <div className="grid grid-cols-2 rounded-full bg-ink/5 p-1" role="tablist">
                  {(["signin", "signup"] as const).map((m) => (
                    <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(null); }} className={cx("relative h-10 rounded-full text-[14px] font-semibold", mode === m ? "text-cream" : "text-muted")}>
                      {mode === m && <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-full bg-ink" />}
                      <span className="relative">{m === "signin" ? "Sign in" : "Create account"}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div><h2 className="display text-[2rem]">Reset password</h2><p className="text-[14px] text-muted">We'll email you a link to choose a new one.</p></div>
              )}
              {expired && <p className="rounded-xl bg-flag/30 px-3.5 py-2.5 text-[13.5px]">That link expired or was already used. Sign in, or request a new one.</p>}

              {mode === "signup" && (
                <>
                  <label className="block"><span className="mb-1.5 block text-[13.5px] font-semibold">Name</span><input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></label>
                  <label className="block"><span className="mb-1.5 block text-[13.5px] font-semibold">Phone <span className="font-normal text-faint">(optional)</span></span><input className="field" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" /></label>
                </>
              )}
              <label className="block"><span className="mb-1.5 block text-[13.5px] font-semibold">Email</span><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
              {mode !== "forgot" && (
                <label className="block">
                  <span className="mb-1.5 flex justify-between text-[13.5px] font-semibold">Password
                    {mode === "signin" && <button type="button" onClick={() => { setMode("forgot"); setError(null); }} className="font-normal text-green hover:underline">Forgot?</button>}
                  </span>
                  <input className="field" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={mode === "signup" ? 8 : undefined} required />
                  {mode === "signup" && <span className="mt-1 block text-[12px] text-faint">At least 8 characters</span>}
                </label>
              )}
              {error && <p role="alert" className="rounded-xl bg-clay/10 px-3.5 py-2.5 text-[14px] text-clay">{error}</p>}
              <button disabled={busy} className="btn btn-flag w-full">
                {busy ? "One sec…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create my account" : "Send reset link"}
              </button>
              {mode === "forgot" && <button type="button" onClick={() => setMode("signin")} className="w-full text-center text-[14px] font-semibold text-muted hover:text-ink">← Back to sign in</button>}
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
