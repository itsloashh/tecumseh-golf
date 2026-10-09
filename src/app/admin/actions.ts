"use server";
/**
 * Every admin write goes through here (same pattern as LOASH): each action re-checks who is
 * signed in AND that they have the permission for it, writes with the service-role client,
 * records it in the activity log, then revalidates the public site so changes appear immediately.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DayHours, HomeSections, ImageAsset, NotificationSettings, OrderStatus, ProductOption, RequestStatus, Social } from "@/lib/types";
import { mapSettings, supabaseService } from "@/lib/data/supabase";
import { getAdmin, ownerEmails, staffFor } from "@/lib/admin/session";
import { ALL_PERMISSIONS, can, cleanPermissions, type Permission, type Role, type StaffUser } from "@/lib/admin/permissions";
import { supabaseSession } from "@/lib/auth/server";
import { orderBy } from "@/lib/orders";
import { emailOrderReady, emailTest, emailConfigured, staffInbox } from "@/lib/notify";
import { money } from "@/lib/money";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const ORDER_STATUSES: OrderStatus[] = ["awaiting_payment", "new", "ready", "completed", "cancelled"];
const REQUEST_STATUSES: RequestStatus[] = ["new", "contacted", "scheduled", "completed", "cancelled"];
const NOT_ALLOWED = "You don't have access to do that — ask a manager.";

type Need = Permission | "manager" | Permission[];

/** Signed in, active, allowed (any of the listed permissions), and able to write. */
async function guard(need: Need) {
  const me = await getAdmin();
  if (!me) throw new Error("Your session expired — sign in again.");
  const ok = need === "manager" ? me.role === "manager" : Array.isArray(need) ? need.some((p) => can(me, p)) : can(me, need);
  if (!ok) throw new Error(NOT_ALLOWED);
  if (me.demo) throw new Error("Demo mode — connect Supabase to save changes.");
  const db = supabaseService();
  if (!db) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in your environment.");
  return { db, me };
}
type Db = Awaited<ReturnType<typeof guard>>["db"];

async function log(db: Db, me: StaffUser, action: string, detail?: string) {
  await db.from("activity_log").insert({ actor_email: me.email, actor_name: me.name || null, action, detail: detail ?? null });
}

async function run<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    revalidatePath("/", "layout");
    return { ok: true, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : typeof e === "object" && e && "message" in e ? String((e as { message: unknown }).message) : "Something went wrong.";
    return { ok: false, error: msg };
  }
}

const must = <T,>(r: { data: T; error: unknown }) => {
  if (r.error) throw r.error;
  return r.data;
};

const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 56) || "item";
const rand = () => Math.random().toString(36).slice(2, 6);

/* ── Auth ─────────────────────────────────────────────── */

export async function signIn(_: unknown, form: FormData): Promise<{ error: string } | undefined> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  const sb = await supabaseSession();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "That email and password don't match." };
  const me = await staffFor(data.user.id, data.user.email);
  if (!me) {
    await sb.auth.signOut();
    return { error: "This account doesn't have staff access. Ask a manager to add you on the Team screen." };
  }
  await supabaseService()?.from("staff").update({ last_seen_at: new Date().toISOString() }).eq("user_id", data.user.id);
  redirect("/admin");
}

export async function signOut() {
  const sb = await supabaseSession();
  await sb.auth.signOut();
  redirect("/admin/login");
}

/** Your own name + password (any staff member). */
export async function updateMe(input: { name: string; password?: string }): Promise<ActionResult> {
  return run(async () => {
    const me = await getAdmin();
    if (!me) throw new Error("Your session expired — sign in again.");
    if (me.demo) throw new Error("Demo mode — connect Supabase to save changes.");
    const db = supabaseService();
    if (!db) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
    await db.from("staff").update({ name: input.name.trim() || null }).eq("user_id", me.id);
    if (input.password) {
      if (input.password.length < 8) throw new Error("Use at least 8 characters for your password.");
      const sb = await supabaseSession();
      const { error } = await sb.auth.updateUser({ password: input.password });
      if (error) throw new Error(error.message);
      await log(db, me, "Changed their password");
    }
    return undefined;
  });
}

