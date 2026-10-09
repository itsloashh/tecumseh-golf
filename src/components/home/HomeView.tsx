"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { useStore } from "@/lib/store";
import { DAYS, fmtDay, shopNow, weekRows } from "@/lib/hours";
import { ProductCard } from "@/components/shop/ProductCard";
import { OpenPill } from "@/components/shell/SiteShell";
import { IconArrow, IconCal, IconPhone, IconPin, SectionHead, Stars, cx } from "@/components/ui/primitives";
import { ProductArt } from "@/components/ui/ProductArt";
import { useEffect, useState } from "react";

const rise = { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-60px" }, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } };

export function HomeView() {
  const { snapshot } = useStore();
  const { settings: s, products, services, categories } = snapshot;
  const featured = [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)].slice(0, 8);
  const used = products.filter((p) => p.condition === "used" && (p.stock == null || p.stock > 0));
  const bookable = services.filter((v) => v.bookable);
  const show = s.homeSections;
  const tel = s.phone.replace(/[^0-9+]/g, "");

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="dimples relative overflow-hidden text-cream">
        <div className="stripes absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-4 pb-14 pt-10 sm:px-6 md:grid-cols-[1.15fr_0.85fr] md:pb-20 md:pt-16">
          <div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="rounded-full bg-black/25 px-3 py-1.5"><OpenPill dark /></span>
              {s.googleRating && (
                <a href={s.googleUrl || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 text-[13px] text-cream/90 hover:text-white">
                  <Stars rating={s.googleRating} className="text-cream" />
                  <b className="font-semibold text-cream">{s.googleRating.toFixed(1)}</b>
                  {s.googleReviews ? <span>· {s.googleReviews} Google reviews</span> : null}
                </a>
              )}
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="display display-i mt-6 text-[3.6rem] leading-[0.86] sm:text-[5rem] lg:text-[6.4rem]"
            >
              {highlightLast(s.heroTitle)}
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="mt-5 max-w-xl text-[16.5px] leading-relaxed text-cream/80">
              {s.heroSub}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="mt-8 flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-flag">Shop the pro shop <IconArrow size={18} /></Link>
              <Link href="/book?service=fitting" className="btn btn-ghost-dark">Book a fitting</Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94, rotate: -2 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto hidden w-full max-w-[420px] md:block"
          >
            <div className="absolute inset-[8%] rounded-full bg-flag" />
            <div className="absolute inset-[8%] rounded-full border-[10px] border-cream/15 [transform:translate(10px,10px)]" />
            <img src="/brand/mascot.png" alt="The Tecumseh Golf mascot" width={340} height={420} className="relative mx-auto w-[72%] drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)]" />
            <YardageMarker className="absolute -left-2 bottom-6" />
          </motion.div>
        </div>
      </section>

      {/* ── Quick tiles ─────────────────────────────────────── */}
      <section className="relative z-10 mx-auto -mt-6 max-w-7xl px-4 sm:px-6">
        <div className="rail -mx-4 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0">
          {[
            { href: "/shop", k: "Pro shop", t: "Clubs, balls & gear", cat: "clubs" },
            { href: "/book?service=fitting", k: "Dial it in", t: "Club fitting", cat: "putters" },
            { href: "/book?service=lessons", k: "Get better", t: "Golf lessons", cat: "balls" },
            { href: "/book?service=repairs", k: "Like new", t: "Repairs & regrips", cat: "gloves" },
          ].map((x, i) => (
            <Link key={x.href} href={x.href} className="card group relative flex min-w-[72%] snap-start items-center gap-3 overflow-hidden p-3 shadow-[0_10px_30px_-18px_rgba(13,59,36,0.45)] transition-transform hover:-translate-y-0.5 sm:min-w-0">
              <div className="size-16 shrink-0 overflow-hidden rounded-xl"><ProductArt category={x.cat} seed={`tile-${i}`} /></div>
              <div className="min-w-0">
                <p className="label !text-[10px] text-green">{x.k}</p>
                <p className="display mt-1 text-[1.35rem] leading-none">{x.t}</p>
              </div>
              <IconArrow size={18} className="ml-auto shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-green" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Featured ───────────────────────────────────────── */}
      {show.featured && <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <motion.div {...rise}>
          <SectionHead kicker="In the shop now" title="Fresh on the rack" action={<Link href="/shop" className="btn btn-ghost btn-sm">Shop all <IconArrow size={16} /></Link>} />
        </motion.div>
        <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {featured.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
        </div>
      </section>}

      {/* ── Categories ─────────────────────────────────────── */}
      {show.categories && <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <motion.div {...rise}><SectionHead kicker="Browse" title="Shop by category" /></motion.div>
        <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {categories.map((c) => {
            const n = products.filter((p) => p.category === c.slug).length;
            return (
              <Link key={c.slug} href={`/shop?cat=${c.slug}`} className="group text-center">
                <div className="aspect-square overflow-hidden rounded-2xl transition-transform group-hover:-translate-y-1"><ProductArt category={c.slug} seed={`cat-${c.slug}`} /></div>
                <p className="mt-2 text-[14px] font-semibold">{c.label}</p>
                <p className="text-[12px] text-faint">{n} item{n === 1 ? "" : "s"}</p>
              </Link>
            );
          })}
        </div>
      </section>}

      {/* ── Workshop ───────────────────────────────────────── */}
      {show.workshop && bookable.length > 0 && (
        <section id="workshop" className="mt-20 bg-fairway text-cream">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
            <motion.div {...rise}>
              <SectionHead dark kicker="The workshop" title={<>Regrip. Re-shaft.<br /><span className="text-flag">Dial it in.</span></>} />
              <p className="mt-5 max-w-md text-[16px] leading-relaxed text-cream/80">Book a fitting or a lesson, or drop your clubs off for new grips and shafts. Tell us what you need and we'll call to set a time.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/book" className="btn btn-flag"><IconCal size={18} /> Request a time</Link>
                {tel && <a href={`tel:${tel}`} className="btn btn-ghost-dark"><IconPhone size={18} /> Call the shop</a>}
              </div>
            </motion.div>
            <motion.div {...rise}><WorkshopCard /></motion.div>
          </div>
        </section>
      )}

      {/* ── Pre-owned ──────────────────────────────────────── */}
      {show.preowned && used.length > 0 && (
        <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
          <div className="dimples-soft overflow-hidden rounded-3xl border border-[var(--line)] bg-sand/60 p-6 sm:p-10">
            <SectionHead kicker="One of a kind" title="Pre-owned clubs" action={<Link href="/shop?condition=used" className="btn btn-ghost btn-sm">See all used <IconArrow size={16} /></Link>} />
            <p className="mt-3 max-w-lg text-[14.5px] text-muted">Checked over by the shop and priced to play. When they're gone, they're gone.</p>
            <div className="mt-7 grid grid-cols-2 gap-4 md:grid-cols-4">
              {used.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Visit ──────────────────────────────────────────── */}
      {show.visit && <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <motion.div {...rise} className="card p-6 sm:p-8">
            <p className="label text-green">Come see us</p>
            <h2 className="display mt-2 text-[2.6rem]">{s.address}</h2>
            <p className="mt-1 text-[15px] text-muted">{s.city}, {s.province} {s.postal}</p>
            <HoursTable className="mt-6" />
            {s.hoursNote && <p className="mt-4 text-[13px] text-muted">{s.hoursNote}</p>}
            <div className="mt-6 flex flex-wrap gap-2.5">
              <a href={s.googleUrl || `https://maps.google.com/?q=${encodeURIComponent(`${s.address} ${s.city}`)}`} target="_blank" rel="noreferrer" className="btn btn-green btn-sm"><IconPin size={17} /> Directions</a>
              {tel && <a href={`tel:${tel}`} className="btn btn-ghost btn-sm"><IconPhone size={17} /> {s.phone}</a>}
            </div>
          </motion.div>
          <motion.div {...rise} className="min-h-[320px] overflow-hidden rounded-[14px] border border-[var(--line)] bg-sand">
            <MapEmbed />
          </motion.div>
        </div>
      </section>}
    </>
  );
}

/** Puts the last word of the headline in flag yellow. */
function highlightLast(t: string) {
  const words = t.trim().split(" ");
  if (words.length < 2) return t;
  const last = words.pop();
  return <>{words.join(" ")} <span className="text-flag">{last}</span></>;
}

function YardageMarker({ className }: { className?: string }) {
  return (
    <div className={cx("rotate-[-6deg] rounded-xl border-4 border-cream bg-clay px-4 py-2 text-center text-cream shadow-xl", className)}>
      <p className="label !text-[9.5px] text-cream/80">To the shop</p>
      <p className="display text-[2.2rem] leading-none">150</p>
    </div>
  );
}

/** Scorecard-style list of bookable services and their prices. */
export function WorkshopCard() {
  const { snapshot } = useStore();
  const rows = snapshot.services.filter((v) => v.bookable);
  return (
    <div className="overflow-hidden rounded-2xl bg-paper text-ink shadow-2xl shadow-black/30">
      <div className="flex items-center justify-between bg-green px-5 py-3 text-cream">
        <span className="label !text-[11px]">Workshop card</span>
        <span className="label !text-[11px] text-flag">Book online</span>
      </div>
      <ul>
        {rows.map((r, i) => (
          <li key={r.id} className="border-b border-dashed border-[var(--line-strong)] last:border-0">
            <Link href={`/book?service=${r.slug}`} className="group flex items-center gap-4 px-5 py-4 hover:bg-leaf/50">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-green font-mono text-[13px] font-semibold text-green">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="display block text-[1.45rem] leading-none">{r.title}</span>
                {r.details[0] && <span className="mt-1 block truncate text-[12.5px] text-muted">{r.details[0]}</span>}
              </span>
              {r.priceLabel ? <span className="price shrink-0 text-[1.2rem]">{r.priceLabel}</span> : <span className="shrink-0 text-[12.5px] text-faint">Ask for pricing</span>}
              <IconArrow size={16} className="shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-green" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HoursTable({ className }: { className?: string }) {
  const { snapshot } = useStore();
  const [today, setToday] = useState<number | null>(null);
  useEffect(() => setToday(shopNow().day), []);
  return (
    <dl className={cx("divide-y divide-[var(--line)] border-y border-[var(--line)]", className)}>
      {weekRows(snapshot.settings.hours).map((r) => (
        <div key={r.day} className={cx("flex items-center justify-between px-1 py-2.5 text-[14.5px]", today === r.day && "-mx-2 rounded-lg bg-leaf px-3 font-semibold text-green")}>
          <dt>{DAYS[r.day]}{today === r.day && <span className="label ml-2 !text-[9.5px]">Today</span>}</dt>
          <dd className="tabular">{fmtDay(r.hours)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function MapEmbed() {
  const { snapshot } = useStore();
  const s = snapshot.settings;
  const q = encodeURIComponent(`Tecumseh Golf Centre, ${s.address}, ${s.city}, ${s.province} ${s.postal}`);
  return (
    <iframe
      title="Map to Tecumseh Golf"
      src={`https://maps.google.com/maps?q=${q}&z=15&output=embed`}
      className="h-full min-h-[320px] w-full border-0 grayscale-[30%]"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
