/**
 * Bundled starter content. The site runs on this until Supabase is connected, and seed.sql
 * loads the same rows into the database. Every product here is flagged isSample and shows a
 * "Sample" tag until it's replaced in /admin.
 */
import type { Category, Product, Service, Snapshot, StoreSettings } from "../types";

export const settings: StoreSettings = {
  name: "Tecumseh Golf",
  tagline: "Pro shop · Heated range · Fitting & repairs",
  address: "366 Manning Rd",
  city: "Tecumseh",
  province: "ON",
  postal: "N8N 4W5",
  phone: "519-735-8933",
  email: "info@tecumsehgolf.com",
  // From public listings — confirm in Admin → Store before launch.
  hours: [
    { day: 0, open: "09:00", close: "15:00", closed: false },
    { day: 1, open: "09:00", close: "19:00", closed: false },
    { day: 2, open: "09:00", close: "19:00", closed: false },
    { day: 3, open: "09:00", close: "19:00", closed: false },
    { day: 4, open: "09:00", close: "19:00", closed: false },
    { day: 5, open: "09:00", close: "19:00", closed: false },
    { day: 6, open: "09:00", close: "16:00", closed: false },
  ],
  hoursNote: "Hours can change with the season and the weather — give us a call if you're unsure.",
  hoursConfirmed: false,
  announcement: "Our new website is live — shop online and pick up in store.",
  announcementOn: true,
  heroTitle: "Your local pro shop & heated range.",
  heroSub:
    "Clubs, balls, bags and apparel — plus year-round heated bays, custom club fitting and repairs, all under one roof on Manning Rd.",
  about: [
    "Tecumseh Golf has been the Windsor–Essex golfer's neighbourhood shop for years: a family-run pro shop, a covered and heated driving range, and staff who actually play the game.",
    "Come hit a bucket in January, get fitted for your next driver, have a shaft or grip replaced, or just stop in and talk golf. Online orders are held at the counter for pickup.",
  ],
  rangePrices: [
    { label: "Small bucket", detail: "Quick warm-up", price: "" },
    { label: "Medium bucket", detail: "Most popular", price: "" },
    { label: "Large bucket", detail: "Full session", price: "" },
    { label: "Heated bay", detail: "Covered, year-round", price: "" },
  ],
  rangeNote: "Heated and non-heated tee boxes with marked distance targets.",
  googleRating: 4.5,
  googleReviews: 161,
  googleUrl: "https://www.google.com/maps/search/?api=1&query=Tecumseh+Golf+Centre+366+Manning+Rd+Tecumseh+ON",
  socials: [],
  taxRate: 0.13,
  pickupNote: "We'll hold your order at the counter and let you know when it's ready — usually the same day.",
  onlinePayments: false,
};

export const categories: Category[] = [
  { slug: "clubs", label: "Clubs", order: 1 },
  { slug: "putters", label: "Putters", order: 2 },
  { slug: "balls", label: "Balls", order: 3 },
  { slug: "bags", label: "Bags", order: 4 },
  { slug: "gloves", label: "Gloves", order: 5 },
  { slug: "apparel", label: "Apparel", order: 6 },
  { slug: "accessories", label: "Accessories", order: 7 },
];

type P = Omit<Product, "id" | "isSample" | "createdAt" | "images" | "options" | "compareAtCents" | "featured"> &
  Partial<Pick<Product, "options" | "compareAtCents" | "featured">>;

