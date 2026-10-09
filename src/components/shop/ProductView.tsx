"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Product } from "@/lib/types";
import { useStore } from "@/lib/store";
import { ProductCard } from "./ProductCard";
import { Stepper } from "@/components/shell/CartDrawer";
import { IconBack, IconCheck, IconPhone, IconStore, Price, ProductImage, SampleTag, StockBadge, cx } from "@/components/ui/primitives";

export function ProductView({ product: p }: { product: Product }) {
  const { snapshot, add, setCartOpen } = useStore();
  const router = useRouter();
  const s = snapshot.settings;
  const [img, setImg] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [missing, setMissing] = useState(false);

  const cat = snapshot.categories.find((c) => c.slug === p.category);
  const soldOut = p.stock != null && p.stock <= 0;
  const optionLabel = p.options.length ? p.options.map((o) => `${o.name}: ${picks[o.name]}`).join(" · ") : null;
  const complete = p.options.every((o) => picks[o.name]);
  const related = snapshot.products.filter((x) => x.id !== p.id && x.category === p.category).slice(0, 4);
  const tel = s.phone.replace(/[^0-9+]/g, "");

  const addToCart = (go?: "checkout") => {
    if (!complete) { setMissing(true); return; }
    add(p.id, optionLabel, qty);
    if (go) { router.push("/checkout"); return; }
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    setCartOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13px] text-muted">
        <Link href="/shop" className="inline-flex items-center gap-1.5 font-semibold hover:text-ink"><IconBack size={16} /> Shop</Link>
        {cat && <><span>/</span><Link href={`/shop?cat=${cat.slug}`} className="hover:text-ink">{cat.label}</Link></>}
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-sand">
            <AnimatePresence mode="wait">
              <motion.div key={img} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="h-full w-full">
                <ProductImage product={p} index={img} priority sizes="(min-width: 1024px) 55vw, 100vw" />
              </motion.div>
            </AnimatePresence>
            <div className="absolute left-4 top-4 flex gap-2">
              {p.condition === "used" && <span className="label rounded-full bg-ink px-2.5 py-1 !text-[10px] text-cream">Pre-owned</span>}
              {p.isSample && <SampleTag />}
            </div>
          </div>
          {p.images.length > 1 && (
            <div className="rail mt-3 flex gap-2.5 overflow-x-auto">
              {p.images.map((_, i) => (
                <button key={i} onClick={() => setImg(i)} aria-label={`Photo ${i + 1}`} aria-pressed={img === i} className={cx("size-20 shrink-0 overflow-hidden rounded-xl border-2 transition", img === i ? "border-green" : "border-transparent opacity-70 hover:opacity-100")}>
                  <ProductImage product={p} index={i} sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Buy box */}
        <div className="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
          <p className="label text-faint">{[p.brand, cat?.label].filter(Boolean).join(" · ")}</p>
          <h1 className="display mt-2 text-[2.6rem] sm:text-[3.3rem]">{p.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Price product={p} size="lg" />
            <StockBadge product={p} className="!text-[11.5px]" />
          </div>
          <p className="mt-1 text-[12.5px] text-muted">+ HST · CAD</p>

          {p.options.map((o) => (
            <fieldset key={o.name} className="mt-6">
              <legend className={cx("label mb-2.5", missing && !picks[o.name] ? "text-clay" : "text-ink")}>
                {o.name}{picks[o.name] ? <span className="ml-2 normal-case tracking-normal text-muted">— {picks[o.name]}</span> : missing ? " — choose one" : ""}
              </legend>
              <div className="flex flex-wrap gap-2">
                {o.values.map((v) => (
                  <button key={v} type="button" className="chip !h-11 !rounded-xl !px-4" aria-pressed={picks[o.name] === v} onClick={() => { setPicks({ ...picks, [o.name]: v }); setMissing(false); }}>{v}</button>
                ))}
              </div>
            </fieldset>
          ))}

          {!soldOut ? (
            <div className="mt-7 space-y-3">
              <div className="flex items-center gap-3">
                <Stepper value={qty} onChange={setQty} max={p.stock ?? 20} />
                <button onClick={() => addToCart()} className="btn btn-green flex-1">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={added ? "y" : "n"} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} className="inline-flex items-center gap-2">
                      {added ? <><IconCheck size={18} /> Added</> : "Add to cart"}
                    </motion.span>
                  </AnimatePresence>
                </button>
              </div>
              <button onClick={() => addToCart("checkout")} className="btn btn-flag w-full">Reserve for pickup</button>
            </div>
          ) : (
            <div className="mt-7 rounded-2xl border border-dashed border-[var(--line-strong)] p-5">
              <p className="font-semibold">Sold out online</p>
              <p className="mt-1 text-[14px] text-muted">We may have more coming — call and we'll let you know.</p>
              {tel && <a href={`tel:${tel}`} className="btn btn-ghost btn-sm mt-3"><IconPhone size={17} /> {s.phone}</a>}
            </div>
          )}

          <div className="mt-6 flex gap-3.5 rounded-2xl bg-leaf/70 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-green text-cream"><IconStore size={20} /></span>
            <div className="text-[14px]">
              <p className="font-semibold text-green">Free pickup at {s.address}</p>
              <p className="mt-0.5 text-ink/75">{s.pickupNote}</p>
            </div>
          </div>

          {p.description && (
            <div className="mt-8">
              <h2 className="label text-ink">Details</h2>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink/85">{p.description}</p>
            </div>
          )}
          {(p.category === "clubs" || p.category === "putters") && (
            <Link href="/book?service=fitting" className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold text-green underline-offset-4 hover:underline">
              Not sure on specs? Book a fitting first →
            </Link>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <p className="label text-green">You might also like</p>
          <h2 className="display mt-2 text-[2.4rem]">More {cat?.label ?? "gear"}</h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {related.map((r) => <ProductCard key={r.id} product={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
