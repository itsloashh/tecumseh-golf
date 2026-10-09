"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useStore } from "@/lib/store";
import { openState, type OpenState } from "@/lib/hours";
import { cx, IconBag, IconCal, IconHome, IconPin, IconStore, IconUser, IconPhone, IconMail } from "@/components/ui/primitives";
import { CartDrawer } from "./CartDrawer";
import { ViewModeSwitch } from "./ViewMode";
import { LoparoSignature } from "./LoparoSignature";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/services", label: "Fitting & Repairs" },
  { href: "/book", label: "Book" },
  { href: "/visit", label: "Visit" },
];

const TABS = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/shop", label: "Shop", icon: IconStore },
  { href: "/book", label: "Book", icon: IconCal },
  { href: "/account", label: "Account", icon: IconUser },
];

const isActive = (p: string, href: string) => (href === "/" ? p === "/" : p === href || p.startsWith(href + "/"));

/** Open/closed is computed in the browser (shop time zone) so cached pages never show a stale state. */
export function useOpenState(): OpenState | null {
  const { snapshot } = useStore();
  const [s, setS] = useState<OpenState | null>(null);
  useEffect(() => {
    const tick = () => setS(openState(snapshot.settings.hours));
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [snapshot.settings.hours]);
  return s;
}

export function OpenPill({ dark, className }: { dark?: boolean; className?: string }) {
  const s = useOpenState();
  return (
    <span className={cx("inline-flex min-h-6 items-center gap-2 text-[13px]", dark ? "text-cream/90" : "text-muted", className)}>
      {s ? (
        <>
          {s.open ? <span className="live-dot" /> : <span className="size-2 rounded-full bg-faint" />}
          <span className={cx("font-semibold", dark ? "text-cream" : "text-ink")}>{s.label}</span>
          <span>· {s.sub}</span>
        </>
      ) : <span className="opacity-0">Hours</span>}
    </span>
  );
}

function Logo({ dark }: { dark?: boolean }) {
  return (
    <Link href="/" aria-label="Tecumseh Golf — home" className="flex items-center gap-2.5">
      <img src={dark ? "/brand/mascot-white.png" : "/brand/mascot.png"} alt="" width={340} height={420} className="h-10 w-auto" />
      <img src={dark ? "/brand/wordmark-white.png" : "/brand/wordmark.png"} alt="Tecumseh Golf" width={445} height={34} className="h-[12px] w-auto sm:h-[15px]" />
    </Link>
  );
}

function CartButton({ className }: { className?: string }) {
  const { cartCount, setCartOpen } = useStore();
  return (
    <button onClick={() => setCartOpen(true)} className={cx("relative grid size-11 place-items-center rounded-full transition-colors hover:bg-ink/5", className)} aria-label={`Cart, ${cartCount} items`}>
      <IconBag />
      {cartCount > 0 && (
        <motion.span key={cartCount} initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="absolute right-0.5 top-0.5 grid min-w-5 place-items-center rounded-full bg-flag px-1 text-[11px] font-bold text-ink">
          {cartCount}
        </motion.span>
      )}
    </button>
  );
}

function Announcement() {
  const { snapshot } = useStore();
  const s = snapshot.settings;
  if (!s.announcementOn || !s.announcement.trim()) return null;
  const items = Array.from({ length: 6 }, () => s.announcement);
  return (
    <div className="overflow-hidden bg-flag text-ink" role="region" aria-label="Announcement">
      <div className="marquee flex w-max gap-10 whitespace-nowrap py-2 text-[13px] font-semibold">
        {[...items, ...items].map((t, i) => (
          <span key={i} className="flex items-center gap-10">{t}<span aria-hidden>⛳</span></span>
        ))}
      </div>
    </div>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { shopper, cartCount, setCartOpen } = useStore();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    // In phone view the page scrolls inside #frame, so listen to every scroll (capture).
    const on = () => setScrolled(Math.max(window.scrollY, document.getElementById("frame")?.scrollTop ?? 0) > 8);
    on();
    document.addEventListener("scroll", on, { passive: true, capture: true });
    return () => document.removeEventListener("scroll", on, { capture: true });
  }, []);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-full focus:bg-flag focus:px-4 focus:py-2">Skip to content</a>
      <Announcement />
      <header className={cx("sticky top-0 z-40 border-b transition-colors duration-300", scrolled ? "border-[var(--line)] bg-cream/90 backdrop-blur-xl" : "border-transparent bg-cream")}>
        <div className="mx-auto flex h-[var(--header-h)] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => {
              const on = isActive(pathname, n.href);
              return (
                <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={cx("relative rounded-full px-4 py-2 text-[14.5px] font-semibold transition-colors", on ? "text-green" : "text-ink/75 hover:text-ink")}>
                  {on && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-leaf" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                  <span className="relative">{n.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-1">
            <span className="mr-2 hidden xl:block"><OpenPill /></span>
            <Link href="/account" className="hidden h-11 items-center gap-2 rounded-full px-3 text-[14px] font-semibold text-ink/80 hover:bg-ink/5 hover:text-ink lg:flex">
              <IconUser size={20} />
              {shopper ? (shopper.name.split(" ")[0] || "Account") : "Sign in"}
            </Link>
            <CartButton />
          </div>
        </div>
      </header>

      <main id="main" className="min-h-[60vh] pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>

      <Footer />

      {/* Mobile tab bar — the Yard$ / LOASH app feel */}
      <nav aria-label="App" className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <ul className="grid h-[var(--tabbar-h)] grid-cols-5">
          {TABS.map((t) => {
            const on = isActive(pathname, t.href);
            const Icon = t.icon;
            return (
              <li key={t.href} className="relative">
                <Link href={t.href} aria-current={on ? "page" : undefined} className={cx("flex h-full flex-col items-center justify-center gap-1", on ? "text-green" : "text-muted")}>
                  {on && <motion.span layoutId="tab-bar" className="absolute inset-x-4 top-0 h-[3px] rounded-b-full bg-green" />}
                  <Icon size={22} />
                  <span className="text-[10.5px] font-semibold">{t.label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button onClick={() => setCartOpen(true)} className="relative flex h-full w-full flex-col items-center justify-center gap-1 text-muted">
              <span className="relative">
                <IconBag size={22} />
                {cartCount > 0 && <span className="absolute -right-2.5 -top-1.5 grid min-w-[18px] place-items-center rounded-full bg-flag px-1 text-[10.5px] font-bold text-ink">{cartCount}</span>}
              </span>
              <span className="text-[10.5px] font-semibold">Cart</span>
            </button>
          </li>
        </ul>
      </nav>

      <CartDrawer />
    </>
  );
}

function Footer() {
  const { snapshot } = useStore();
  const s = snapshot.settings;
  const year = new Date().getFullYear();
  return (
    <footer className="dimples relative mt-24 text-cream">
      <div className="stripes">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <img src="/brand/logo-full-white.png" alt="Tecumseh Golf" width={445} height={471} className="w-36" />
            <p className="mt-5 max-w-xs text-[14px] text-cream/75">{s.tagline}</p>
          </div>
          <div>
            <p className="label text-flag">Visit</p>
            <address className="mt-3 space-y-2 text-[14.5px] not-italic text-cream/85">
              <a href={s.googleUrl || "/visit"} target="_blank" rel="noreferrer" className="flex gap-2 hover:text-white"><IconPin size={18} className="mt-0.5 shrink-0" />{s.address}<br />{s.city}, {s.province} {s.postal}</a>
              {s.phone && <a href={`tel:${s.phone.replace(/[^0-9+]/g, "")}`} className="flex gap-2 hover:text-white"><IconPhone size={18} />{s.phone}</a>}
              {s.email && <a href={`mailto:${s.email}`} className="flex gap-2 hover:text-white"><IconMail size={18} />{s.email}</a>}
            </address>
            <OpenPill dark className="mt-4" />
          </div>
          <div>
            <p className="label text-flag">Explore</p>
            <ul className="mt-3 space-y-2 text-[14.5px] text-cream/85">
              {[...NAV, { href: "/account", label: "My account" }].map((n) => (
                <li key={n.href}><Link href={n.href} className="hover:text-white">{n.label}</Link></li>
              ))}
              {s.socials.map((x) => <li key={x.href}><a href={x.href} target="_blank" rel="noreferrer" className="hover:text-white">{x.label} ↗</a></li>)}
            </ul>
          </div>
        </div>
        <div className="border-t border-[var(--line-dark)]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-4 px-4 py-5 text-[12.5px] text-cream/55 sm:px-6">
            <span>© {year} {s.name}. Prices in CAD.</span>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
              <ViewModeSwitch dark />
              <Link href="/admin" className="hover:text-cream">Staff login</Link>
              <LoparoSignature />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
