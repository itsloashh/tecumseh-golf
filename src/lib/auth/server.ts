/**
 * Cookie-based Supabase sessions (@supabase/ssr) — shared by shopper accounts and the admin.
 * Server-only.
 */
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Customer } from "@/lib/types";
import { mapCustomer, supabaseConfigured, supabaseService } from "@/lib/data/supabase";

export async function supabaseSession() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // called from a Server Component — the proxy refreshes cookies instead
        }
      },
    },
  });
}

/** The signed-in Supabase user, or null (also null when Supabase isn't configured). */
export async function getUser() {
  if (!supabaseConfigured()) return null;
  const sb = await supabaseSession();
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

/** Signed-in shopper with their customer row (created by the on_auth_user_created trigger). */
export async function getCustomer(): Promise<Customer | null> {
  const user = await getUser();
  if (!user) return null;
  const db = supabaseService();
  const fallback: Customer = {
    id: user.id, email: user.email ?? "", name: String(user.user_metadata?.name ?? ""), phone: String(user.user_metadata?.phone ?? ""),
    marketing: false, createdAt: user.created_at,
  };
  if (!db) return fallback;
  const { data } = await db.from("customers").select("*").eq("id", user.id).maybeSingle();
  if (!data) {
    // Safety net if the trigger wasn't installed when this account was created
    await db.from("customers").upsert({ id: user.id, email: user.email, name: fallback.name || null, phone: fallback.phone || null });
    return fallback;
  }
  return { ...mapCustomer(data), email: data.email ?? user.email ?? "" };
}
