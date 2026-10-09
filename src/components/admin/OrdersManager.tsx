"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Order, OrderStatus } from "@/lib/types";
import { updateOrder } from "@/app/admin/actions";
import { money } from "@/lib/money";
import { STATUS_LABEL } from "@/lib/orders";
import { ConfirmButton, PageHead, Pill, Sheet, TextArea, ago, useAction, useToast } from "./kit";
import { IconMail, IconPhone, cx } from "@/components/ui/primitives";

const TABS: { id: OrderStatus | "all"; label: string }[] = [
  { id: "new", label: "New" },
  { id: "ready", label: "Ready" },
  { id: "completed", label: "Picked up" },
  { id: "awaiting_payment", label: "Awaiting payment" },
  { id: "cancelled", label: "Cancelled" },
  { id: "all", label: "All" },
];

const tone = (s: OrderStatus) => (s === "new" ? "clay" : s === "ready" ? "flag" : s === "completed" ? "green" : "muted") as "clay" | "flag" | "green" | "muted";

export function OrdersManager({ orders, emailReady }: { orders: Order[]; emailReady: boolean }) {
  const [tab, setTab] = useState<OrderStatus | "all">("new");
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("tab") as OrderStatus | null;
    if (t && TABS.some((x) => x.id === t)) setTab(t);
    const o = p.get("open");
    if (o) { setOpenId(o); const ord = orders.find((x) => x.id === o); if (ord) setTab(ord.status); }
  }, [orders]);

  const count = (id: OrderStatus | "all") => (id === "all" ? orders.length : orders.filter((o) => o.status === id).length);
  const list = useMemo(() => {
    const n = q.trim().toLowerCase().replace(/^#/, "");
    return orders.filter((o) => (tab === "all" || o.status === tab) && (!n || `${o.number} ${o.name} ${o.email} ${o.phone ?? ""}`.toLowerCase().includes(n)));
  }, [orders, tab, q]);
  const open = orders.find((o) => o.id === openId) ?? null;

  return (
    <>
      <PageHead kicker="Pickup queue" title="Orders" sub="New → Ready for pickup → Picked up. Customers see each step on their order page." />
      <div className="rail mt-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} className="chip shrink-0" aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label} <span className="opacity-60">{count(t.id)}</span>
          </button>
        ))}
      </div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by #, name, email or phone" className="field mt-3 !rounded-full" type="search" />

      <ul className="mt-5 space-y-2.5">
        {list.map((o) => (
          <li key={o.id}>
            <button onClick={() => setOpenId(o.id)} className={cx("card flex w-full items-center gap-4 p-4 text-left hover:border-[var(--line-strong)]", o.status === "new" && "border-l-4 border-l-clay")}>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold">#{o.number} · {o.name}<Pill tone={tone(o.status)}>{STATUS_LABEL[o.status]}</Pill></p>
                <p className="mt-0.5 truncate text-[13.5px] text-muted">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="price text-[1.1rem]">{money(o.totalCents)}</p>
                <p className="text-[12px] text-muted">{o.paid ? "Paid" : "Pay at pickup"} · {ago(o.createdAt)}</p>
              </div>
            </button>
          </li>
        ))}
        {!list.length && <li className="card p-8 text-center text-[14px] text-muted">Nothing here right now.</li>}
      </ul>

      {open && <OrderSheet key={open.id} order={open} emailReady={emailReady} onClose={() => setOpenId(null)} />}
    </>
  );
}

