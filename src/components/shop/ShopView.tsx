"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useStore } from "@/lib/store";
import { ProductCard } from "./ProductCard";
import { IconSearch, IconX, cx } from "@/components/ui/primitives";

type Sort = "featured" | "newest" | "low" | "high";
const SORTS: { value: Sort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "low", label: "Price: low to high" },
  { value: "high", label: "Price: high to low" },
];

export function ShopView() {
  const { snapshot } = useStore();
  const { products, categories } = snapshot;
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [condition, setCondition] = useState<"all" | "new" | "used">("all");
  const [sort, setSort] = useState<Sort>("featured");
  const [inStock, setInStock] = useState(false);
  const [onSale, setOnSale] = useState(false);
  const [ready, setReady] = useState(false);

  // Read filters from the URL once (keeps pages static), then mirror changes back into it.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQ(p.get("q") ?? "");
    setCat(p.get("cat") ?? "all");
    const c = p.get("condition");
    if (c === "new" || c === "used") setCondition(c);
    const s = p.get("sort") as Sort | null;
    if (s && SORTS.some((x) => x.value === s)) setSort(s);
    setInStock(p.get("stock") === "1");
    setOnSale(p.get("sale") === "1");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (cat !== "all") p.set("cat", cat);
    if (condition !== "all") p.set("condition", condition);
    if (sort !== "featured") p.set("sort", sort);
    if (inStock) p.set("stock", "1");
    if (onSale) p.set("sale", "1");
    const qs = p.toString();
    window.history.replaceState(window.history.state, "", qs ? `/shop?${qs}` : "/shop");
  }, [q, cat, condition, sort, inStock, onSale, ready]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let r = products.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (condition !== "all" && p.condition !== condition) return false;
      if (inStock && p.stock != null && p.stock <= 0) return false;
      if (onSale && !(p.compareAtCents != null && p.compareAtCents > p.priceCents)) return false;
      if (needle && !`${p.name} ${p.brand} ${p.description} ${p.category}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    const soldOutLast = (a: typeof r[number]) => (a.stock != null && a.stock <= 0 ? 1 : 0);
    r = [...r].sort((a, b) => {
      const so = soldOutLast(a) - soldOutLast(b);
      if (so) return so;
      if (sort === "low") return a.priceCents - b.priceCents;
      if (sort === "high") return b.priceCents - a.priceCents;
      if (sort === "newest") return b.createdAt.localeCompare(a.createdAt);
      return Number(b.featured) - Number(a.featured) || b.order - a.order;
    });
    return r;
  }, [products, q, cat, condition, sort, inStock, onSale]);

  const active = cat !== "all" || condition !== "all" || inStock || onSale || q.trim();
  const reset = () => { setQ(""); setCat("all"); setCondition("all"); setInStock(false); setOnSale(false); setSort("featured"); };
  const catLabel = categories.find((c) => c.slug === cat)?.label;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-green">The pro shop</p>
          <h1 className="display display-i mt-2 text-[3.4rem] sm:text-[4.6rem]">{catLabel ?? (condition === "used" ? "Pre-owned" : "Shop all")}</h1>
        </div>
        <p className="text-[14px] text-muted">Order online · <b className="text-ink">pick up in store</b></p>
      </header>

      {/* Filter bar */}
      <div className="sticky top-[var(--header-h)] z-30 -mx-4 mt-6 border-b border-[var(--line)] bg-cream/95 px-4 pb-3 pt-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <label className="relative min-w-0 flex-1 basis-56">
            <span className="sr-only">Search the shop</span>
            <IconSearch size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search drivers, balls, gloves…" className="field !h-11 !rounded-full pl-10 pr-9" type="search" enterKeyHint="search" />
            {q && <button onClick={() => setQ("")} className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-faint hover:text-ink" aria-label="Clear search"><IconX size={15} /></button>}
          </label>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field !h-11 !w-auto !rounded-full text-[14px]" aria-label="Sort">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="rail -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <button className="chip" aria-pressed={cat === "all"} onClick={() => setCat("all")}>All</button>
          {categories.map((c) => (
            <button key={c.slug} className="chip" aria-pressed={cat === c.slug} onClick={() => setCat(cat === c.slug ? "all" : c.slug)}>{c.label}</button>
          ))}
          <span className="mx-1 w-px shrink-0 self-stretch bg-[var(--line-strong)]" aria-hidden />
          <button className="chip" aria-pressed={condition === "used"} onClick={() => setCondition(condition === "used" ? "all" : "used")}>Pre-owned</button>
          <button className="chip" aria-pressed={onSale} onClick={() => setOnSale(!onSale)}>On sale</button>
          <button className="chip" aria-pressed={inStock} onClick={() => setInStock(!inStock)}>In stock</button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[13.5px] text-muted">
        <span aria-live="polite">{list.length} item{list.length === 1 ? "" : "s"}</span>
        {active && <button onClick={reset} className="font-semibold text-green underline-offset-4 hover:underline">Clear filters</button>}
      </div>

      <AnimatePresence mode="popLayout">
        {list.length ? (
          <motion.div key="grid" className="mt-5 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
            {list.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dimples-soft mt-6 rounded-3xl border border-dashed border-[var(--line-strong)] px-6 py-16 text-center">
            <p className="display text-[2rem]">Nothing matches that</p>
            <p className="mx-auto mt-2 max-w-sm text-[14.5px] text-muted">We carry more in store than we list online — give us a call and we'll check the back room.</p>
            <button onClick={reset} className="btn btn-green btn-sm mt-6">Show everything</button>
          </motion.div>
        )}
      </AnimatePresence>
      <p className={cx("sr-only")}>Prices in Canadian dollars. HST added at checkout.</p>
    </div>
  );
}
