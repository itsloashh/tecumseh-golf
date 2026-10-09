"use server";
/**
 * Every admin write goes through here (same pattern as LOASH): each action re-checks the
 * session, writes with the service-role client, then revalidates the public site so changes
 * appear immediately.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { DayHours, ImageAsset, OrderStatus, ProductOption, RangePrice, RequestStatus, Social } from "@/lib/types";
import { mapSettings, supabaseService } from "@/lib/data/supabase";
import { getAdmin, isAdminUser } from "@/lib/admin/session";
import { supabaseSession } from "@/lib/auth/server";
import { orderBy } from "@/lib/orders";
import { emailOrderReady } from "@/lib/notify";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const ORDER_STATUSES: OrderStatus[] = ["awaiting_payment", "new", "ready", "completed", "cancelled"];
const REQUEST_STATUSES: RequestStatus[] = ["new", "contacted", "scheduled", "completed", "cancelled"];

async function guard() {
  const admin = await getAdmin();
  if (!admin) throw new Error("Your session expired — sign in again.");
  if (admin.demo) throw new Error("Demo mode — connect Supabase to save changes.");
  const db = supabaseService();
  if (!db) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing in your environment.");
  return db;
}
type Db = Awaited<ReturnType<typeof guard>>;

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
  if (!(await isAdminUser(data.user.id, data.user.email))) {
    await sb.auth.signOut();
    return { error: "This account isn't a staff account. Add it to ADMIN_EMAILS or the admins table (see README)." };
  }
  redirect("/admin");
}

export async function signOut() {
  const sb = await supabaseSession();
  await sb.auth.signOut();
  redirect("/admin/login");
}

/* ── Uploads ──────────────────────────────────────────── */

