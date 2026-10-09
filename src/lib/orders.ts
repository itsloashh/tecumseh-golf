/** Server-only order reads shared by the API, webhook, order page, account and admin. */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationSettings, Order } from "./types";
import { emailLowStock } from "./notify";
import { mapOrder } from "./data/supabase";

export const ORDER_SELECT = "*, order_items(*)";

export async function orderBy(db: SupabaseClient, col: "id" | "token" | "stripe_session_id", value: string): Promise<Order | null> {
  const { data } = await db.from("orders").select(ORDER_SELECT).eq(col, value).maybeSingle();
  return data ? mapOrder(data) : null;
}

export { STATUS_LABEL } from "./order-status";

/** Emails staff when an order leaves tracked stock at or below the alert threshold. */
export async function alertLowStock(db: SupabaseClient, ids: string[], n: NotificationSettings) {
  if (!n.lowStock || !ids.length) return;
  const { data } = await db.from("products").select("name,stock").in("id", ids).not("stock", "is", null).lte("stock", n.lowStockAt);
  await emailLowStock((data ?? []) as { name: string; stock: number }[], n);
}
