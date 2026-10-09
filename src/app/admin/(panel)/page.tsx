import Link from "next/link";
import { getAdminData } from "@/lib/admin/queries";
import { money } from "@/lib/money";
import { STATUS_LABEL } from "@/lib/orders";
import { PageHead, Section } from "@/components/admin/kit";
import { IconArrow, IconCheck, cx } from "@/components/ui/primitives";

export const metadata = { title: "Home" };

export default async function AdminHome() {
  const d = await getAdminData();
  const fresh = d.orders.filter((o) => o.status === "new");
  const ready = d.orders.filter((o) => o.status === "ready");
  const requests = d.requests.filter((r) => r.status === "new");
  const low = d.products.filter((p) => p.published && p.stock != null && p.stock <= 2);
  const weekAgo = Date.now() - 7 * 864e5;
  const week = d.orders.filter((o) => new Date(o.createdAt).getTime() > weekAgo && o.status !== "cancelled" && o.status !== "awaiting_payment");
  const samples = d.products.filter((p) => p.isSample).length;
  const unpriced = d.settings.rangePrices.filter((r) => !r.price.trim()).length;

  const checklist = [
    { done: d.settings.hoursConfirmed, label: "Confirm store hours", href: "/admin/store" },
    { done: samples === 0, label: samples ? `Replace ${samples} sample product${samples === 1 ? "" : "s"} with real stock` : "Real products in the shop", href: "/admin/products" },
    { done: d.products.some((p) => p.images.length > 0), label: "Add product photos", href: "/admin/products" },
    { done: unpriced === 0, label: "Set range bucket prices", href: "/admin/store" },
    { done: d.services.some((s) => s.priceLabel), label: "Add prices for fitting, lessons & repairs", href: "/admin/store" },
    { done: d.emailReady, label: "Turn on email alerts (RESEND_API_KEY + NOTIFY_TO)", href: null },
    { done: d.stripeReady && d.settings.onlinePayments, label: "Optional: take card payments online (Stripe)", href: "/admin/store" },
  ];

  const tiles = [
    { n: fresh.length, label: "New orders", href: "/admin/orders", hot: fresh.length > 0 },
    { n: ready.length, label: "Waiting for pickup", href: "/admin/orders?tab=ready", hot: false },
    { n: requests.length, label: "New booking requests", href: "/admin/requests", hot: requests.length > 0 },
    { n: low.length, label: "Low on stock", href: "/admin/products?filter=low", hot: low.length > 0 },
  ];

  return (
    <>
      <PageHead kicker="Staff dashboard" title="Good to see you." sub={<>Last 7 days: <b className="text-ink">{week.length} orders · {money(week.reduce((n, o) => n + o.totalCents, 0))}</b></>} />

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className={cx("rounded-2xl p-5 transition-transform hover:-translate-y-0.5", t.hot ? "bg-flag" : "card")}>
            <p className="display text-[3rem] leading-none">{t.n}</p>
            <p className="mt-2 text-[13.5px] font-semibold">{t.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-x-8 lg:grid-cols-[1.3fr_1fr]">
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

        <Section title="Before launch">
          <ul className="card divide-y divide-[var(--line)]">
            {checklist.map((c) => {
              const inner = (
                <>
                  <span className={cx("grid size-6 shrink-0 place-items-center rounded-full", c.done ? "bg-green text-cream" : "border-2 border-[var(--line-strong)]")}>{c.done && <IconCheck size={14} strokeWidth={3} />}</span>
                  <span className={cx("flex-1 text-[14px]", c.done && "text-muted line-through decoration-ink/20")}>{c.label}</span>
                  {c.href && !c.done && <IconArrow size={16} className="text-faint" />}
                </>
              );
              return <li key={c.label}>{c.href && !c.done ? <Link href={c.href} className="flex items-center gap-3 p-3.5 hover:bg-ink/[0.02]">{inner}</Link> : <div className="flex items-center gap-3 p-3.5">{inner}</div>}</li>;
            })}
          </ul>
          {low.length > 0 && (
            <div className="mt-6">
              <h3 className="label mb-2 text-clay">Low stock</h3>
              <ul className="card divide-y divide-[var(--line)] text-[14px]">
                {low.slice(0, 6).map((p) => (
                  <li key={p.id} className="flex justify-between gap-3 p-3"><span className="truncate">{p.name}</span><b className={p.stock === 0 ? "text-clay" : ""}>{p.stock === 0 ? "Sold out" : `${p.stock} left`}</b></li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      </div>
    </>
  );
}
