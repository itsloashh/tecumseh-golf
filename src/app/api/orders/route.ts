import { NextResponse } from "next/server";
import { mapSettings, stripeConfigured, supabaseService } from "@/lib/data/supabase";
import { getCustomer } from "@/lib/auth/server";
import { alertLowStock, orderBy } from "@/lib/orders";
import { stripe } from "@/lib/stripe";
import { emailNewOrder } from "@/lib/notify";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";

interface Body {
  items?: { productId: string; option: string | null; qty: number }[];
  name?: string;
  email?: string;
  phone?: string;
  note?: string;
  payment?: "pickup" | "card";
  company?: string; // honeypot — real shoppers never see it
}

const bad = (error: string, status = 422) => NextResponse.json({ error }, { status });


export async function POST(req: Request) {
  let b: Body;
  try { b = await req.json(); } catch { return bad("Malformed request.", 400); }
  if (b.company) return NextResponse.json({ ok: true, demo: true }); // bot

  const name = b.name?.trim() ?? "", email = b.email?.trim().toLowerCase() ?? "";
  if (!name) return bad("Please add your name.");
  if (!/^\S+@\S+\.\S+$/.test(email)) return bad("Please add a valid email so we can confirm your order.");
  const items = (b.items ?? []).filter((i) => i && typeof i.productId === "string" && Number(i.qty) > 0).slice(0, 30);
  if (!items.length) return bad("Your cart is empty.");
  const payment = b.payment === "card" ? "card" : "pickup";

  const db = supabaseService();
  if (!db) return NextResponse.json({ ok: true, demo: true }); // sample mode: nothing to save to

  const { data: s } = await db.from("store_settings").select("*").eq("id", 1).maybeSingle();
  const settings = mapSettings(s);
  const pay = stripe();
  if (payment === "card" && !(settings.onlinePayments && stripeConfigured() && pay)) return bad("Online payment isn't available right now — choose pay at pickup.");

  const customer = await getCustomer();
  if (customer && (!customer.name || !customer.phone)) {
    await db.from("customers").update({ name: customer.name || name, phone: customer.phone || b.phone?.trim() || null }).eq("id", customer.id);
  }

  const { data, error } = await db.rpc("place_order", {
    p_items: items.map((i) => ({ product_id: i.productId, qty: Math.round(Number(i.qty)), option: i.option ?? "" })),
    p_name: name.slice(0, 120),
    p_email: email.slice(0, 200),
    p_phone: b.phone?.trim().slice(0, 40) || null,
    p_note: b.note?.trim().slice(0, 1000) || null,
    p_payment: payment,
    p_customer: customer?.id ?? null,
  });
  if (error) {
    // Messages raised inside place_order (sold out, unavailable) are written for shoppers.
    const msg = error.code === "P0001" ? error.message : "Couldn't place your order. Please try again or call the shop.";
    if (error.code !== "P0001") console.error("[orders] place_order failed", error);
    return bad(msg, error.code === "P0001" ? 409 : 500);
  }
  const placed = (Array.isArray(data) ? data[0] : data) as { id: string; token: string } | undefined;
  if (!placed) return bad("Couldn't place your order.", 500);
  const order = await orderBy(db, "id", placed.id);
  if (!order) return bad("Couldn't place your order.", 500);

  if (payment === "card" && pay) {
    try {
      const session = await pay.checkout.sessions.create({
        mode: "payment",
        customer_email: email,
        line_items: [
          ...order.items.map((i) => ({
            quantity: i.qty,
            price_data: { currency: "cad", unit_amount: i.unitCents, product_data: { name: i.name, ...(i.option ? { description: i.option } : {}) } },
          })),
          ...(order.taxCents > 0 ? [{ quantity: 1, price_data: { currency: "cad", unit_amount: order.taxCents, product_data: { name: `HST (${Math.round(settings.taxRate * 100)}%)` } } }] : []),
        ],
        expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
        success_url: `${SITE_URL}/order/${order.token}?new=1`,
        cancel_url: `${SITE_URL}/checkout?cancelled=1`,
        metadata: { order_id: order.id, order_number: String(order.number) },
      });
      await db.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
      return NextResponse.json({ ok: true, url: session.url });
    } catch (e) {
      console.error("[orders] stripe session failed", e);
      await db.rpc("cancel_order", { p_order: order.id });
      return bad("Card checkout couldn't start. Try again, or choose pay at pickup.", 502);
    }
  }

  await emailNewOrder(order, settings.notifications);
  await alertLowStock(db, order.items.map((i) => i.productId).filter(Boolean) as string[], settings.notifications);
  return NextResponse.json({ ok: true, token: order.token });
}
