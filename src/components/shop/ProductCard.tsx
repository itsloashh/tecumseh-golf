"use client";
import Link from "next/link";
import { motion } from "motion/react";
import type { Product } from "@/lib/types";
import { useStore } from "@/lib/store";
import { IconPlus, Price, ProductImage, SampleTag, StockBadge, cx } from "@/components/ui/primitives";

export function ProductCard({ product: p, priority, className }: { product: Product; priority?: boolean; className?: string }) {
  const { add, setCartOpen, snapshot } = useStore();
  const cat = snapshot.categories.find((c) => c.slug === p.category);
  const sale = p.compareAtCents != null && p.compareAtCents > p.priceCents;
  const soldOut = p.stock != null && p.stock <= 0;
  const quickAdd = !soldOut && p.options.length === 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cx("group", className)}
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-sand">
        <Link href={`/shop/${p.slug}`} tabIndex={-1} aria-hidden className="block h-full w-full">
          <div className={cx("h-full w-full transition-transform duration-500 ease-[var(--ease-swing)] group-hover:scale-[1.04]", soldOut && "opacity-60 grayscale")}>
            <ProductImage product={p} priority={priority} />
          </div>
        </Link>
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {sale && <span className="label rounded-full bg-clay px-2 py-1 !text-[9.5px] text-white">Sale</span>}
          {p.condition === "used" && <span className="label rounded-full bg-ink px-2 py-1 !text-[9.5px] text-cream">Pre-owned</span>}
          {p.isSample && <SampleTag />}
        </div>
        {quickAdd && (
          <button
            onClick={() => { add(p.id, null); setCartOpen(true); }}
            className="absolute bottom-2.5 right-2.5 grid size-10 place-items-center rounded-full bg-paper text-ink shadow-md shadow-ink/15 transition-all hover:bg-flag active:scale-90 lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus-visible:translate-y-0 lg:focus-visible:opacity-100"
            aria-label={`Add ${p.name} to cart`}
          >
            <IconPlus size={18} />
          </button>
        )}
      </div>
      <Link href={`/shop/${p.slug}`} className="mt-3 block px-0.5">
        <p className="label truncate !text-[10px] text-faint">{[p.brand, cat?.label].filter(Boolean).join(" · ")}</p>
        <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug text-ink group-hover:text-green">{p.name}</h3>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <Price product={p} />
          <StockBadge product={p} />
        </div>
      </Link>
    </motion.article>
  );
}