/* ── Uploads ──────────────────────────────────────────── */

export async function createUploadSlots(widths: number[]): Promise<ActionResult<{ key: string; slots: { width: number; path: string; token: string }[] }>> {
  return run(async () => {
    const { db } = await guard("products");
    const key = `products/${Date.now().toString(36)}-${rand()}`;
    const slots = await Promise.all(
      widths.map(async (w) => {
        const path = `${key}-${w}.webp`;
        const r = must(await db.storage.from("shop").createSignedUploadUrl(path, { upsert: true }));
        return { width: w, path, token: r!.token };
      }),
    );
    return { key, slots };
  });
}

async function removeImages(db: Db, keys: string[]) {
  const paths = keys.filter((k) => !k.startsWith("/")).flatMap((k) => [480, 828, 1170].map((w) => `${k}-${w}.webp`));
  if (paths.length) await db.storage.from("shop").remove(paths);
}

/* ── Products ─────────────────────────────────────────── */

export interface ProductInput {
  id?: string;
  name: string;
  brand: string;
  category: string | null;
  condition: "new" | "used";
  description: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number | null;
  options: ProductOption[];
  images: ImageAsset[];
  featured: boolean;
  published: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Saves only the parts this person may change: product details need "products",
 * prices need "prices", stock needs "stock". Anything else they send is ignored.
 */
export async function saveProduct(input: ProductInput): Promise<ActionResult<{ id: string; slug: string }>> {
  return run(async () => {
    const { db, me } = await guard(["products", "prices", "stock"]);
    const mayEdit = can(me, "products"), mayPrice = can(me, "prices"), mayStock = can(me, "stock");
    if (!input.id && !mayEdit) throw new Error(NOT_ALLOWED);
    if (!Number.isInteger(input.priceCents) || input.priceCents < 0) throw new Error("Enter a price.");
    if (input.stock != null && (!Number.isInteger(input.stock) || input.stock < 0)) throw new Error("Stock must be 0 or more.");
    const compare = input.compareAtCents && input.compareAtCents > input.priceCents ? input.compareAtCents : null;

    const row: Record<string, unknown> = {};
    if (mayEdit) {
      const name = input.name.trim();
      if (!name) throw new Error("Give the product a name.");
      Object.assign(row, {
        name,
        brand: input.brand.trim() || null,
        category: input.category || null,
        condition: input.condition === "used" ? "used" : "new",
        description: input.description.trim() || null,
        options: input.options.map((o) => ({ name: o.name.trim(), values: o.values.map((v) => v.trim()).filter(Boolean) })).filter((o) => o.name && o.values.length),
        images: input.images.slice(0, 8),
        featured: input.featured,
        published: input.published,
        is_sample: false, // anything edited by staff is real
      });
    }
    // New products always need a price; employees without "prices" can't change it afterwards
    if (mayPrice || !input.id) Object.assign(row, { price_cents: input.priceCents, compare_at_cents: compare });
    if (mayStock || !input.id) row.stock = input.stock;

    if (input.id) {
      const prev = must(await db.from("products").select("name,images,price_cents,compare_at_cents,stock").eq("id", input.id).single()) as any;
      const r = must(await db.from("products").update(row).eq("id", input.id).select("id,slug,name").single()) as { id: string; slug: string; name: string };
      if (mayEdit) {
        const kept = new Set(input.images.map((i) => i.key));
        await removeImages(db, ((prev.images ?? []) as ImageAsset[]).map((i) => i.key).filter((k) => !kept.has(k)));
      }
      const changes: string[] = [];
      if ("price_cents" in row && prev.price_cents !== row.price_cents) changes.push(`price ${money(prev.price_cents)} → ${money(row.price_cents as number)}`);
      if ("compare_at_cents" in row && (prev.compare_at_cents ?? null) !== (row.compare_at_cents ?? null)) changes.push(row.compare_at_cents ? `on sale (was ${money(row.compare_at_cents as number)})` : "sale removed");
      if ("stock" in row && (prev.stock ?? null) !== (row.stock ?? null)) changes.push(`stock ${prev.stock ?? "—"} → ${row.stock ?? "not tracked"}`);
      await log(db, me, `Edited product “${r.name}”`, changes.join(" · ") || undefined);
      return { id: r.id, slug: r.slug };
    }
    const top = must(await db.from("products").select("sort_order").order("sort_order", { ascending: false }).limit(1)) as { sort_order: number }[];
    row.sort_order = (top[0]?.sort_order ?? 0) + 1; // new products go to the front
    row.slug = `${slugify(input.name)}-${rand()}`;
    const r = must(await db.from("products").insert(row).select("id,slug").single()) as { id: string; slug: string };
    await log(db, me, `Added product “${input.name.trim()}”`, `${money(input.priceCents)}${input.stock != null ? ` · ${input.stock} in stock` : ""}`);
    return r;
  });
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  return run(async () => {
    const { db, me } = await guard("products");
    const prev = must(await db.from("products").select("name,images").eq("id", id).single()) as { name: string; images: ImageAsset[] };
    must(await db.from("products").delete().eq("id", id)); // past orders keep their line items (product_id → null)
    await removeImages(db, (prev.images ?? []).map((i) => i.key));
    await log(db, me, `Deleted product “${prev.name}”`);
    return undefined;
  });
}

/** Quick toggles from the product list. Featured/visibility need "products"; stock needs "stock". */
export async function setProductFlags(id: string, flags: { featured?: boolean; published?: boolean; stock?: number | null }): Promise<ActionResult> {
  return run(async () => {
    const need: Permission = flags.stock !== undefined ? "stock" : "products";
    const { db, me } = await guard(need);
    if (flags.stock != null && flags.stock < 0) flags.stock = 0;
    const prev = must(await db.from("products").select("name,stock").eq("id", id).single()) as { name: string; stock: number | null };
    must(await db.from("products").update(flags).eq("id", id));
    if (flags.stock !== undefined) await log(db, me, `Stock: “${prev.name}”`, `${prev.stock ?? "—"} → ${flags.stock ?? "not tracked"}`);
    else await log(db, me, `${flags.published === false ? "Hid" : flags.published ? "Showed" : flags.featured ? "Featured" : "Un-featured"} “${prev.name}”`);
    return undefined;
  });
}

/** Moves a product to the front of the shop. */
export async function bumpProduct(id: string): Promise<ActionResult> {
  return run(async () => {
    const { db } = await guard("products");
    const top = must(await db.from("products").select("sort_order").order("sort_order", { ascending: false }).limit(1)) as { sort_order: number }[];
    must(await db.from("products").update({ sort_order: (top[0]?.sort_order ?? 0) + 1 }).eq("id", id));
    return undefined;
  });
}

/* ── Categories ───────────────────────────────────────── */

export async function saveCategory(input: { slug?: string; label: string; order: number }): Promise<ActionResult<{ slug: string }>> {
  return run(async () => {
    const { db, me } = await guard("products");
    const label = input.label.trim();
    if (!label) throw new Error("Category needs a name.");
    const slug = input.slug ?? slugify(label);
    must(await db.from("categories").upsert({ slug, label, sort_order: input.order }));
    await log(db, me, `${input.slug ? "Renamed" : "Added"} category “${label}”`);
    return { slug };
  });
}

export async function deleteCategory(slug: string): Promise<ActionResult> {
  return run(async () => {
    const { db, me } = await guard("products");
    must(await db.from("categories").delete().eq("slug", slug)); // products keep existing, uncategorised
    await log(db, me, `Removed category “${slug}”`);
    return undefined;
  });
}

/* ── Orders ───────────────────────────────────────────── */

export async function updateOrder(id: string, patch: { status?: OrderStatus; paid?: boolean; internalNotes?: string; notify?: boolean }): Promise<ActionResult<{ emailed: boolean }>> {
  return run(async () => {
    const { db, me } = await guard("orders");
    const before = await orderBy(db, "id", id);
    if (!before) throw new Error("Order not found.");
    if (patch.status === "cancelled") must(await db.rpc("cancel_order", { p_order: id })); // puts stock back
    const row: Record<string, unknown> = {};
    if (patch.status && patch.status !== "cancelled") {
      if (!ORDER_STATUSES.includes(patch.status)) throw new Error("Unknown status.");
      row.status = patch.status;
      if (patch.status === "completed") row.paid = true;
    }
    if (patch.paid !== undefined) row.paid = patch.paid;
    if (patch.internalNotes !== undefined) row.internal_notes = patch.internalNotes;
    if (Object.keys(row).length) must(await db.from("orders").update(row).eq("id", id));

    if (patch.status) await log(db, me, `Order #${before.number} → ${{ new: "received", ready: "ready for pickup", completed: "picked up", cancelled: "cancelled (stock returned)", awaiting_payment: "awaiting payment" }[patch.status]}`);
    else if (patch.paid !== undefined) await log(db, me, `Order #${before.number} marked ${patch.paid ? "paid" : "unpaid"}`);

    let emailed = false;
    if (patch.status === "ready" && patch.notify !== false && emailConfigured()) {
      const order = await orderBy(db, "id", id);
      const { data: s } = await db.from("store_settings").select("*").eq("id", 1).maybeSingle();
      const st = mapSettings(s);
      if (order) emailed = await emailOrderReady(order, `${st.address}, ${st.city} · ${st.phone}`, st.notifications);
    }
    return { emailed };
  });
}

/* ── Service requests ─────────────────────────────────── */

export async function updateRequest(id: string, patch: { status?: RequestStatus; internalNotes?: string }): Promise<ActionResult> {
  return run(async () => {
    const { db, me } = await guard("bookings");
    const row: Record<string, unknown> = {};
    if (patch.status) {
      if (!REQUEST_STATUSES.includes(patch.status)) throw new Error("Unknown status.");
      row.status = patch.status;
    }
    if (patch.internalNotes !== undefined) row.internal_notes = patch.internalNotes;
    const r = must(await db.from("service_requests").update(row).eq("id", id).select("name,service_title").single()) as { name: string; service_title: string };
    if (patch.status) await log(db, me, `Booking: ${r.service_title} for ${r.name} → ${patch.status}`);
    return undefined;
  });
}

export async function deleteRequest(id: string): Promise<ActionResult> {
  return run(async () => {
    const { db, me } = await guard("bookings");
    must(await db.from("service_requests").delete().eq("id", id));
    await log(db, me, "Deleted a booking request");
    return undefined;
  });
}

/* ── Services ─────────────────────────────────────────── */

export interface ServiceInput { id?: string; title: string; summary: string; details: string[]; priceLabel: string; bookable: boolean; published: boolean; order: number }

export async function saveService(input: ServiceInput): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const { db, me } = await guard("content");
    const title = input.title.trim();
    if (!title) throw new Error("Service needs a title.");
    const row = {
      title, summary: input.summary.trim() || null, details: input.details.map((d) => d.trim()).filter(Boolean),
      price_label: input.priceLabel.trim() || null, bookable: input.bookable, published: input.published, sort_order: input.order,
    };
    const r = input.id
      ? (must(await db.from("services").update(row).eq("id", input.id).select("id").single()) as { id: string })
      : (must(await db.from("services").insert({ ...row, slug: `${slugify(title)}-${rand()}` }).select("id").single()) as { id: string });
    await log(db, me, `${input.id ? "Edited" : "Added"} service “${title}”`, row.price_label ?? undefined);
    return r;
  });
}

