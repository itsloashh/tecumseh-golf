import type { ReactNode, SVGProps } from "react";
import type { Product } from "@/lib/types";
import { money } from "@/lib/money";
import { src, srcSet } from "@/lib/images";
import { ProductArt } from "./ProductArt";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export function SampleTag({ className }: { className?: string }) {
  return (
    <span title="Sample listing — replace in the admin" className={cx("label inline-flex items-center rounded-full border border-dashed border-clay/60 bg-paper/90 px-2 py-0.5 !text-[9.5px] text-clay", className)}>
      Sample
    </span>
  );
}

export function Price({ product, className, size = "md" }: { product: Pick<Product, "priceCents" | "compareAtCents">; className?: string; size?: "md" | "lg" }) {
  const sale = product.compareAtCents != null && product.compareAtCents > product.priceCents;
  return (
    <span className={cx("inline-flex items-baseline gap-2", className)}>
      <span className={cx("price", size === "lg" ? "text-[2rem]" : "text-[1.15rem]", sale && "text-clay")}>{money(product.priceCents)}</span>
      {sale && <s className={cx("text-faint tabular", size === "lg" ? "text-[1.05rem]" : "text-[13px]")}>{money(product.compareAtCents!)}</s>}
    </span>
  );
}

export function stockInfo(p: Pick<Product, "stock">): { label: string; tone: "ok" | "low" | "out" } {
  if (p.stock == null) return { label: "Available", tone: "ok" };
  if (p.stock <= 0) return { label: "Sold out", tone: "out" };
  if (p.stock <= 3) return { label: p.stock === 1 ? "Only 1 left" : `Only ${p.stock} left`, tone: "low" };
  return { label: "In stock", tone: "ok" };
}

export function StockBadge({ product, className }: { product: Pick<Product, "stock">; className?: string }) {
  const s = stockInfo(product);
  return (
    <span className={cx("label inline-flex items-center gap-1.5 !text-[10.5px]", s.tone === "out" ? "text-faint" : s.tone === "low" ? "text-clay" : "text-green", className)}>
      <span className={cx("size-1.5 rounded-full", s.tone === "out" ? "bg-faint" : s.tone === "low" ? "bg-clay" : "bg-green")} />
      {s.label}
    </span>
  );
}

/** Product photo (three WebP renditions) or the category illustration when there's no photo yet. */
export function ProductImage({ product, sizes = "(min-width: 1024px) 25vw, 50vw", priority, className, index = 0 }: { product: Product; sizes?: string; priority?: boolean; className?: string; index?: number }) {
  const img = product.images[index];
  if (!img) return <ProductArt category={product.category} seed={product.slug} className={className} />;
  return (
    <img
      src={src(img, 828)}
      srcSet={srcSet(img)}
      sizes={sizes}
      alt={product.name}
      width={img.width}
      height={img.height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      style={img.blur ? { backgroundImage: `url(${img.blur})`, backgroundSize: "cover" } : undefined}
      className={cx("h-full w-full object-cover", className)}
    />
  );
}

export function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={cx("inline-flex gap-0.5", className)} aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const f = Math.max(0, Math.min(1, rating - i));
        return (
          <svg key={i} width="14" height="14" viewBox="0 0 20 20" aria-hidden>
            <defs><linearGradient id={`st${i}-${f}`}><stop offset={f} stopColor="var(--color-flag)" /><stop offset={f} stopColor="currentColor" stopOpacity="0.25" /></linearGradient></defs>
            <path d="M10 1.5l2.6 5.5 6 .8-4.4 4.1 1.1 5.9L10 15l-5.3 2.8 1.1-5.9L1.4 7.8l6-.8z" fill={`url(#st${i}-${f})`} />
          </svg>
        );
      })}
    </span>
  );
}

export function SectionHead({ kicker, title, action, dark, className }: { kicker: string; title: ReactNode; action?: ReactNode; dark?: boolean; className?: string }) {
  return (
    <div className={cx("flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        <p className={cx("label", dark ? "text-flag" : "text-green")}>{kicker}</p>
        <h2 className={cx("display mt-2 text-[2.4rem] sm:text-[3.2rem]", dark ? "text-cream" : "text-ink")}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

/* ── Icons (1.6 stroke, 24 grid) ── */
type IP = SVGProps<SVGSVGElement> & { size?: number };
const Svg = ({ size = 22, children, ...p }: IP & { children: ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...p}>{children}</svg>
);
export const IconBag = (p: IP) => <Svg {...p}><path d="M5 8h14l-1.2 12H6.2z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></Svg>;
export const IconUser = (p: IP) => <Svg {...p}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" /></Svg>;
export const IconHome = (p: IP) => <Svg {...p}><path d="M4 10.5 12 4l8 6.5V20H4z" /><path d="M10 20v-5h4v5" /></Svg>;
export const IconFlag = (p: IP) => <Svg {...p}><path d="M6 21V3.5" /><path d="M6 4h11l-3 3.5 3 3.5H6" /></Svg>;
export const IconStore = (p: IP) => <Svg {...p}><path d="M4 9.5 5.5 4h13L20 9.5" /><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0" /><path d="M5.5 12.5V20h13v-7.5" /></Svg>;
export const IconCal = (p: IP) => <Svg {...p}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></Svg>;
export const IconPin = (p: IP) => <Svg {...p}><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></Svg>;
export const IconPhone = (p: IP) => <Svg {...p}><path d="M5 4h3.5l1.5 4-2 1.5a10 10 0 0 0 6.5 6.5l1.5-2 4 1.5V19a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z" /></Svg>;
export const IconMail = (p: IP) => <Svg {...p}><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></Svg>;
export const IconClock = (p: IP) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>;
export const IconSearch = (p: IP) => <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></Svg>;
export const IconX = (p: IP) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const IconPlus = (p: IP) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const IconMinus = (p: IP) => <Svg {...p}><path d="M5 12h14" /></Svg>;
export const IconArrow = (p: IP) => <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
export const IconBack = (p: IP) => <Svg {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>;
export const IconCheck = (p: IP) => <Svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Svg>;
export const IconMenu = (p: IP) => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>;
