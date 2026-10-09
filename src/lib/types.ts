/** Domain model — mirrors supabase/migrations/0001_init.sql */

export interface ImageAsset {
  /** "/bundled/path" (no extension) or a storage key in the 'shop' bucket; renditions are `${key}-480|828|1170.webp` */
  key: string;
  width: number;
  height: number;
  blur?: string;
}

export interface DayHours {
  day: number; // 0 = Sunday
  open: string; // "09:00"
  close: string; // "19:00"
  closed: boolean;
}

export interface RangePrice { label: string; detail: string; price: string }
export interface Social { label: string; href: string }

export interface StoreSettings {
  name: string;
  tagline: string;
  address: string;
  city: string;
  province: string;
  postal: string;
  phone: string;
  email: string;
  hours: DayHours[];
  hoursNote: string;
  hoursConfirmed: boolean;
  announcement: string;
  announcementOn: boolean;
  heroTitle: string;
  heroSub: string;
  about: string[];
  rangePrices: RangePrice[];
  rangeNote: string;
  googleRating: number | null;
  googleReviews: number | null;
  googleUrl: string;
  socials: Social[];
  taxRate: number;
  pickupNote: string;
  onlinePayments: boolean;
}

export interface Category { slug: string; label: string; order: number }

export interface ProductOption { name: string; values: string[] }

export type Condition = "new" | "used";

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string | null;
  condition: Condition;
  description: string;
  priceCents: number;
  compareAtCents: number | null;
  stock: number | null; // null = not tracked
  options: ProductOption[];
  images: ImageAsset[];
  featured: boolean;
  isSample: boolean;
  order: number;
  createdAt: string;
}

export interface Service {
  id: string;
  slug: string;
  title: string;
  summary: string;
  details: string[];
  priceLabel: string;
  bookable: boolean;
  order: number;
}

export interface Snapshot {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  services: Service[];
  source: "supabase" | "sample";
  /** true when payments can actually be taken (setting on AND Stripe key present) */
  cardPayments: boolean;
}

export type OrderStatus = "awaiting_payment" | "new" | "ready" | "completed" | "cancelled";
export type PaymentMethod = "pickup" | "card";
export type RequestStatus = "new" | "contacted" | "scheduled" | "completed" | "cancelled";

export interface OrderItem { id: string; productId: string | null; name: string; option: string | null; unitCents: number; qty: number }

export interface Order {
  id: string;
  number: number;
  token: string;
  createdAt: string;
  status: OrderStatus;
  payment: PaymentMethod;
  paid: boolean;
  customerId: string | null;
  name: string;
  email: string;
  phone: string | null;
  note: string | null;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  items: OrderItem[];
  internalNotes: string;
}

export interface ServiceRequest {
  id: string;
  createdAt: string;
  status: RequestStatus;
  serviceSlug: string | null;
  serviceTitle: string;
  preferredDate: string | null;
  preferredTime: string | null;
  name: string;
  email: string;
  phone: string | null;
  details: string | null;
  internalNotes: string;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone: string;
  marketing: boolean;
  createdAt: string;
}

export interface CartLine { productId: string; option: string | null; qty: number }