export async function deleteService(id: string): Promise<ActionResult> {
  return run(async () => {
    const { db, me } = await guard("content");
    must(await db.from("services").delete().eq("id", id));
    await log(db, me, "Deleted a service");
    return undefined;
  });
}

/* ── Store settings (website content) ─────────────────── */

export interface SettingsInput {
  name: string; tagline: string; address: string; city: string; province: string; postal: string; phone: string; email: string;
  hours: DayHours[]; hoursNote: string; hoursConfirmed: boolean;
  announcement: string; announcementOn: boolean; heroTitle: string; heroSub: string; about: string[];
  homeSections: HomeSections;
  googleRating: number | null; googleReviews: number | null; googleUrl: string; socials: Social[];
  taxRate: number; pickupNote: string; onlinePayments: boolean;
}

export async function saveSettings(i: SettingsInput): Promise<ActionResult> {
  return run(async () => {
    const { db, me } = await guard("content");
    if (i.hours.length !== 7) throw new Error("Hours need all seven days.");
    for (const h of i.hours) if (!h.closed && h.close <= h.open) throw new Error("A closing time is before its opening time.");
    if (!(i.taxRate >= 0 && i.taxRate < 0.5)) throw new Error("Tax rate looks wrong.");
    must(await db.from("store_settings").upsert({
      id: 1, name: i.name.trim() || "Tecumseh Golf", tagline: i.tagline.trim(), address: i.address.trim(), city: i.city.trim(),
      province: i.province.trim(), postal: i.postal.trim(), phone: i.phone.trim(), email: i.email.trim(),
      hours: i.hours, hours_note: i.hoursNote.trim() || null, hours_confirmed: i.hoursConfirmed,
      announcement: i.announcement.trim() || null, announcement_on: i.announcementOn,
      hero_title: i.heroTitle.trim() || null, hero_sub: i.heroSub.trim() || null, about: i.about.map((x) => x.trim()).filter(Boolean),
      home_sections: i.homeSections,
      google_rating: i.googleRating, google_reviews: i.googleReviews, google_url: i.googleUrl.trim() || null,
      socials: i.socials.filter((s) => s.label.trim() && s.href.trim()),
      tax_rate: i.taxRate, pickup_note: i.pickupNote.trim() || null, online_payments: i.onlinePayments,
    }));
    await log(db, me, "Updated website content");
    return undefined;
  });
}