export async function createUploadSlots(widths: number[]): Promise<ActionResult<{ key: string; slots: { width: number; path: string; token: string }[] }>> {
  return run(async () => {
    const db = await guard();
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

export async function saveProduct(input: ProductInput): Promise<ActionResult<{ id: string; slug: string }>> {
  return run(async () => {
    const db = await guard();
    const name = input.name.trim();
    if (!name) throw new Error("Give the product a name.");
    if (!Number.isInteger(input.priceCents) || input.priceCents < 0) throw new Error("Enter a price.");
    if (input.stock != null && (!Number.isInteger(input.stock) || input.stock < 0)) throw new Error("Stock must be 0 or more.");
    const row: Record<string, unknown> = {
      name,
      brand: input.brand.trim() || null,
      category: input.category || null,
      condition: input.condition === "used" ? "used" : "new",
      description: input.description.trim() || null,
      price_cents: input.priceCents,
      compare_at_cents: input.compareAtCents && input.compareAtCents > input.priceCents ? input.compareAtCents : null,
      stock: input.stock,
      options: input.options.map((o) => ({ name: o.name.trim(), values: o.values.map((v) => v.trim()).filter(Boolean) })).filter((o) => o.name && o.values.length),
      images: input.images.slice(0, 8),
      featured: input.featured,
      published: input.published,
      is_sample: false, // anything edited by staff is real
    };
    if (input.id) {
      const prev = must(await db.from("products").select("images").eq("id", input.id).single()) as { images: ImageAsset[] };
      const r = must(await db.from("products").update(row).eq("id", input.id).select("id,slug").single()) as { id: string; slug: string };
      const kept = new Set(input.images.map((i) => i.key));
      await removeImages(db, (prev.images ?? []).map((i) => i.key).filter((k) => !kept.has(k)));
      return r;
    }
    const top = must(await db.from("products").select("sort_order").order("sort_order", { ascending: false }).limit(1)) as { sort_order: number }[];
    row.sort_order = (top[0]?.sort_order ?? 0) + 1; // new products go to the front
    row.slug = `${slugify(name)}-${rand()}`;
    return must(await db.from("products").insert(row).select("id,slug").single()) as { id: string; slug: string };
  });
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  return run(async () => {
    const db = await guard();
    const prev = must(await db.from("products").select("images").eq("id", id).single()) as { images: ImageAsset[] };
    must(await db.from("products").delete().eq("id", id)); // past orders keep their line items (product_id → null)
    await removeImages(db, (prev.images ?? []).map((i) => i.key));
    return undefined;
  });
}

export async function setProductFlags(id: string, flags: { featured?: boolean; published?: boolean; stock?: number | null }): Promise<ActionResult> {
  return run(async () => {
    const db = await guard();
    if (flags.stock != null && flags.stock < 0) flags.stock = 0;
    must(await db.from("products").update(flags).eq("id", id));
    return undefined;
  });
}

/** Moves a product to the front of the shop. */
export async function bumpProduct(id: string): Promise<ActionResult> {
  return run(async () => {
    const db = await guard();
    const top = must(await db.from("products").select("sort_order").order("sort_order", { ascending: false }).limit(1)) as { sort_order: number }[];
    must(await db.from("products").update({ sort_order: (top[0]?.sort_order ?? 0) + 1 }).eq("id", id));
    return undefined;
  });
}

/* ── Categories ───────────────────────────────────────── */

export async function saveCategory(input: { slug?: string; label: string; order: number }): Promise<ActionResult<{ slug: string }>> {
  return run(async () => {
    const db = await guard();
    const label = input.label.trim();
    if (!label) throw new Error("Category needs a name.");
    const slug = input.slug ?? slugify(label);
    must(await db.from("categories").upsert({ slug, label, sort_order: input.order }));
    return { slug };
  });
}

export async function deleteCategory(slug: string): Promise<ActionResult> {
  return run(async () => {
    const db = await guard();
    must(await db.from("categories").delete().eq("slug", slug)); // products keep existing, uncategorised
    return undefined;
  });
}

/* ── Orders ───────────────────────────────────────────── */

export async function updateOrder(id: string, patch: { status?: OrderStatus; paid?: boolean; internalNotes?: string; notify?: boolean }): Promise<ActionResult<{ emailed: boolean }>> {
  return run(async () => {
    const db = await guard();
    if (patch.status === "cancelled") {
      must(await db.rpc("cancel_order", { p_order: id })); // puts stock back
    }
    const row: Record<string, unknown> = {};
    if (patch.status && patch.status !== "cancelled") {
      if (!ORDER_STATUSES.includes(patch.status)) throw new Error("Unknown status.");
      row.status = patch.status;
      if (patch.status === "completed") row.paid = true;
    }
    if (patch.paid !== undefined) row.paid = patch.paid;
    if (patch.internalNotes !== undefined) row.internal_notes = patch.internalNotes;
    if (Object.keys(row).length) must(await db.from("orders").update(row).eq("id", id));

    let emailed = false;
    if (patch.status === "ready" && patch.notify !== false && process.env.RESEND_API_KEY) {
      const order = await orderBy(db, "id", id);
      const { data: s } = await db.from("store_settings").select("*").eq("id", 1).maybeSingle();
      const st = mapSettings(s);
      if (order) { await emailOrderReady(order, `${st.address}, ${st.city} · ${st.phone}`); emailed = true; }
    }
    return { emailed };
  });
}

/* ── Service requests ─────────────────────────────────── */

export async function updateRequest(id: string, patch: { status?: RequestStatus; internalNotes?: string }): Promise<ActionResult> {
  return run(async () => {
    const db = await guard();
    const row: Record<string, unknown> = {};
    if (patch.status) {
      if (!REQUEST_STATUSES.includes(patch.status)) throw new Error("Unknown status.");
      row.status = patch.status;
    }
    if (patch.internalNotes !== undefined) row.internal_notes = patch.internalNotes;
    must(await db.from("service_requests").update(row).eq("id", id));
    return undefined;
  });
}

export async function deleteRequest(id: string): Promise<ActionResult> {
  return run(async () => {
    const db = await guard();
    must(await db.from("service_requests").delete().eq("id", id));
    return undefined;
  });
}

/* ── Services ─────────────────────────────────────────── */

export interface ServiceInput { id?: string; title: string; summary: string; details: string[]; priceLabel: string; bookable: boolean; published: boolean; order: number }

export async function saveService(input: ServiceInput): Promise<ActionResult<{ id: string }>> {
  return run(async () => {
    const db = await guard();
    const title = input.title.trim();
    if (!title) throw new Error("Service needs a title.");
    const row = {
      title, summary: input.summary.trim() || null, details: input.details.map((d) => d.trim()).filter(Boolean),
      price_label: input.priceLabel.trim() || null, bookable: input.bookable, published: input.published, sort_order: input.order,
    };
    if (input.id) return must(await db.from("services").update(row).eq("id", input.id).select("id").single()) as { id: string };
    return must(await db.from("services").insert({ ...row, slug: `${slugify(title)}-${rand()}` }).select("id").single()) as { id: string };
  });
}

export async function deleteService(id: string): Promise<ActionResult> {
  return run(async () => {
    const db = await guard();
    must(await db.from("services").delete().eq("id", id));
    return undefined;
  });
}

/* ── Store settings ───────────────────────────────────── */

export interface SettingsInput {
  name: string; tagline: string; address: string; city: string; province: string; postal: string; phone: string; email: string;
  hours: DayHours[]; hoursNote: string; hoursConfirmed: boolean;
  announcement: string; announcementOn: boolean; heroTitle: string; heroSub: string; about: string[];
  rangePrices: RangePrice[]; rangeNote: string;
  googleRating: number | null; googleReviews: number | null; googleUrl: string; socials: Social[];
  taxRate: number; pickupNote: string; onlinePayments: boolean;
}

export async function saveSettings(i: SettingsInput): Promise<ActionResult> {
  return run(async () => {
    const db = await guard();
    if (i.hours.length !== 7) throw new Error("Hours need all seven days.");
    for (const h of i.hours) if (!h.closed && h.close <= h.open) throw new Error("A closing time is before its opening time.");
    if (!(i.taxRate >= 0 && i.taxRate < 0.5)) throw new Error("Tax rate looks wrong.");
    must(await db.from("store_settings").upsert({
      id: 1, name: i.name.trim() || "Tecumseh Golf", tagline: i.tagline.trim(), address: i.address.trim(), city: i.city.trim(),
      province: i.province.trim(), postal: i.postal.trim(), phone: i.phone.trim(), email: i.email.trim(),
      hours: i.hours, hours_note: i.hoursNote.trim() || null, hours_confirmed: i.hoursConfirmed,
      announcement: i.announcement.trim() || null, announcement_on: i.announcementOn,
      hero_title: i.heroTitle.trim() || null, hero_sub: i.heroSub.trim() || null, about: i.about.map((x) => x.trim()).filter(Boolean),
      range_prices: i.rangePrices.filter((r) => r.label.trim()), range_note: i.rangeNote.trim() || null,
      google_rating: i.googleRating, google_reviews: i.googleReviews, google_url: i.googleUrl.trim() || null,
      socials: i.socials.filter((s) => s.label.trim() && s.href.trim()),
      tax_rate: i.taxRate, pickup_note: i.pickupNote.trim() || null, online_payments: i.onlinePayments,
    }));
    return undefined;
  });
}
