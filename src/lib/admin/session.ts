/**
 * Staff access. Everyone signs in with Supabase Auth (email + password).
 * - Emails in ADMIN_EMAILS are always managers (the owner's way in, even before any staff rows exist).
 * - Everyone else needs an active row in the `staff` table, created by a manager on the Team screen.
 */
import { cache } from "react";
import { redirect } from "next/navigation";
import { supabaseConfigured, supabaseService } from "@/lib/data/supabase";
import { supabaseSession } from "@/lib/auth/server";
import { ALL_PERMISSIONS, can, cleanPermissions, type Permission, type StaffUser } from "./permissions";

/** Local UI preview without a database: ADMIN_DEMO=1 (never active on Vercel). */
export const demoMode = () => !supabaseConfigured() && process.env.ADMIN_DEMO === "1" && process.env.VERCEL !== "1";

export const ownerEmails = () =>
  (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Resolves a signed-in auth user to their staff identity (or null if they aren't staff). */
export async function staffFor(userId: string, email: string | undefined): Promise<StaffUser | null> {
  const mail = (email ?? "").toLowerCase();
  const owner = ownerEmails().includes(mail);
  const db = supabaseService();
  let row: any = null;
  if (db) {
    const { data } = await db.from("staff").select("*").or(`user_id.eq.${userId},email.eq."${mail.replace(/"/g, "")}"`).limit(1).maybeSingle();
    row = data;
    if (row && !row.user_id) await db.from("staff").update({ user_id: userId }).eq("id", row.id); // first sign-in links the account
    if (!row && owner) {
      // Put the owner on the Team list the first time they sign in
      const { data: created } = await db.from("staff").insert({ user_id: userId, email: mail, role: "manager", permissions: ALL_PERMISSIONS }).select("*").single();
      row = created;
    }
  }
  if (owner) return { id: userId, email: mail, name: row?.name ?? "", role: "manager", permissions: [...ALL_PERMISSIONS], owner: true };
  if (!row || !row.active) return null;
  return { id: userId, email: mail, name: row.name ?? "", role: row.role === "manager" ? "manager" : "staff", permissions: cleanPermissions(row.permissions ?? []), owner: false };
}

/** The signed-in staff member for this request (cached per request). */
export const getAdmin = cache(async (): Promise<StaffUser | null> => {
  if (demoMode()) return { id: "demo", email: "demo@tecumsehgolf.local", name: "Demo Manager", role: "manager", permissions: [...ALL_PERMISSIONS], owner: true, demo: true };
  if (!supabaseConfigured()) return null;
  const sb = await supabaseSession();
  const { data } = await sb.auth.getUser();
  if (!data.user) return null;
  return staffFor(data.user.id, data.user.email);
});

export async function requireAdmin(): Promise<StaffUser> {
  const a = await getAdmin();
  if (!a) redirect("/admin/login");
  return a;
}

/** For pages: signed in AND allowed to see this screen, otherwise back to the dashboard home. */
export async function requirePermission(p: Permission | "manager"): Promise<StaffUser> {
  const a = await requireAdmin();
  const ok = p === "manager" ? a.role === "manager" : can(a, p);
  if (!ok) redirect("/admin?denied=1");
  return a;
}
