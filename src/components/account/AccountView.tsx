"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { Customer, Order, ServiceRequest } from "@/lib/types";
import { money } from "@/lib/money";
import { browserSupabase } from "@/lib/auth/client";
import { updateProfile } from "@/app/(site)/account/actions";
import { IconArrow, cx } from "@/components/ui/primitives";

const ORDER_LABEL: Record<Order["status"], string> = { awaiting_payment: "Awaiting payment", new: "Received", ready: "Ready for pickup", completed: "Picked up", cancelled: "Cancelled" };
const REQ_LABEL: Record<ServiceRequest["status"], string> = { new: "Sent", contacted: "We've been in touch", scheduled: "Scheduled", completed: "Done", cancelled: "Cancelled" };
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Toronto" });

export function AccountView({ customer, orders, requests }: { customer: Customer; orders: Order[]; requests: ServiceRequest[] }) {
  const router = useRouter();
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [marketing, setMarketing] = useState(customer.marketing);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [welcome, setWelcome] = useState(false);
  useEffect(() => setWelcome(new URLSearchParams(window.location.search).get("welcome") === "1"), []);

  const ready = orders.filter((o) => o.status === "ready");
  const save = () => start(async () => {
    const r = await updateProfile({ name, phone, marketing });
    setMsg(r.ok ? "Saved" : r.error ?? "Couldn't save");
    setTimeout(() => setMsg(null), 2500);
  });
  const signOut = async () => {
    await browserSupabase()?.auth.signOut();
    router.replace("/account");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 sm:pt-12">
      {welcome && <p className="mb-6 rounded-2xl bg-green px-5 py-4 text-[15px] text-cream"><b>You're in!</b> Your account is confirmed.</p>}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-green">My account</p>
          <h1 className="display display-i mt-2 text-[3.2rem] sm:text-[4.2rem]">Hey {customer.name.split(" ")[0] || "golfer"}.</h1>
          <p className="text-[14px] text-muted">{customer.email}</p>
        </div>
        <button onClick={signOut} className="btn btn-ghost btn-sm">Sign out</button>
      </div>

      {ready.length > 0 && (
        <Link href={`/order/${ready[0].token}`} className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-flag px-5 py-4">
          <span><b>Order #{ready[0].number} is ready for pickup.</b> <span className="text-ink/75">Come grab it at the counter.</span></span>
          <IconArrow />
        </Link>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
        <section>
          <h2 className="label text-ink">Orders</h2>
          {orders.length ? (
            <ul className="card mt-3 divide-y divide-[var(--line)]">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/order/${o.token}`} className="flex items-center gap-4 p-4 hover:bg-ink/[0.02]">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">#{o.number} <span className="font-normal text-muted">· {fmtDate(o.createdAt)}</span></p>
                      <p className="truncate text-[13.5px] text-muted">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
                    </div>
                    <div className="text-right">
                      <p className="price text-[1.05rem]">{money(o.totalCents)}</p>
                      <p className={cx("text-[12.5px] font-semibold", o.status === "ready" ? "text-flag-deep" : o.status === "cancelled" ? "text-faint" : "text-green")}>{ORDER_LABEL[o.status]}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="dimples-soft mt-3 rounded-2xl border border-dashed border-[var(--line-strong)] p-8 text-center">
              <p className="display text-[1.7rem]">No orders yet</p>
              <Link href="/shop" className="btn btn-green btn-sm mt-4">Start shopping</Link>
            </div>
          )}

          {requests.length > 0 && (
            <>
              <h2 className="label mt-10 text-ink">Fittings, lessons & repairs</h2>
              <ul className="card mt-3 divide-y divide-[var(--line)]">
                {requests.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-semibold">{r.serviceTitle}</p>
                      <p className="text-[13px] text-muted">Requested {fmtDate(r.createdAt)}{r.preferredDate ? ` · for ${r.preferredDate}` : ""}</p>
                    </div>
                    <span className="text-[12.5px] font-semibold text-green">{REQ_LABEL[r.status]}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <aside>
          <h2 className="label text-ink">Your details</h2>
          <div className="card mt-3 space-y-4 p-5">
            <label className="block"><span className="mb-1.5 block text-[13.5px] font-semibold">Name</span><input className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
            <label className="block"><span className="mb-1.5 block text-[13.5px] font-semibold">Phone</span><input className="field" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" /></label>
            <label className="flex items-start gap-3 text-[14px]">
              <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-1 size-4 accent-[var(--color-green)]" />
              <span>Email me about sales, new arrivals and events</span>
            </label>
            <button onClick={save} disabled={pending} className="btn btn-green w-full">{pending ? "Saving…" : msg ?? "Save details"}</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