/* ── Notifications ────────────────────────────────────── */

export async function saveNotifications(n: NotificationSettings): Promise<ActionResult> {
  return run(async () => {
    const { db, me } = await guard("notifications");
    const recipients = [...new Set(n.recipients.map((e) => e.trim().toLowerCase()).filter((e) => /^\S+@\S+\.\S+$/.test(e)))].slice(0, 10);
    const clean: NotificationSettings = {
      recipients,
      newOrder: !!n.newOrder, newBooking: !!n.newBooking, lowStock: !!n.lowStock,
      lowStockAt: Math.max(0, Math.min(50, Math.round(Number(n.lowStockAt) || 0))),
      customerReceipt: !!n.customerReceipt, customerReady: !!n.customerReady,
    };
    must(await db.from("store_settings").upsert({ id: 1, notifications: clean }));
    await log(db, me, "Updated notification settings", recipients.length ? `Alerts to ${recipients.join(", ")}` : undefined);
    return undefined;
  });
}

export async function sendTestAlert(): Promise<ActionResult<{ to: string[] }>> {
  return run(async () => {
    const { db } = await guard("notifications");
    if (!emailConfigured()) throw new Error("Email isn't connected yet — add RESEND_API_KEY in Vercel.");
    const { data: s } = await db.from("store_settings").select("*").eq("id", 1).maybeSingle();
    const to = staffInbox(mapSettings(s).notifications);
    if (!to.length) throw new Error("Add at least one email to send alerts to.");
    if (!(await emailTest(to))) throw new Error("The email service rejected the message — check NOTIFY_FROM is a verified sender.");
    return { to };
  });
}

