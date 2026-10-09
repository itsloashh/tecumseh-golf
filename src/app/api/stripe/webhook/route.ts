import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseService } from "@/lib/data/supabase";
import { orderBy } from "@/lib/orders";
import { emailNewOrder } from "@/lib/notify";

export const runtime = "nodejs";

/**
 * Stripe → this endpoint (add it in Stripe → Developers → Webhooks):
 *   checkout.session.completed → mark the order paid and put it in the "New" queue
 *   checkout.session.expired   → cancel the order and put the stock back
 */
export async function POST(req: Request) {
  const pay = stripe(), db = supabaseService(), secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!pay || !db || !secret) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  let event: Stripe.Event;
  try {
    event = pay.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") ?? "", secret);
  } catch (e) {
    console.error("[webhook] bad signature", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (event.type === "checkout.session.completed" && session.payment_status === "paid") {
    const { data } = await db
      .from("orders")
      .update({ paid: true, status: "new" })
      .eq("stripe_session_id", session.id)
      .eq("status", "awaiting_payment")
      .select("id");
    if (data?.length) {
      const order = await orderBy(db, "id", data[0].id);
      if (order) await emailNewOrder(order);
    }
  }
  if (event.type === "checkout.session.expired") {
    const order = await orderBy(db, "stripe_session_id", session.id);
    if (order && order.status === "awaiting_payment") await db.rpc("cancel_order", { p_order: order.id });
  }
  return NextResponse.json({ received: true });
}
