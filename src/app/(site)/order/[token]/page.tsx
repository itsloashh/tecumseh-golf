import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseService } from "@/lib/data/supabase";
import { getSnapshot } from "@/lib/data";
import { orderBy, STATUS_LABEL } from "@/lib/orders";
import { money } from "@/lib/money";
import { ClearCartOnArrival } from "@/components/shop/ClearCart";
import { IconCheck, IconPhone, IconPin, cx } from "@/components/ui/primitives";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order", robots: { index: false } };

const STEPS = ["new", "ready", "completed"] as const;

export default async function OrderPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ new?: string }> }) {
  const { token } = await params;
  const isNew = (await searchParams).new === "1";
  const db = supabaseService();
  if (!db || !/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const order = await orderBy(db, "token", token);
  if (!order) notFound();
  const { settings: s } = await getSnapshot();
  const step = STEPS.indexOf(order.status as (typeof STEPS)[number]);
  const tel = s.phone.replace(/[^0-9+]/g, "");

  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12">
      {isNew && <ClearCartOnArrival />}
      {isNew && order.status !== "cancelled" && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-green px-5 py-4 text-cream">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-flag text-ink"><IconCheck size={18} strokeWidth={2.6} /></span>
          <p className="text-[15px]"><b>Thanks, {order.name.split(" ")[0]}!</b> Your order is in. A confirmation is on its way to {order.email}.</p>
        </div>
      )}
      <p className="label text-green">Order #{order.number}</p>
      <h1 className="display display-i mt-2 text-[3rem] sm:text-[3.8rem]">{STATUS_LABEL[order.status]}</h1>
      <p className="mt-1 text-[14px] text-muted">
        Placed {new Date(order.createdAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Toronto" })} ·{" "}
        {order.paid ? "Paid online" : order.payment === "card" ? "Waiting for payment" : "Pay at pickup"}
      </p>

      {order.status !== "cancelled" && order.status !== "awaiting_payment" && (
        <ol className="mt-8 grid grid-cols-3 gap-2">
          {STEPS.map((st, i) => (
            <li key={st} className="text-center">
              <div className={cx("h-1.5 rounded-full", i <= step ? "bg-green" : "bg-sand")} />
              <p className={cx("mt-2 text-[12.5px] font-semibold", i <= step ? "text-green" : "text-faint")}>{STATUS_LABEL[st]}</p>
            </li>
          ))}
        </ol>
      )}
      {order.status === "awaiting_payment" && (
        <p className="mt-6 rounded-xl bg-flag/30 px-4 py-3 text-[14px]">We're waiting for confirmation from the card processor. This page updates when it arrives — refresh in a moment.</p>
      )}

      <div className="card mt-8 p-5">
        <ul className="divide-y divide-[var(--line)]">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 py-3 text-[14.5px]">
              <span><b>{i.qty} ×</b> {i.name}{i.option && <span className="block text-[12.5px] text-muted">{i.option}</span>}</span>
              <span className="price text-[1rem]">{money(i.unitCents * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-1.5 border-t border-[var(--line)] pt-3 text-[14px]">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="tabular">{money(order.subtotalCents)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">HST</dt><dd className="tabular">{money(order.taxCents)}</dd></div>
          <div className="flex items-baseline justify-between pt-2"><dt className="font-semibold">Total</dt><dd className="price text-[1.6rem]">{money(order.totalCents)}</dd></div>
        </dl>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <a href={s.googleUrl || "/visit"} target="_blank" rel="noreferrer" className="card flex gap-3 p-4 hover:border-[var(--line-strong)]">
          <IconPin className="mt-0.5 shrink-0 text-green" />
          <span className="text-[14px]"><b className="block">Pick up at</b>{s.address}, {s.city}</span>
        </a>
        {tel && (
          <a href={`tel:${tel}`} className="card flex gap-3 p-4 hover:border-[var(--line-strong)]">
            <IconPhone className="mt-0.5 shrink-0 text-green" />
            <span className="text-[14px]"><b className="block">Questions?</b>{s.phone}</span>
          </a>
        )}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/shop" className="btn btn-green">Keep shopping</Link>
        <Link href="/account" className="btn btn-ghost">My account</Link>
      </div>
    </div>
  );
}
