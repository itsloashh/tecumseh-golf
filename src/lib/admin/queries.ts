/** Admin reads — service-role, includes hidden products and private customer data. Server-only. */
import { cache } from "react";
import type { Category, Customer, Order, Product, Service, ServiceRequest, StoreSettings } from "@/lib/types";
import { mapCategory, mapCustomer, mapOrder, mapProduct, mapRequest, mapService, mapSettings, stripeConfigured, supabaseService } from "@/lib/data/supabase";
import { ORDER_SELECT } from "@/lib/orders";
import * as sample from "@/lib/data/sample";
import { demoMode, ownerEmails } from "./session";
import { ALL_PERMISSIONS, cleanPermissions, type Permission, type Role } from "./permissions";

export type AdminProduct = Product & { published: boolean };
export type AdminService = Service & { published: boolean };
export type AdminCustomer = Customer & { orders: number; spentCents: number; lastOrder: string | null };
export interface TeamMember { id: string; userId: string | null; email: string; name: string; role: Role; permissions: Permission[]; active: boolean; owner: boolean; createdAt: string; lastSeenAt: string | null }
export interface ActivityEntry { id: number; at: string; actorEmail: string; actorName: string; action: string; detail: string }

export interface AdminData {
  settings: StoreSettings;
  categories: Category[];
  products: AdminProduct[];
  services: AdminService[];
  orders: Order[];
  requests: ServiceRequest[];
  customers: AdminCustomer[];
  team: TeamMember[];
  activity: ActivityEntry[];
  stripeReady: boolean;
  emailReady: boolean;
  demo: boolean;
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600e3).toISOString();