/* ── Staff / team (managers only) ─────────────────────── */

export interface StaffInput { id?: string; name: string; email: string; password?: string; role: Role; permissions: Permission[]; active: boolean }

async function findAuthUserId(db: Db, email: string): Promise<string | null> {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (hit) return hit.id;
    if (data.users.length < 1000) return null;
  }
  return null;
}

/** Managers must always exist: refuse changes that would leave the shop without one. */
async function assertManagerRemains(db: Db, changingId: string) {
  const { data } = await db.from("staff").select("id").eq("role", "manager").eq("active", true).neq("id", changingId);
  if (!data?.length && !ownerEmails().length) throw new Error("There has to be at least one active manager.");
}

export async function saveStaff(input: StaffInput): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const { db, me } = await guard("manager");
    const email = input.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email.");
    const role: Role = input.role === "manager" ? "manager" : "staff";
    const permissions = role === "manager" ? ALL_PERMISSIONS : cleanPermissions(input.permissions);
    const row = { name: input.name.trim() || null, role, permissions, active: input.active };

    if (input.id) {
      const prev = must(await db.from("staff").select("*").eq("id", input.id).single()) as any;
      if (ownerEmails().includes(prev.email) && (role !== "manager" || !input.active)) throw new Error("The owner account (ADMIN_EMAILS) is always an active manager.");
      if (prev.user_id === me.id && (role !== "manager" || !input.active)) throw new Error("You can't remove your own manager access.");
      if (prev.role === "manager" && (role !== "manager" || !input.active)) await assertManagerRemains(db, input.id);
      must(await db.from("staff").update(row).eq("id", input.id));
      if (input.password) {
        if (input.password.length < 8) throw new Error("Passwords need at least 8 characters.");
        if (!prev.user_id) throw new Error("This person hasn't got a login yet.");
        const { error } = await db.auth.admin.updateUserById(prev.user_id, { password: input.password });
        if (error) throw new Error(error.message);
      }
      await log(db, me, `Updated ${prev.name || prev.email}`, [role === "manager" ? "Manager" : `Staff: ${permissions.join(", ") || "no access"}`, input.active ? null : "deactivated", input.password ? "password reset" : null].filter(Boolean).join(" · "));
      return { id: input.id };
    }

    // New team member: create their login (or reuse it if this email already has one, e.g. a shopper account)
    const existing = must(await db.from("staff").select("id").eq("email", email).maybeSingle());
    if (existing) throw new Error("That email is already on the team.");
    let userId = await findAuthUserId(db, email);
    if (!userId) {
      if (!input.password || input.password.length < 8) throw new Error("Set a temporary password (8+ characters) for their first sign-in.");
      const { data, error } = await db.auth.admin.createUser({ email, password: input.password, email_confirm: true, user_metadata: { name: input.name.trim() } });
      if (error || !data.user) throw new Error(error?.message ?? "Couldn't create the login.");
      userId = data.user.id;
    } else if (input.password) {
      if (input.password.length < 8) throw new Error("Passwords need at least 8 characters.");
      await db.auth.admin.updateUserById(userId, { password: input.password });
    }
    const r = must(await db.from("staff").insert({ ...row, email, user_id: userId }).select("id").single()) as { id: string };
    await log(db, me, `Added ${input.name.trim() || email} to the team`, role === "manager" ? "Manager" : `Staff: ${permissions.join(", ")}`);
    return r;
  });
}

export async function removeStaff(id: string): Promise<ActionResult> {
  return run(async () => {
    const { db, me } = await guard("manager");
    const prev = must(await db.from("staff").select("*").eq("id", id).single()) as any;
    if (ownerEmails().includes(prev.email)) throw new Error("The owner account (ADMIN_EMAILS) can't be removed here.");
    if (prev.user_id === me.id) throw new Error("You can't remove yourself.");
    if (prev.role === "manager") await assertManagerRemains(db, id);
    // Their login stays (they may also shop here) — they just lose dashboard access.
    must(await db.from("staff").delete().eq("id", id));
    await log(db, me, `Removed ${prev.name || prev.email} from the team`);
    return undefined;
  });
}
