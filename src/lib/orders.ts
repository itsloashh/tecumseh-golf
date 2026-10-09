/** Server-only order reads shared by the API, webhook, order page, account and admin. */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Order } from "./types";
import { mapOrder } from "./data/supabase";

export const ORDER_SELECT = "*, order_items(*)";

export async function orderBy(db: SupabaseClient, col: "id" | "token" | "stripe_session_id", value: string): Promise<Order | null> {
  const { data } = await db.from("orders").select(ORDER_SELECT).eq(col, value).maybeSingle();
  return data ? mapOrder(data) : null;
}

export const STATUS_LABEL: Record<Order["status"], string> = {
  awaiting_payment: "Awaiting payment",
  new: "Received",
  ready: "Ready for pickup",
  completed: "Picked up",
  cancelled: "Cancelled",
};
