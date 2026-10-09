"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { can, type Permission, type StaffUser } from "@/lib/admin/permissions";
import { cx, IconBag, IconCal, IconHome, IconMenu, IconStore, IconUser, IconX } from "@/components/ui/primitives";
import { ViewModeSwitch } from "@/components/shell/ViewMode";
import { ToastProvider } from "./kit";
import { signOut } from "@/app/admin/actions";

type IP = { size?: number };
const Svg = ({ size = 20, children }: IP & { children: ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{children}</svg>
);
const IconTag = (p: IP) => <Svg {...p}><path d="M3.5 12.5V4h8.5l8.5 8.5-8.5 8.5z" /><circle cx="8" cy="8.5" r="1.5" /></Svg>;
const IconBell = (p: IP) => <Svg {...p}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></Svg>;
const IconTeam = (p: IP) => <Svg {...p}><circle cx="9" cy="8.5" r="3" /><path d="M3.5 19c.8-3 3-4.5 5.5-4.5s4.7 1.5 5.5 4.5" /><circle cx="17" cy="9.5" r="2.3" /><path d="M16 14.6c2.2.1 3.8 1.4 4.5 3.9" /></Svg>;
const IconPulse = (p: IP) => <Svg {...p}><path d="M3 12h4l2.5-6 4 12 2.5-6H21" /></Svg>;
const IconKey = (p: IP) => <Svg {...p}><circle cx="8" cy="15" r="3.5" /><path d="M10.5 12.5 19 4M15.5 7.5l2 2M17.5 5.5l2 2" /></Svg>;

type NavItem = { href: string; label: string; icon: (p: IP) => ReactNode; need?: Permission | "manager"; badge?: "orders" | "requests" };

const NAV: { group: string; items: NavItem[] }[] = [
  { group: "Shop", items: [
    { href: "/admin", label: "Home", icon: IconHome },
    { href: "/admin/orders", label: "Orders", icon: IconBag, need: "orders", badge: "orders" },
    { href: "/admin/products", label: "Products", icon: IconTag, need: "products" },
    { href: "/admin/requests", label: "Bookings", icon: IconCal, need: "bookings", badge: "requests" },
    { href: "/admin/customers", label: "Customers", icon: IconUser, need: "customers" },
  ] },
  { group: "Website", items: [
    { href: "/admin/store", label: "Website content", icon: IconStore, need: "content" },
    { href: "/admin/notifications", label: "Notifications", icon: IconBell, need: "notifications" },
  ] },
  { group: "Manager", items: [
    { href: "/admin/team", label: "Team & access", icon: IconTeam, need: "manager" },
    { href: "/admin/activity", label: "Activity", icon: IconPulse, need: "manager" },
  ] },
];

const isOn = (p: string, href: string) => (href === "/admin" ? p === "/admin" : p.startsWith(href));

export function AdminShell({ me, counts, demo, children }: { me: StaffUser; counts: { orders: number; requests: number }; demo: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [pathname]);

  // Products screen also opens for people who can only change prices or stock
  const allowed = (n: NavItem) =>
    !n.need ? true : n.need === "manager" ? me.role === "manager" : n.need === "products" ? can(me, "products") || can(me, "prices") || can(me, "stock") : can(me, n.need);
  const groups = NAV.map((g) => ({ ...g, items: g.items.filter(allowed) })).filter((g) => g.items.length);
  const flat = groups.flatMap((g) => g.items);
  const tabs = flat.slice(0, 4);
  const overflow = flat.slice(4);
  const badge = (k?: string) => (k === "orders" ? counts.orders : k === "requests" ? counts.requests : 0);
  const first = me.name.split(" ")[0] || me.email.split("@")[0];

  return (
    <ToastProvider>
      {/* Desktop sidebar */}
      <aside className="dimples fixed inset-y-0 left-0 z-40 hidden w-64 flex-col overflow-y-auto text-cream lg:flex">
        <div className="px-6 pt-7">
          <img src="/brand/logo-full-white.png" alt="Tecumseh Golf" width={445} height={471} className="w-20" />
          <p className="label mt-3 text-flag">Staff dashboard</p>
        </div>
        <nav className="mt-6 space-y-5 px-3" aria-label="Admin">
          {groups.map((g) => (
            <div key={g.group}>
              <p className="label mb-1.5 px-3.5 !text-[10px] text-cream/45">{g.group}</p>
              <div className="space-y-0.5">
                {g.items.map((n) => {
                  const on = isOn(pathname, n.href), Icon = n.icon, b = badge(n.badge);
                  return (
                    <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={cx("relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14.5px] font-semibold transition-colors", on ? "text-ink" : "text-cream/75 hover:text-cream")}>
                      {on && <motion.span layoutId="admin-nav" className="absolute inset-0 rounded-xl bg-cream" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                      <span className="relative"><Icon size={19} /></span>
                      <span className="relative">{n.label}</span>
                      {b > 0 && <span className="relative ml-auto rounded-full bg-flag px-2 text-[12px] font-bold text-ink">{b}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-auto space-y-3 px-6 pb-6 pt-8 text-[13px]">
          <ViewModeSwitch dark compact />
          <Link href="/admin/me" className="flex items-center gap-2.5 rounded-xl bg-black/20 p-2.5 hover:bg-black/30">
            <span className="grid size-8 place-items-center rounded-full bg-flag text-[13px] font-bold uppercase text-ink">{first.slice(0, 1)}</span>
            <span className="min-w-0">
              <span className="block truncate font-semibold text-cream">{me.name || first}</span>
              <span className="block text-[11.5px] text-cream/60">{me.role === "manager" ? "Manager" : "Staff"} · My account</span>
            </span>
          </Link>
          <div className="flex items-center justify-between">
            <a href="/" target="_blank" rel="noreferrer" className="font-semibold text-cream/80 hover:text-white">View site ↗</a>
            <form action={signOut}><button className="font-semibold text-cream/60 hover:text-white">Sign out</button></form>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-[var(--line)] bg-cream/90 px-4 pb-2.5 pt-[calc(env(safe-area-inset-top)+10px)] backdrop-blur-xl lg:hidden">
        <span className="flex items-center gap-2.5">
          <img src="/brand/mascot.png" alt="" width={340} height={420} className="h-8 w-auto" />
          <span className="label text-green">Staff</span>
        </span>
        <Link href="/admin/me" className="flex items-center gap-2 text-[13px] font-semibold text-muted">
          {me.name || first}
          <span className="grid size-8 place-items-center rounded-full bg-green text-[13px] font-bold uppercase text-cream">{first.slice(0, 1)}</span>
        </Link>
      </header>

      <main className="min-h-dvh px-4 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+32px)] pt-[calc(env(safe-area-inset-top)+76px)] sm:px-6 lg:pb-16 lg:pl-[calc(16rem+3rem)] lg:pr-12 lg:pt-10">
        <div className="mx-auto max-w-5xl">
          {demo && (
            <p className="mb-6 rounded-xl border border-dashed border-clay/50 px-4 py-3 text-[13.5px] font-semibold text-clay">
              Demo mode — showing sample data. Connect Supabase to save changes.
            </p>
          )}
          {children}
        </div>
      </main>

      {/* Mobile tabs: first four screens + More */}
      <nav aria-label="Admin" className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <ul className="grid h-[var(--tabbar-h)]" style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }}>
          {tabs.map((n) => {
            const on = isOn(pathname, n.href), Icon = n.icon, b = badge(n.badge);
            return (
              <li key={n.href} className="relative">
                <Link href={n.href} aria-current={on ? "page" : undefined} className={cx("flex h-full flex-col items-center justify-center gap-1", on ? "text-green" : "text-muted")}>
                  {on && <motion.span layoutId="admin-tab" className="absolute inset-x-4 top-0 h-[3px] rounded-b-full bg-green" />}
                  <span className="relative">
                    <Icon size={22} />
                    {b > 0 && <span className="absolute -right-2.5 -top-1.5 grid min-w-[18px] place-items-center rounded-full bg-flag px-1 text-[10.5px] font-bold text-ink">{b}</span>}
                  </span>
                  <span className="text-[10.5px] font-semibold">{n.label.split(" ")[0]}</span>
                </Link>
              </li>
            );
          })}
          <li className="relative">
            <button onClick={() => setMore(true)} className={cx("flex h-full w-full flex-col items-center justify-center gap-1", overflow.some((n) => isOn(pathname, n.href)) ? "text-green" : "text-muted")}>
              <IconMenu size={22} />
              <span className="text-[10.5px] font-semibold">More</span>
            </button>
          </li>
        </ul>
      </nav>

      <AnimatePresence>
        {more && (
          <div className="fixed inset-0 z-[85] lg:hidden" role="dialog" aria-modal="true" aria-label="More">
            <motion.div className="absolute inset-0 bg-ink/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMore(false)} />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 380, damping: 40 }}
              className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-cream px-4 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-4">
              <div className="flex items-center justify-between">
                <p className="display text-[1.8rem]">Menu</p>
                <button onClick={() => setMore(false)} className="grid size-10 place-items-center rounded-full bg-ink/5" aria-label="Close"><IconX size={20} /></button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {overflow.map((n) => {
                  const Icon = n.icon, on = isOn(pathname, n.href);
                  return (
                    <Link key={n.href} href={n.href} className={cx("card flex items-center gap-3 p-4 font-semibold", on && "border-green text-green")}>
                      <Icon size={20} /> {n.label}
                    </Link>
                  );
                })}
                <Link href="/admin/me" className="card flex items-center gap-3 p-4 font-semibold"><IconKey size={20} /> My account</Link>
                <a href="/" target="_blank" rel="noreferrer" className="card flex items-center gap-3 p-4 font-semibold"><IconStore size={20} /> View site ↗</a>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
                <ViewModeSwitch />
                <form action={signOut}><button className="btn btn-ghost btn-sm">Sign out</button></form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ToastProvider>
  );
}
