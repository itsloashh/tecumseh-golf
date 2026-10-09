"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useStore } from "@/lib/store";
import { money } from "@/lib/money";
import { IconBack, IconCheck, IconStore, ProductImage, cx } from "@/components/ui/primitives";

export function CheckoutView() {
  const { snapshot, cart, productById, cartSubtotal, clear, shopper, shopperReady, accountsEnabled } = useStore();
  const router = useRouter();
  const s = snapshot.settings;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState<"pickup" | "card">("pickup");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => { setCancelled(new URLSearchParams(window.location.search).get("cancelled") === "1"); }, []);
  useEffect(() => {
    if (!shopper) return;
    setName((v) => v || shopper.name);
    setEmail((v) => v || shopper.email);
    setPhone((v) => v || shopper.phone);
  }, [shopper]);

  const tax = Math.round(cartSubtotal * s.taxRate);
  const total = cartSubtotal + tax;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const honeypot = String(new FormData(e.currentTarget).get("company") ?? "");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items: cart, name, email, phone, note, payment, company: honeypot }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Something went wrong.");
      if (j.demo) { setDemo(true); return; }
      if (j.url) { window.location.href = j.url; return; }
      clear();
      router.push(`/order/${j.token}?new=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  if (!cart.length) {
    return (
      <div className="mx-auto max-w-xl px-4 pt-16 text-center">
        <h1 className="display text-[3rem]">Your cart is empty</h1>
        <p className="mt-2 text-muted">Add something from the shop and come back here to reserve it.</p>
        <Link href="/shop" className="btn btn-green mt-6">Go to the shop</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
      <Link href="/shop" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-ink"><IconBack size={16} /> Keep shopping</Link>
      <h1 className="display display-i mt-3 text-[3rem] sm:text-[4rem]">Checkout</h1>

      {cancelled && <p className="mt-4 rounded-xl bg-flag/30 px-4 py-3 text-[14px]">Card payment was cancelled — nothing was charged. You can try again or choose pay at pickup.</p>}

      <form onSubmit={submit} className="mt-6 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          {accountsEnabled && shopperReady && !shopper && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-paper px-5 py-4">
              <p className="text-[14px]"><b>Have an account?</b> <span className="text-muted">Sign in to save this order to your history.</span></p>
              <Link href="/account?next=/checkout" className="btn btn-ghost btn-sm">Sign in</Link>
            </div>
          )}

          <section>
            <h2 className="label text-green">1 · Your details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="mb-1.5 block text-[13.5px] font-semibold">Full name</span><input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></label>
              <label><span className="mb-1.5 block text-[13.5px] font-semibold">Email</span><input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
              <label><span className="mb-1.5 block text-[13.5px] font-semibold">Phone <span className="font-normal text-faint">(for pickup)</span></span><input className="field" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" /></label>
              <input name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            </div>
          </section>

          <section>
            <h2 className="label text-green">2 · Pickup & payment</h2>
            <div className="mt-4 flex gap-3.5 rounded-2xl bg-leaf/70 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-green text-cream"><IconStore size={20} /></span>
              <div className="text-[14px]">
                <p className="font-semibold text-green">Pickup at {s.address}, {s.city}</p>
                <p className="mt-0.5 text-ink/75">{s.pickupNote}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment">
              <PayOption on={payment === "pickup"} onClick={() => setPayment("pickup")} title="Pay at pickup" sub="Reserve now, pay in store by card or cash." />
              {snapshot.cardPayments && <PayOption on={payment === "card"} onClick={() => setPayment("card")} title="Pay now by card" sub="Secure checkout with Stripe." />}
            </div>
          </section>

          <section>
            <label><span className="label mb-2 block text-green">3 · Anything we should know? <span className="normal-case tracking-normal text-faint">(optional)</span></span>
              <textarea className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Pickup day, club specs, gift wrap…" maxLength={1000} />
            </label>
          </section>
        </div>

        <aside className="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
          <div className="card p-5">
            <h2 className="display text-[1.7rem]">Order summary</h2>
            <ul className="mt-4 divide-y divide-[var(--line)]">
              {cart.map((l) => {
                const p = productById(l.productId);
                if (!p) return null;
                return (
                  <li key={`${l.productId}-${l.option}`} className="flex gap-3 py-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg"><ProductImage product={p} sizes="56px" /></div>
                    <div className="min-w-0 flex-1 text-[14px]">
                      <p className="font-semibold leading-snug">{p.name}</p>
                      <p className="text-[12.5px] text-muted">{[l.option, `Qty ${l.qty}`].filter(Boolean).join(" · ")}</p>
                    </div>
                    <span className="price text-[1rem]">{money(p.priceCents * l.qty)}</span>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-3 space-y-1.5 border-t border-[var(--line)] pt-4 text-[14px]">
              <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular">{money(cartSubtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">HST ({Math.round(s.taxRate * 1000) / 10}%)</dt><dd className="tabular">{money(tax)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Pickup</dt><dd className="font-semibold text-green">Free</dd></div>
              <div className="flex items-baseline justify-between border-t border-[var(--line)] pt-3"><dt className="font-semibold">Total</dt><dd className="price text-[1.7rem]">{money(total)}</dd></div>
            </dl>
            {error && <p role="alert" className="mt-4 rounded-xl bg-clay/10 px-3.5 py-2.5 text-[14px] text-clay">{error}</p>}
            {demo && (
              <p role="status" className="mt-4 rounded-xl border border-dashed border-clay/50 px-3.5 py-2.5 text-[13.5px] text-clay">
                Preview mode — the shop's database isn't connected yet, so this order wasn't saved.
              </p>
            )}
            <button disabled={busy} className="btn btn-flag mt-5 w-full">
              {busy ? "Placing order…" : payment === "card" ? `Pay ${money(total)}` : "Reserve for pickup"}
            </button>
            <p className="mt-3 text-center text-[12px] text-faint">Prices in CAD. We'll email you a confirmation.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function PayOption({ on, onClick, title, sub }: { on: boolean; onClick: () => void; title: string; sub: string }) {
  return (
    <button type="button" role="radio" aria-checked={on} onClick={onClick} className={cx("flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors", on ? "border-green bg-paper" : "border-[var(--line)] hover:border-[var(--line-strong)]")}>
      <span className={cx("mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2", on ? "border-green bg-green text-cream" : "border-[var(--line-strong)]")}>
        {on && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}><IconCheck size={12} strokeWidth={3} /></motion.span>}
      </span>
      <span>
        <span className="block font-semibold">{title}</span>
        <span className="block text-[13px] text-muted">{sub}</span>
      </span>
    </button>
  );
}
