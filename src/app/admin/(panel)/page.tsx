import Link from "next/link";
import { getAdminData } from "@/lib/admin/queries";
import { requireAdmin } from "@/lib/admin/session";
import { can } from "@/lib/admin/permissions";
import { money } from "@/lib/money";
import { STATUS_LABEL } from "@/lib/order-status";
import { PageHead, Section } from "@/components/admin/kit";
import { ago } from "@/lib/time";
import { IconArrow, IconCheck, cx } from "@/components/ui/primitives";

export const metadata = { title: "Home" };

export default async function AdminHome({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const me = await requireAdmin();
  const d = await getAdminData();
  const denied = (await searchParams).denied === "1";
  const fresh = d.orders.filter((o) => o.status === "new");
  const ready = d.orders.filter((o) => o.status === "ready");
  const requests = d.requests.filter((r) => r.status === "new");
  const low = d.products.filter((p) => p.published && p.stock != null && p.stock <= d.settings.notifications.lowStockAt);
  const weekAgo = Date.now() - 7 * 864e5;
  const week = d.orders.filter((o) => new Date(o.createdAt).getTime() > weekAgo && o.status !== "cancelled" && o.status !== "awaiting_payment");
  const samples = d.products.filter((p) => p.isSample).length;
  const manager = me.role === "manager";
  const seeProducts = can(me, "products") || can(me, "stock") || can(me, "prices");

  const checklist = [
    { done: d.settings.hoursConfirmed, label: "Confirm store hours", href: "/admin/store" },
    { done: samples === 0, label: samples ? `Replace ${samples} sample product${samples === 1 ? "" : "s"} with real stock` : "Real products in the shop", href: "/admin/products" },
    { done: d.products.some((p) => p.images.length > 0), label: "Add product photos", href: "/admin/products" },
    { done: d.services.some((s) => s.priceLabel), label: "Add prices for fitting, lessons & repairs", href: "/admin/store" },
    { done: d.team.some((t) => !t.owner), label: "Add your employees and choose what they can access", href: "/admin/team" },
    { done: d.emailReady && (d.settings.notifications.recipients.length > 0 || !!process.env.NOTIFY_TO), label: "Turn on email alerts", href: "/admin/notifications" },
    { done: d.stripeReady && d.settings.onlinePayments, label: "Optional: take card payments online (Stripe)", href: "/admin/store" },
  ];

  const tiles = [
    can(me, "orders") && { n: fresh.length, label: "New orders", href: "/admin/orders", hot: fresh.length > 0 },
    can(me, "orders") && { n: ready.length, label: "Waiting for pickup", href: "/admin/orders?tab=ready", hot: false },
    can(me, "bookings") && { n: requests.length, label: "New booking requests", href: "/admin/requests", hot: requests.length > 0 },
    seeProducts && { n: low.length, label: "Low on stock", href: "/admin/products?filter=low", hot: low.length > 0 },
  ].filter(Boolean) as { n: number; label: string; href: string; hot: boolean }[];

  const hour = Number(new Intl.DateTimeFormat("en-CA", { hour: "numeric", hourCycle: "h23", timeZone: "America/Toronto" }).format(new Date()));
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      {denied && <p className="mb-6 rounded-xl bg-flag/30 px-4 py-3 text-[14px]">That screen isn't part of your access. A manager can change this on <b>Team & access</b>.</p>}
      <PageHead kicker={manager ? "Manager dashboard" : "Staff dashboard"} title={`${hello}${me.name ? `, ${me.name.split(" ")[0]}` : ""}.`}
        sub={can(me, "orders") ? <>Last 7 days: <b className="text-ink">{week.length} orders · {money(week.reduce((n, o) => n + o.totalCents, 0))}</b></> : undefined} />

      {tiles.length > 0 && (
        <div className={cx("mt-8 grid grid-cols-2 gap-3", tiles.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
          {tiles.map((t) => (
            <Link key={t.label} href={t.href} className={cx("rounded-2xl p-5 transition-transform hover:-translate-y-0.5", t.hot ? "bg-flag" : "card")}>
              <p className="display text-[3rem] leading-none">{t.n}</p>
              <p className="mt-2 text-[13.5px] font-semibold">{t.label}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-x-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          {can(me, "orders") && (
            <Section title="Latest orders" action={<Link href="/admin/orders" className="text-[13px] font-semibold text-green">All orders →</Link>}>
              {d.orders.length ? (
                <ul className="card divide-y divide-[var(--line)]">
                  {d.orders.slice(0, 6).map((o) => (
                    <li key={o.id}>
                      <Link href={`/admin/orders?open=${o.id}`} className="flex items-center gap-3 p-4 hover:bg-ink/[0.02]">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">#{o.number} · {o.name}</p>
                          <p className="truncate text-[13px] text-muted">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
                        </div>
                        <div className="text-right">
                          <p className="price">{money(o.totalCents)}</p>
                          <p className={cx("text-[12px] font-semibold", o.status === "new" ? "text-clay" : "text-muted")}>{STATUS_LABEL[o.status]}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="card p-6 text-[14px] text-muted">No orders yet — they'll show up here the moment someone checks out.</p>}
            </Section>
          )}
          {manager && d.activity.length > 0 && (
            <Section title="Recent activity" action={<Link href="/admin/activity" className="text-[13px] font-semibold text-green">See all →</Link>}>
              <ul className="card divide-y divide-[var(--line)] text-[14px]">
                {d.activity.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex gap-3 p-3.5">
                    <span className="min-w-0 flex-1"><b>{a.actorName || a.actorEmail.split("@")[0]}</b> {a.action.charAt(0).toLowerCase() + a.action.slice(1)}{a.detail && <span className="block text-[12.5px] text-muted">{a.detail}</span>}</span>
                    <span className="shrink-0 text-[12px] text-faint">{ago(a.at)}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        <div>
          {manager && (
            <Section title="Before launch">
              <ul className="card divide-y divide-[var(--line)]">
                {checklist.map((c) => {
                  const inner = (
                    <>
                      <span className={cx("grid size-6 shrink-0 place-items-center rounded-full", c.done ? "bg-green text-cream" : "border-2 border-[var(--line-strong)]")}>{c.done && <IconCheck size={14} strokeWidth={3} />}</span>
                      <span className={cx("flex-1 text-[14px]", c.done && "text-muted line-through decoration-ink/20")}>{c.label}</span>
                      {!c.done && <IconArrow size={16} className="text-faint" />}
                    </>
                  );
                  return <li key={c.label}>{!c.done ? <Link href={c.href} className="flex items-center gap-3 p-3.5 hover:bg-ink/[0.02]">{inner}</Link> : <div className="flex items-center gap-3 p-3.5">{inner}</div>}</li>;
                })}
              </ul>
            </Section>
          )}
          {seeProducts && low.length > 0 && (
            <Section title="Low stock" action={<Link href="/admin/products?filter=low" className="text-[13px] font-semibold text-green">Restock →</Link>}>
              <ul className="card divide-y divide-[var(--line)] text-[14px]">
                {low.slice(0, 8).map((p) => (
                  <li key={p.id} className="flex justify-between gap-3 p-3"><span className="truncate">{p.name}</span><b className={p.stock === 0 ? "text-clay" : ""}>{p.stock === 0 ? "Sold out" : `${p.stock} left`}</b></li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </>
  );
}
