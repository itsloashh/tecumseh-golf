"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useStore } from "@/lib/store";
import { IconCheck, IconPhone } from "@/components/ui/primitives";

const TIMES = ["Morning", "Afternoon", "Evening", "Any time"];
const PROMPT: Record<string, string> = {
  fitting: "Which clubs are you looking at? Current handicap, typical ball flight, anything you'd like to fix…",
  lessons: "Your experience level, what you'd like to work on, and whether it's for you or a junior…",
  repairs: "Which clubs, how many grips, grip size/model if you know it, shaft details…",
};

export function BookView() {
  const { snapshot, shopper } = useStore();
  const services = snapshot.services.filter((v) => v.bookable);
  const s = snapshot.settings;
  const [service, setService] = useState(services[0]?.slug ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("Any time");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<null | "live" | "demo">(null);
  const [today, setToday] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("service");
    if (p && services.some((v) => v.slug === p)) setService(p);
    setToday(new Date().toLocaleDateString("en-CA", { timeZone: "America/Toronto" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!shopper) return;
    setName((v) => v || shopper.name); setEmail((v) => v || shopper.email); setPhone((v) => v || shopper.phone);
  }, [shopper]);

  const current = services.find((v) => v.slug === service);
  const tel = s.phone.replace(/[^0-9+]/g, "");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ service, date: date || null, time, name, email, phone, details, company: new FormData(e.currentTarget).get("company") }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Something went wrong.");
      setDone(j.demo ? "demo" : "live");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12">
      <p className="label text-green">Book with the pros</p>
      <h1 className="display display-i mt-2 text-[3.2rem] sm:text-[4.4rem]">Request a time</h1>
      <p className="mt-2 max-w-xl text-[15px] text-muted">Tell us what you need and when works — we'll call or email to lock in a time.</p>

      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="done" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-3xl bg-green p-8 text-cream">
            <span className="grid size-12 place-items-center rounded-full bg-flag text-ink"><IconCheck size={24} strokeWidth={2.6} /></span>
            <h2 className="display mt-5 text-[2.4rem]">{done === "demo" ? "Preview only" : "Request sent!"}</h2>
            <p className="mt-2 max-w-md text-cream/85">
              {done === "demo"
                ? "The shop's database isn't connected yet, so this request wasn't saved."
                : `Thanks ${name.split(" ")[0]} — we'll be in touch shortly to confirm your ${current?.title.toLowerCase() ?? "appointment"}.`}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-flag">Browse the shop</Link>
              <button onClick={() => { setDone(null); setDetails(""); }} className="btn btn-ghost-dark">Send another</button>
            </div>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 space-y-8">
            <fieldset>
              <legend className="label mb-3 text-ink">What do you need?</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {services.map((v) => (
                  <button key={v.slug} type="button" onClick={() => setService(v.slug)} aria-pressed={service === v.slug}
                    className="rounded-2xl border-2 p-4 text-left transition-colors aria-pressed:border-green aria-pressed:bg-paper border-[var(--line)] hover:border-[var(--line-strong)]">
                    <span className="display block text-[1.5rem] leading-none">{v.title}</span>
                    <span className="mt-1.5 block text-[12.5px] text-muted">{v.priceLabel || "Ask for pricing"}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="mb-1.5 block text-[13.5px] font-semibold">Preferred day <span className="font-normal text-faint">(optional)</span></span>
                <input type="date" className="field" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
              <fieldset>
                <legend className="mb-1.5 block text-[13.5px] font-semibold">Time of day</legend>
                <div className="flex flex-wrap gap-2">{TIMES.map((t) => <button key={t} type="button" className="chip !h-12 !rounded-xl" aria-pressed={time === t} onClick={() => setTime(t)}>{t}</button>)}</div>
              </fieldset>
            </div>

            <label className="block"><span className="mb-1.5 block text-[13.5px] font-semibold">Details</span>
              <textarea className="field" value={details} onChange={(e) => setDetails(e.target.value)} placeholder={PROMPT[service] ?? "Anything we should know…"} maxLength={2000} />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="mb-1.5 block text-[13.5px] font-semibold">Name</span><input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></label>
              <label><span className="mb-1.5 block text-[13.5px] font-semibold">Email</span><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
              <label><span className="mb-1.5 block text-[13.5px] font-semibold">Phone</span><input className="field" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" /></label>
              <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            </div>

            {error && <p role="alert" className="rounded-xl bg-clay/10 px-4 py-3 text-[14px] text-clay">{error}</p>}
            <div className="flex flex-wrap items-center gap-4">
              <button disabled={busy || !service} className="btn btn-flag">{busy ? "Sending…" : "Send request"}</button>
              {tel && <a href={`tel:${tel}`} className="inline-flex items-center gap-2 text-[14px] font-semibold text-green"><IconPhone size={18} /> Or call {s.phone}</a>}
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
