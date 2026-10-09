/**
 * Admin access. Staff sign in with Supabase Auth (email + password); a signed-in user is an
 * admin if their email is in ADMIN_EMAILS or they have a row in the `admins` table.
 */
import { redirect } from "next/navigation";
import { supabaseConfigured, supabaseService } from "@/lib/data/supabase";
import { supabaseSession } from "@/lib/auth/server";

export type AdminUser = { id: string; email: string; demo?: boolean };

/** Local UI preview without a database: ADMIN_DEMO=1 (never active on Vercel). */
export const demoMode = () => !supabaseConfigured() && process.env.ADMIN_DEMO === "1" && process.env.VERCEL !== "1";

const allowlist = () =>
  (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

export async function isAdminUser(id: string, email: string | undefined) {
  if (email && allowlist().includes(email.toLowerCase())) return true;
  const db = supabaseService();
  if (!db) return false;
  const { data } = await db.from("admins").select("user_id").eq("user_id", id).maybeSingle();
  return !!data;
}

export async function getAdmin(): Promise<AdminUser | null> {
  if (demoMode()) return { id: "demo", email: "demo@tecumsehgolf.local", demo: true };
  if (!supabaseConfigured()) return null;
  const sb = await supabaseSession();
  const { data } = await sb.auth.getUser();
  const user = data.user;
  if (!user) return null;
  return (await isAdminUser(user.id, user.email)) ? { id: user.id, email: user.email ?? "" } : null;
}

export async function requireAdmin(): Promise<AdminUser> {
  const a = await getAdmin();
  if (!a) redirect("/admin/login");
  return a;
}