const raw: P[] = [
  { slug: "tour-distance-balls-dozen", name: "Tour Distance Golf Balls — Dozen", brand: "Sample Brand", category: "balls", condition: "new", priceCents: 4999, stock: 24, order: 120, featured: true, description: "Three-piece urethane-cover ball with a soft feel around the greens and low spin off the driver. Sold by the dozen." },
  { slug: "soft-feel-balls-dozen", name: "Soft Feel Golf Balls — Dozen", brand: "Sample Brand", category: "balls", condition: "new", priceCents: 2999, compareAtCents: 3499, stock: 30, order: 110, description: "Low-compression two-piece ball for straighter, softer shots. A great everyday ball." },
  { slug: "460cc-driver", name: "460cc Adjustable Driver", brand: "Sample Brand", category: "clubs", condition: "new", priceCents: 54999, stock: 3, order: 100, featured: true, options: [{ name: "Hand", values: ["Right", "Left"] }, { name: "Flex", values: ["Regular", "Stiff", "Senior"] }], description: "Forgiving adjustable driver with a 460cc head. Book a fitting and we'll dial in loft, lie and shaft before you buy." },
  { slug: "game-improvement-irons", name: "Game-Improvement Iron Set (5–PW)", brand: "Sample Brand", category: "clubs", condition: "new", priceCents: 89999, stock: 2, order: 95, options: [{ name: "Hand", values: ["Right", "Left"] }, { name: "Shaft", values: ["Steel", "Graphite"] }], description: "Cavity-back irons built for height and forgiveness. Fitted in store at no extra charge." },
  { slug: "used-blade-putter", name: "Pre-Owned Blade Putter", brand: "Sample Brand", category: "putters", condition: "used", priceCents: 8999, stock: 1, order: 90, featured: true, description: "Classic blade putter in good condition, 34\". Fresh grip installed. One only." },
  { slug: "used-hybrid-22", name: "Pre-Owned 22° Hybrid", brand: "Sample Brand", category: "clubs", condition: "used", priceCents: 7999, stock: 1, order: 85, description: "Lightly used hybrid, regular flex graphite shaft. Easy to launch from the rough." },
  { slug: "mallet-putter", name: "High-MOI Mallet Putter", brand: "Sample Brand", category: "putters", condition: "new", priceCents: 24999, stock: 4, order: 80, options: [{ name: "Length", values: ["33\"", "34\"", "35\""] }], description: "Stable mallet head with an alignment line that frames the ball." },
  { slug: "lightweight-stand-bag", name: "Lightweight Stand Bag", brand: "Sample Brand", category: "bags", condition: "new", priceCents: 24999, stock: 5, order: 75, featured: true, options: [{ name: "Colour", values: ["Fairway Green", "Black", "White"] }], description: "14-way top, dual straps and a waterproof valuables pocket. Under 2 kg." },
  { slug: "cart-bag", name: "Cart Bag", brand: "Sample Brand", category: "bags", condition: "new", priceCents: 29999, compareAtCents: 34999, stock: 2, order: 70, description: "Full-length dividers, cooler pocket and a cart-strap pass-through." },
  { slug: "cabretta-leather-glove", name: "Cabretta Leather Glove", brand: "Sample Brand", category: "gloves", condition: "new", priceCents: 2499, stock: 40, order: 65, featured: true, options: [{ name: "Hand", values: ["Left (for RH golfer)", "Right (for LH golfer)"] }, { name: "Size", values: ["S", "M", "ML", "L", "XL"] }], description: "Soft, thin premium leather for maximum feel." },
  { slug: "winter-mitts", name: "Winter Golf Mitts (Pair)", brand: "Sample Brand", category: "gloves", condition: "new", priceCents: 3499, stock: 10, order: 60, description: "Fleece-lined mitts that slip on between shots. Made for heated-bay season." },
  { slug: "tg-logo-polo", name: "Tecumseh Golf Logo Polo", brand: "Tecumseh Golf", category: "apparel", condition: "new", priceCents: 5499, stock: null, order: 55, featured: true, options: [{ name: "Size", values: ["S", "M", "L", "XL", "XXL"] }], description: "Moisture-wicking performance polo with the Tecumseh Golf mascot on the chest." },
  { slug: "tg-rope-cap", name: "Tecumseh Golf Rope Cap", brand: "Tecumseh Golf", category: "apparel", condition: "new", priceCents: 3499, stock: 15, order: 50, description: "Structured cap with a rope front and embroidered logo. One size." },
  { slug: "rangefinder", name: "Laser Rangefinder with Slope", brand: "Sample Brand", category: "accessories", condition: "new", priceCents: 29999, stock: 3, order: 45, description: "6x magnification, flag-lock vibration and a switchable slope mode." },
  { slug: "tee-pack", name: "Bamboo Tees — Pack of 50", brand: "Sample Brand", category: "accessories", condition: "new", priceCents: 899, stock: null, order: 40, description: "Durable 2¾\" bamboo tees." },
  { slug: "towel-divot-kit", name: "Towel & Divot Tool Kit", brand: "Sample Brand", category: "accessories", condition: "new", priceCents: 2499, stock: 0, order: 35, description: "Waffle towel, magnetic ball marker and a two-prong divot tool." },
];

export const products: Product[] = raw.map((p, i) => ({
  options: [],
  compareAtCents: null,
  featured: false,
  ...p,
  id: `sample-${i + 1}`,
  images: [],
  isSample: true,
  createdAt: new Date(Date.UTC(2026, 9, 1) - i * 864e5).toISOString(),
}));

export const services: Service[] = [
  {
    id: "svc-range", slug: "range", title: "Heated driving range", order: 4, bookable: false, priceLabel: "",
    summary: "Covered, heated bays so you can keep your swing sharp all winter — plus open-air tees when the weather's nice.",
    details: ["Heated and non-heated tee boxes", "Marked distance targets", "Grab a bucket at the counter — no booking needed"],
  },
  {
    id: "svc-fitting", slug: "fitting", title: "Club fitting", order: 3, bookable: true, priceLabel: "",
    summary: "Get dialled in on loft, lie, length and shaft before you buy, with launch-monitor data from the simulator.",
    details: ["Driver, iron, wedge and putter fittings", "Simulator and launch-monitor numbers", "Try before you buy"],
  },
  {
    id: "svc-lessons", slug: "lessons", title: "Golf lessons", order: 2, bookable: true, priceLabel: "",
    summary: "One-on-one coaching for every level — from first swings to shaving strokes off a single-digit handicap.",
    details: ["Private and series lessons", "Video and simulator feedback", "Juniors welcome"],
  },
  {
    id: "svc-repairs", slug: "repairs", title: "Repairs & regripping", order: 1, bookable: true, priceLabel: "",
    summary: "New grips, new shafts, loft and lie adjustments — bring your clubs in and we'll get them playing like new.",
    details: ["Regripping (most sets turned around quickly)", "Shaft replacement & re-shafting", "Loft & lie adjustments"],
  },
];

export function sampleSnapshot(): Snapshot {
  return { settings, categories, products, services, source: "sample", cardPayments: false };
}