function demoData(): AdminData {
  const p = sample.products;
  const orders: Order[] = [
    { id: "o1", number: 1003, token: "00000000-0000-0000-0000-000000000003", createdAt: hoursAgo(1), status: "new", payment: "pickup", paid: false, customerId: "c1", name: "Example Customer", email: "customer@example.com", phone: "519-555-0100", note: "EXAMPLE ORDER — picking up Saturday morning", subtotalCents: 7498, taxCents: 975, totalCents: 8473, internalNotes: "",
      items: [{ id: "i1", productId: p[0].id, name: p[0].name, option: null, unitCents: 4999, qty: 1 }, { id: "i2", productId: p[9].id, name: p[9].name, option: "Hand: Left (for RH golfer) · Size: ML", unitCents: 2499, qty: 1 }] },
    { id: "o2", number: 1002, token: "00000000-0000-0000-0000-000000000002", createdAt: hoursAgo(26), status: "ready", payment: "card", paid: true, customerId: null, name: "Sample Shopper", email: "shopper@example.com", phone: null, note: null, subtotalCents: 24999, taxCents: 3250, totalCents: 28249, internalNotes: "On the shelf behind the counter",
      items: [{ id: "i3", productId: p[7].id, name: p[7].name, option: "Colour: Black", unitCents: 24999, qty: 1 }] },
    { id: "o3", number: 1001, token: "00000000-0000-0000-0000-000000000001", createdAt: hoursAgo(80), status: "completed", payment: "pickup", paid: true, customerId: "c1", name: "Example Customer", email: "customer@example.com", phone: "519-555-0100", note: null, subtotalCents: 899, taxCents: 117, totalCents: 1016, internalNotes: "",
      items: [{ id: "i4", productId: p[14].id, name: p[14].name, option: null, unitCents: 899, qty: 1 }] },
  ];
  return {
    settings: sample.settings,
    categories: sample.categories,
    products: p.map((x) => ({ ...x, published: true })),
    services: sample.services.map((x) => ({ ...x, published: true })),
    orders,
    requests: [
      { id: "r1", createdAt: hoursAgo(3), status: "new", serviceSlug: "fitting", serviceTitle: "Club fitting", preferredDate: null, preferredTime: "Evening", name: "Example Golfer", email: "golfer@example.com", phone: "519-555-0199", details: "EXAMPLE REQUEST — looking at a new driver, slice off the tee.", internalNotes: "" },
      { id: "r2", createdAt: hoursAgo(30), status: "scheduled", serviceSlug: "repairs", serviceTitle: "Repairs & regripping", preferredDate: null, preferredTime: "Any time", name: "Sample Person", email: "sample@example.com", phone: null, details: "EXAMPLE REQUEST — regrip 7 irons, midsize.", internalNotes: "Dropping off Thursday" },
    ],
    customers: [{ id: "c1", email: "customer@example.com", name: "Example Customer", phone: "519-555-0100", marketing: true, createdAt: hoursAgo(200), orders: 2, spentCents: 9489, lastOrder: hoursAgo(1) }],
    team: [
      { id: "s1", userId: "demo", email: "owner@example.com", name: "Demo Manager", role: "manager", permissions: [...ALL_PERMISSIONS], active: true, owner: true, createdAt: hoursAgo(400), lastSeenAt: hoursAgo(0.1) },
      { id: "s2", userId: "u2", email: "counter@example.com", name: "Example Employee", role: "staff", permissions: ["orders", "stock", "bookings"], active: true, owner: false, createdAt: hoursAgo(300), lastSeenAt: hoursAgo(5) },
      { id: "s3", userId: "u3", email: "lead@example.com", name: "Example Shop Lead", role: "staff", permissions: ["orders", "products", "prices", "stock", "bookings", "customers"], active: true, owner: false, createdAt: hoursAgo(250), lastSeenAt: hoursAgo(30) },
    ],
    activity: [
      { id: 3, at: hoursAgo(0.5), actorEmail: "counter@example.com", actorName: "Example Employee", action: "Order #1002 → ready for pickup", detail: "" },
      { id: 2, at: hoursAgo(4), actorEmail: "lead@example.com", actorName: "Example Shop Lead", action: "Edited product “Soft Feel Golf Balls — Dozen”", detail: "on sale (was $34.99)" },
      { id: 1, at: hoursAgo(28), actorEmail: "counter@example.com", actorName: "Example Employee", action: "Stock: “Cart Bag”", detail: "3 → 2" },
    ],
    stripeReady: false,
    emailReady: false,
    demo: true,
  };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function load(): Promise<AdminData> {
  if (demoMode()) return demoData();
  const db = supabaseService();
  if (!db) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
  const [s, c, p, v, o, r, cu, st, ac] = await Promise.all([
    db.from("store_settings").select("*").eq("id", 1).maybeSingle(),
    db.from("categories").select("*").order("sort_order"),
    db.from("products").select("*").order("sort_order", { ascending: false }),
    db.from("services").select("*").order("sort_order", { ascending: false }),
    db.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(300),
    db.from("service_requests").select("*").order("created_at", { ascending: false }).limit(200),
    db.from("customers").select("*").order("created_at", { ascending: false }).limit(1000),
    db.from("staff").select("*").order("created_at"),
    db.from("activity_log").select("*").order("at", { ascending: false }).limit(300),
  ]);
  for (const x of [s, c, p, v, o, r, cu, st, ac]) if (x.error) throw x.error;
  const owners = ownerEmails();
  const team: TeamMember[] = (st.data ?? []).map((x: any) => ({
    id: x.id, userId: x.user_id, email: x.email, name: x.name ?? "", role: x.role === "manager" || owners.includes(x.email) ? "manager" : "staff",
    permissions: x.role === "manager" ? [...ALL_PERMISSIONS] : cleanPermissions(x.permissions ?? []), active: !!x.active || owners.includes(x.email),
    owner: owners.includes(x.email), createdAt: x.created_at, lastSeenAt: x.last_seen_at,
  }));
  const staffEmails = new Set(team.map((t) => t.email));

  const orders = (o.data ?? []).map(mapOrder);
  const stats = new Map<string, { n: number; spent: number; last: string }>();
  for (const ord of orders) {
    if (!ord.customerId || ord.status === "cancelled" || ord.status === "awaiting_payment") continue;
    const st = stats.get(ord.customerId) ?? { n: 0, spent: 0, last: ord.createdAt };
    st.n++; st.spent += ord.totalCents; if (ord.createdAt > st.last) st.last = ord.createdAt;
    stats.set(ord.customerId, st);
  }
  return {
    settings: mapSettings(s.data),
    categories: (c.data ?? []).map(mapCategory),
    products: (p.data ?? []).map((x: any) => ({ ...mapProduct(x), published: !!x.published })),
    services: (v.data ?? []).map((x: any) => ({ ...mapService(x), published: !!x.published })),
    orders,
    requests: (r.data ?? []).map(mapRequest),
    team,
    activity: (ac.data ?? []).map((x: any) => ({ id: x.id, at: x.at, actorEmail: x.actor_email ?? "", actorName: x.actor_name ?? "", action: x.action, detail: x.detail ?? "" })),
    customers: (cu.data ?? []).filter((x: any) => !staffEmails.has((x.email ?? "").toLowerCase())).map((x: any) => {
      const st = stats.get(x.id);
      return { ...mapCustomer(x), orders: st?.n ?? 0, spentCents: st?.spent ?? 0, lastOrder: st?.last ?? null };
    }),
    stripeReady: stripeConfigured() && !!process.env.STRIPE_WEBHOOK_SECRET,
    emailReady: !!process.env.RESEND_API_KEY,
    demo: false,
  };
}

/** One read per request, shared by the admin layout and page. */
export const getAdminData = cache(load);
