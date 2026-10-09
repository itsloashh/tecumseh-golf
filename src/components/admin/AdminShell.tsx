"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cx, IconBag, IconCal, IconHome, IconStore, IconUser } from "@/components/ui/primitives";
import { ToastProvider } from "./kit";
import { signOut } from "@/app/admin/actions";

const IconTag = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3.5 12.5V4h8.5l8.5 8.5-8.5 8.5z" /><circle cx="8" cy="8.5" r="1.5" /></svg>
);

const NAV = [
  { href: "/admin", label: "Home", icon: IconHome, badge: null },
  { href: "/admin/orders", label: "Orders", icon: IconBag, badge: "orders" },
  { href: "/admin/products", label: "Products", icon: IconTag, badge: null },
  { href: "/admin/requests", label: "Bookings", icon: IconCal, badge: "requests" },
  { href: "/admin/customers", label: "Customers", icon: IconUser, badge: null },
  { href: "/admin/store", label: "Store", icon: IconStore, badge: null },
] as const;

/** Phones get the five most-used screens in the tab bar; Customers lives on Home. */
const TABS = NAV.filter((n) => n.href !== "/admin/customers");

const isOn = (p: string, href: string) => (href === "/admin" ? p === "/admin" : p.startsWith(href));

export function AdminShell({ email, counts, demo, children }: { email: string; counts: { orders: number; requests: number }; demo: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const badge = (k: string | null) => (k === "orders" ? counts.orders : k === "requests" ? counts.requests : 0);
  return (
    <ToastProvider>
      <aside className="dimples fixed inset-y-0 left-0 z-40 hidden w-64 flex-col text-cream lg:flex">
        <div className="px-6 pt-7">
          <img src="/brand/logo-full-white.png" alt="Tecumseh Golf" width={445} height={471} className="w-24" />
          <p className="label mt-3 text-flag">Staff dashboard</p>
        </div>
        <nav className="mt-8 space-y-0.5 px-3" aria-label="Admin">
          {NAV.map((n) => {
            const on = isOn(pathname, n.href), Icon = n.icon, b = badge(n.badge);
            return (
              <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={cx("relative flex items-center gap-3 rounded-xl px-3.5 py-3 text-[15px] font-semibold transition-colors", on ? "text-ink" : "text-cream/75 hover:text-cream")}>
                {on && <motion.span layoutId="admin-nav" className="absolute inset-0 rounded-xl bg-cream" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                <span className="relative"><Icon size={20} /></span>
                <span className="relative">{n.label}</span>
                {b > 0 && <span className="relative ml-auto rounded-full bg-flag px-2 text-[12px] font-bold text-ink">{b}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-2 px-6 pb-6 text-[13px]">
          <a href="/" target="_blank" rel="noreferrer" className="block font-semibold text-cream/85 hover:text-white">View live site ↗</a>
          <p className="truncate text-cream/55">{email}</p>
          <form action={signOut}><button className="font-semibold text-cream/70 hover:text-white">Sign out</button></form>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-[var(--line)] bg-cream/90 px-4 pb-2.5 pt-[calc(env(safe-area-inset-top)+10px)] backdrop-blur-xl lg:hidden">
        <span className="flex items-center gap-2.5">
          <img src="/brand/mascot.png" alt="" width={340} height={420} className="h-8 w-auto" />
          <span className="label text-green">Staff</span>
        </span>
        <span className="flex items-center gap-4 text-[13px] font-semibold">
          <Link href="/admin/customers" className="text-muted">Customers</Link>
          <a href="/" target="_blank" rel="noreferrer" className="text-muted">Site ↗</a>
          <form action={signOut}><button className="text-muted">Sign out</button></form>
        </span>
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

      <nav aria-label="Admin" className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <ul className="grid h-[var(--tabbar-h)] grid-cols-5">
          {TABS.map((n) => {
            const on = isOn(pathname, n.href), Icon = n.icon, b = badge(n.badge);
            return (
              <li key={n.href} className="relative">
                <Link href={n.href} aria-current={on ? "page" : undefined} className={cx("flex h-full flex-col items-center justify-center gap-1", on ? "text-green" : "text-muted")}>
                  {on && <motion.span layoutId="admin-tab" className="absolute inset-x-4 top-0 h-[3px] rounded-b-full bg-green" />}
                  <span className="relative">
                    <Icon size={22} />
                    {b > 0 && <span className="absolute -right-2.5 -top-1.5 grid min-w-[18px] place-items-center rounded-full bg-flag px-1 text-[10.5px] font-bold text-ink">{b}</span>}
                  </span>
                  <span className="text-[10.5px] font-semibold">{n.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </ToastProvider>
  );
}
