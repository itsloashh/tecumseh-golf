import type { Metadata } from "next";
import { getCustomer } from "@/lib/auth/server";
import { mapOrder, mapRequest, supabaseConfigured, supabaseService } from "@/lib/data/supabase";
import { ORDER_SELECT } from "@/lib/orders";
import { AuthPanel } from "@/components/account/AuthPanel";
import { AccountView } from "@/components/account/AccountView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage() {
  if (!supabaseConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-16 text-center">
        <h1 className="display text-[3rem]">Accounts are almost ready</h1>
        <p className="mt-3 text-muted">Shopper accounts switch on as soon as the shop's database is connected.</p>
      </div>
    );
  }
  const customer = await getCustomer();
  if (!customer) return <AuthPanel />;

  const db = supabaseService();
  const [o, r] = db
    ? await Promise.all([
        // Their orders, plus guest orders placed with the same (verified) email before they signed up
        db.from("orders").select(ORDER_SELECT)
          .or(`customer_id.eq.${customer.id},and(customer_id.is.null,email.eq."${customer.email.replace(/"/g, "")}")`)
          .order("created_at", { ascending: false }).limit(50),
        db.from("service_requests").select("*").eq("customer_id", customer.id).order("created_at", { ascending: false }).limit(20),
      ])
    : [{ data: [] }, { data: [] }];
  return <AccountView customer={customer} orders={(o.data ?? []).map(mapOrder)} requests={(r.data ?? []).map(mapRequest)} />;
}