function OrderSheet({ order: o, emailReady, onClose }: { order: Order; emailReady: boolean; onClose: () => void }) {
  const router = useRouter();
  const { run, busy } = useAction();
  const [notes, setNotes] = useState(o.internalNotes);
  const tel = o.phone?.replace(/[^0-9+]/g, "");

  const toast = useToast();
  const set = async (patch: Parameters<typeof updateOrder>[1], msg: string) => {
    const r = await run(updateOrder(o.id, patch));
    if (!r) return;
    const emailed = typeof r === "object" && "emailed" in r && r.emailed;
    toast(emailed ? `${msg} — customer emailed` : msg);
    router.refresh();
  };

  return (
    <Sheet open onClose={onClose} title={`Order #${o.number}`}
      footer={
        <div className="flex flex-wrap items-center gap-2">
          {o.status !== "cancelled" && o.status !== "completed" && <ConfirmButton busy={busy} onConfirm={() => set({ status: "cancelled" }, "Order cancelled · stock returned")}>Cancel order</ConfirmButton>}
          <div className="ml-auto flex gap-2">
            {o.status === "new" && <button disabled={busy} onClick={() => set({ status: "ready" }, "Marked ready")} className="btn btn-flag">Ready for pickup</button>}
            {o.status === "ready" && <button disabled={busy} onClick={() => set({ status: "completed" }, "Picked up")} className="btn btn-green">Picked up</button>}
            {(o.status === "completed" || o.status === "cancelled") && <button onClick={onClose} className="btn btn-ghost">Close</button>}
          </div>
        </div>
      }>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={tone(o.status)}>{STATUS_LABEL[o.status]}</Pill>
        <Pill tone={o.paid ? "green" : "muted"}>{o.paid ? (o.payment === "card" ? "Paid online" : "Paid") : "Pay at pickup"}</Pill>
        <span className="text-[13px] text-muted">{new Date(o.createdAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Toronto" })}</span>
      </div>
      {o.status === "new" && <p className="mt-3 text-[13px] text-muted">{emailReady ? "Marking it ready emails the customer automatically." : "Tip: once email is set up, “Ready for pickup” emails the customer for you."}</p>}

      <div className="card mt-5 p-4">
        <p className="text-[16px] font-semibold">{o.name}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {tel && <a href={`tel:${tel}`} className="btn btn-ghost btn-sm"><IconPhone size={16} /> {o.phone}</a>}
          <a href={`mailto:${o.email}?subject=${encodeURIComponent(`Your Tecumseh Golf order #${o.number}`)}`} className="btn btn-ghost btn-sm"><IconMail size={16} /> Email</a>
        </div>
        <p className="mt-2 break-all text-[13px] text-muted">{o.email}</p>
        {o.note && <p className="mt-3 rounded-xl bg-flag/25 px-3 py-2 text-[14px]"><b>Customer note:</b> {o.note}</p>}
      </div>

      <ul className="card mt-4 divide-y divide-[var(--line)] p-4 pt-1">
        {o.items.map((i) => (
          <li key={i.id} className="flex justify-between gap-3 py-3 text-[14.5px]">
            <span><b>{i.qty}×</b> {i.name}{i.option && <span className="block text-[12.5px] text-muted">{i.option}</span>}</span>
            <span className="tabular">{money(i.unitCents * i.qty)}</span>
          </li>
        ))}
        <li className="space-y-1 pt-3 text-[14px]">
          <div className="flex justify-between text-muted"><span>Subtotal</span><span className="tabular">{money(o.subtotalCents)}</span></div>
          <div className="flex justify-between text-muted"><span>HST</span><span className="tabular">{money(o.taxCents)}</span></div>
          <div className="flex items-baseline justify-between pt-1"><b>Total</b><span className="price text-[1.4rem]">{money(o.totalCents)}</span></div>
        </li>
      </ul>

      {o.payment === "pickup" && o.status !== "cancelled" && (
        <button disabled={busy} onClick={() => set({ paid: !o.paid }, o.paid ? "Marked unpaid" : "Marked paid")} className="btn btn-ghost btn-sm mt-4">
          {o.paid ? "Mark as unpaid" : "Mark as paid"}
        </button>
      )}

      <div className="mt-6">
        <span className="mb-1.5 block text-[13.5px] font-semibold">Staff notes <span className="font-normal text-faint">(customer never sees these)</span></span>
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Where it's stored, who's picking up…" />
        {notes !== o.internalNotes && <button disabled={busy} onClick={() => set({ internalNotes: notes }, "Notes saved")} className="btn btn-green btn-sm mt-2">Save notes</button>}
      </div>
      <a href={`/order/${o.token}`} target="_blank" rel="noreferrer" className="mt-6 inline-block text-[13px] font-semibold text-green">Customer's order page ↗</a>
    </Sheet>
  );
}
