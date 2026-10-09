import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Category, Customer, DayHours, ImageAsset, Order, Product, Service, ServiceRequest, Snapshot, StoreSettings } from "../types";
import { settings as sampleSettings } from "./sample";

export const supabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const stripeConfigured = () => Boolean(process.env.STRIPE_SECRET_KEY);

let anon: SupabaseClient | null = null;
export function supabaseAnon() {
  anon ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  return anon;
}

/** Service-role client — server only (API routes / admin actions). Never import into client components. */
export function supabaseService() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false } });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const arr = <T,>(v: any, fallback: T[] = []): T[] => (Array.isArray(v) ? v : fallback);
const str = (v: any, fallback = "") => (typeof v === "string" ? v : fallback);

export function mapSettings(r: any | null): StoreSettings {
  const s = sampleSettings;
  if (!r) return s;
  const hours = arr<DayHours>(r.hours);
  return {
    name: str(r.name, s.name),
    tagline: str(r.tagline, s.tagline),
    address: str(r.address, s.address),
    city: str(r.city, s.city),
    province: str(r.province, s.province),
    postal: str(r.postal, s.postal),
    phone: str(r.phone, s.phone),
    email: str(r.email, s.email),
    hours: hours.length === 7 ? hours : s.hours,
    hoursNote: str(r.hours_note),
    hoursConfirmed: !!r.hours_confirmed,
    announcement: str(r.announcement),
    announcementOn: !!r.announcement_on,
    heroTitle: str(r.hero_title) || s.heroTitle,
    heroSub: str(r.hero_sub) || s.heroSub,
    about: arr<string>(r.about).filter((x) => x?.trim()),
    homeSections: { ...s.homeSections, ...(r.home_sections ?? {}) },
    notifications: { ...s.notifications, ...(r.notifications ?? {}), recipients: arr<string>(r.notifications?.recipients) },
    googleRating: r.google_rating == null ? null : Number(r.google_rating),
    googleReviews: r.google_reviews ?? null,
    googleUrl: str(r.google_url),
    socials: arr(r.socials),
    taxRate: r.tax_rate == null ? 0.13 : Number(r.tax_rate),
    pickupNote: str(r.pickup_note),
    onlinePayments: !!r.online_payments,
  };
}

export const mapCategory = (r: any): Category => ({ slug: r.slug, label: r.label, order: r.sort_order ?? 0 });

export const mapProduct = (r: any): Product => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  brand: r.brand ?? "",
  category: r.category,
  condition: r.condition === "used" ? "used" : "new",
  description: r.description ?? "",
  priceCents: r.price_cents,
  compareAtCents: r.compare_at_cents,
  stock: r.stock,
  options: arr(r.options),
  images: arr<ImageAsset>(r.images),
  featured: !!r.featured,
  isSample: !!r.is_sample,
  order: r.sort_order ?? 0,
  createdAt: r.created_at,
});

export const mapService = (r: any): Service => ({
  id: r.id, slug: r.slug, title: r.title, summary: r.summary ?? "", details: arr(r.details),
  priceLabel: r.price_label ?? "", bookable: !!r.bookable, order: r.sort_order ?? 0,
});

export const mapOrder = (r: any): Order => ({
  id: r.id, number: r.number, token: r.token, createdAt: r.created_at, status: r.status, payment: r.payment, paid: !!r.paid,
  customerId: r.customer_id, name: r.name, email: r.email, phone: r.phone, note: r.note,
  subtotalCents: r.subtotal_cents, taxCents: r.tax_cents, totalCents: r.total_cents, internalNotes: r.internal_notes ?? "",
  items: arr(r.order_items).map((i: any) => ({ id: i.id, productId: i.product_id, name: i.name, option: i.option, unitCents: i.unit_cents, qty: i.qty })),
});

export const mapRequest = (r: any): ServiceRequest => ({
  id: r.id, createdAt: r.created_at, status: r.status, serviceSlug: r.service_slug, serviceTitle: r.service_title,
  preferredDate: r.preferred_date, preferredTime: r.preferred_time, name: r.name, email: r.email, phone: r.phone,
  details: r.details, internalNotes: r.internal_notes ?? "",
});

export const mapCustomer = (r: any): Customer => ({
  id: r.id, email: r.email ?? "", name: r.name ?? "", phone: r.phone ?? "", marketing: !!r.marketing, createdAt: r.created_at,
});

export async function supabaseSnapshot(): Promise<Snapshot> {
  const db = supabaseAnon();
  const [s, c, p, v] = await Promise.all([
    db.from("store_settings").select("*").eq("id", 1).maybeSingle(),
    db.from("categories").select("*").order("sort_order"),
    db.from("products").select("*").eq("published", true).order("sort_order", { ascending: false }),
    db.from("services").select("*").eq("published", true).order("sort_order", { ascending: false }),
  ]);
  for (const r of [s, c, p, v]) if (r.error) throw r.error;
  const settings = mapSettings(s.data);
  return {
    settings,
    categories: (c.data ?? []).map(mapCategory),
    products: (p.data ?? []).map(mapProduct),
    services: (v.data ?? []).map(mapService),
    source: "supabase",
    cardPayments: settings.onlinePayments && stripeConfigured(),
  };
}
