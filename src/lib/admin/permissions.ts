/**
 * Staff roles & permissions (shared by server and browser).
 * Managers can do everything, including managing staff and seeing the activity log.
 * Employees ("staff") only get the permissions a manager ticks for them.
 */
export const PERMISSIONS = [
  { key: "orders", label: "Orders", desc: "See orders, mark ready / picked up, take payment, cancel" },
  { key: "products", label: "Products", desc: "Add, edit, hide and delete products, photos and categories" },
  { key: "prices", label: "Prices & sales", desc: "Change prices and sale prices" },
  { key: "stock", label: "Stock counts", desc: "Adjust how many are in stock" },
  { key: "bookings", label: "Bookings", desc: "Fitting, lesson and repair requests" },
  { key: "customers", label: "Customers", desc: "See customer accounts and contact details" },
  { key: "content", label: "Website content", desc: "Homepage, hours, services, contact info, about text" },
  { key: "notifications", label: "Notifications", desc: "Who gets email alerts and which ones" },
] as const;

export type Permission = (typeof PERMISSIONS)[number]["key"];
export type Role = "manager" | "staff";
export const ALL_PERMISSIONS = PERMISSIONS.map((p) => p.key) as Permission[];

export const PRESETS: { label: string; desc: string; permissions: Permission[] }[] = [
  { label: "Counter staff", desc: "Orders, stock and bookings", permissions: ["orders", "stock", "bookings"] },
  { label: "Shop lead", desc: "Everything except website content and alerts", permissions: ["orders", "products", "prices", "stock", "bookings", "customers"] },
  { label: "Everything", desc: "All screens (but can't manage staff)", permissions: [...ALL_PERMISSIONS] },
];

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  permissions: Permission[];
  /** Listed in ADMIN_EMAILS — can't be demoted or removed from inside the dashboard */
  owner: boolean;
  demo?: boolean;
}

export const can = (u: Pick<StaffUser, "role" | "permissions"> | null | undefined, p: Permission) =>
  !!u && (u.role === "manager" || u.permissions.includes(p));

export const isManager = (u: Pick<StaffUser, "role"> | null | undefined) => u?.role === "manager";

export const cleanPermissions = (list: string[]) => ALL_PERMISSIONS.filter((p) => list.includes(p));
