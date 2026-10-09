/**
 * Transactional email via Resend's REST API (no SDK). Which emails go out, and to whom, is set
 * by managers on the Notifications screen. Everything no-ops without RESEND_API_KEY.
 */
import type { NotificationSettings, Order } from "./types";
import { money } from "./money";
import { SITE_URL } from "./site";

export const emailConfigured = () => Boolean(process.env.RESEND_API_KEY);

async function send(to: string[], subject: string, text: string, replyTo?: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to.length) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: process.env.NOTIFY_FROM ?? "Tecumseh Golf <onboarding@resend.dev>",
      to,
      subject,
      text,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  }).catch((e) => { console.error("[tecumseh-golf] email failed", e); return null; });
  return !!res?.ok;
}

/** Staff alert recipients: the Notifications screen list, else NOTIFY_TO from the environment. */
export const staffInbox = (n: NotificationSettings) => {
  const list = n.recipients.map((s) => s.trim()).filter(Boolean);
  return list.length ? list : (process.env.NOTIFY_TO ?? "").split(",").map((s) => s.trim()).filter(Boolean);
};

const orderLines = (o: Pick<Order, "items" | "subtotalCents" | "taxCents" | "totalCents">) =>
  [
    ...o.items.map((i) => `${i.qty} × ${i.name}${i.option ? ` (${i.option})` : ""} — ${money(i.unitCents * i.qty)}`),
    "",
    `Subtotal ${money(o.subtotalCents)}`,
    `HST ${money(o.taxCents)}`,
    `Total ${money(o.totalCents)}`,
  ].join("\n");

export async function emailNewOrder(o: Order, n: NotificationSettings) {
  const pay = o.payment === "card" ? (o.paid ? "Paid online" : "Card — awaiting payment") : "Pay at pickup";
  if (n.newOrder) {
    await send(
      staffInbox(n),
      `New order #${o.number} — ${o.name} (${money(o.totalCents)})`,
      `${pay}\n\n${orderLines(o)}\n\n${o.name} · ${o.email}${o.phone ? ` · ${o.phone}` : ""}${o.note ? `\nNote: ${o.note}` : ""}\n\nManage: ${SITE_URL}/admin/orders`,
      o.email,
    );
  }
  if (n.customerReceipt) {
    await send(
      [o.email],
      `Order #${o.number} received — Tecumseh Golf`,
      `Thanks ${o.name.split(" ")[0]}! We've got your order and we'll let you know when it's ready for pickup.\n\n${orderLines(o)}\n\n${o.payment === "pickup" ? "You'll pay when you pick up." : "Paid online."}\n\nView your order: ${SITE_URL}/order/${o.token}`,
    );
  }
}

export async function emailOrderReady(o: Order, pickup: string, n: NotificationSettings) {
  if (!n.customerReady) return false;
  return send(
    [o.email],
    `Order #${o.number} is ready for pickup`,
    `Good news ${o.name.split(" ")[0]} — your order is ready at the counter.\n\n${pickup}\n\n${orderLines(o)}\n\n${o.paid ? "Already paid — just come grab it." : `Total due at pickup: ${money(o.totalCents)}`}\n\n${SITE_URL}/order/${o.token}`,
  );
}

export async function emailNewRequest(r: { name: string; email: string; phone?: string | null; service: string; when: string; details?: string | null }, n: NotificationSettings) {
  if (!n.newBooking) return;
  await send(
    staffInbox(n),
    `New ${r.service} request — ${r.name}`,
    `${r.service}\nPreferred: ${r.when}\n\n${r.name} · ${r.email}${r.phone ? ` · ${r.phone}` : ""}\n\n${r.details ?? ""}\n\nManage: ${SITE_URL}/admin/requests`,
    r.email,
  );
}

export async function emailLowStock(items: { name: string; stock: number }[], n: NotificationSettings) {
  if (!n.lowStock || !items.length) return;
  await send(
    staffInbox(n),
    items.some((i) => i.stock === 0) ? `Sold out: ${items.filter((i) => i.stock === 0).map((i) => i.name).join(", ")}` : `Running low: ${items.map((i) => i.name).join(", ")}`,
    `${items.map((i) => `${i.stock === 0 ? "SOLD OUT" : `${i.stock} left`} — ${i.name}`).join("\n")}\n\nRestock or update counts: ${SITE_URL}/admin/products?filter=low`,
  );
}

export async function emailTest(to: string[]) {
  return send(to, "Tecumseh Golf — test alert", `This is a test from your website's notification settings. If you're reading this, alerts are working.\n\n${SITE_URL}/admin/notifications`);
}
