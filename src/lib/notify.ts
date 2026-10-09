/**
 * Transactional email via Resend's REST API (no SDK). Every function no-ops without a key,
 * so the site works fine before email is set up.
 */
import type { Order } from "./types";
import { money } from "./money";
import { SITE_URL } from "./site";

async function send(to: string[], subject: string, text: string, replyTo?: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to.length) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.NOTIFY_FROM ?? "Tecumseh Golf <onboarding@resend.dev>",
      to,
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  }).catch((e) => console.error("[tecumseh-golf] email failed", e));
}

const shopInbox = () => (process.env.NOTIFY_TO ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const orderLines = (o: Pick<Order, "items" | "subtotalCents" | "taxCents" | "totalCents">) =>
  [
    ...o.items.map((i) => `${i.qty} × ${i.name}${i.option ? ` (${i.option})` : ""} — ${money(i.unitCents * i.qty)}`),
    "",
    `Subtotal ${money(o.subtotalCents)}`,
    `HST ${money(o.taxCents)}`,
    `Total ${money(o.totalCents)}`,
  ].join("\n");

export async function emailNewOrder(o: Order) {
  const pay = o.payment === "card" ? (o.paid ? "Paid online" : "Card — awaiting payment") : "Pay at pickup";
  await send(
    shopInbox(),
    `New order #${o.number} — ${o.name} (${money(o.totalCents)})`,
    `${pay}\n\n${orderLines(o)}\n\n${o.name} · ${o.email}${o.phone ? ` · ${o.phone}` : ""}${o.note ? `\nNote: ${o.note}` : ""}\n\nManage: ${SITE_URL}/admin/orders`,
    o.email,
  );
  await send(
    [o.email],
    `Order #${o.number} received — Tecumseh Golf`,
    `Thanks ${o.name.split(" ")[0]}! We've got your order and we'll let you know when it's ready for pickup.\n\n${orderLines(o)}\n\n${o.payment === "pickup" ? "You'll pay when you pick up." : "Paid online."}\n\nView your order: ${SITE_URL}/order/${o.token}`,
  );
}

export async function emailOrderReady(o: Order, pickup: string) {
  await send(
    [o.email],
    `Order #${o.number} is ready for pickup`,
    `Good news ${o.name.split(" ")[0]} — your order is ready at the counter.\n\n${pickup}\n\n${orderLines(o)}\n\n${o.paid ? "Already paid — just come grab it." : `Total due at pickup: ${money(o.totalCents)}`}\n\n${SITE_URL}/order/${o.token}`,
  );
}

export async function emailNewRequest(r: { name: string; email: string; phone?: string | null; service: string; when: string; details?: string | null }) {
  await send(
    shopInbox(),
    `New ${r.service} request — ${r.name}`,
    `${r.service}\nPreferred: ${r.when}\n\n${r.name} · ${r.email}${r.phone ? ` · ${r.phone}` : ""}\n\n${r.details ?? ""}\n\nManage: ${SITE_URL}/admin/requests`,
    r.email,
  );
}
