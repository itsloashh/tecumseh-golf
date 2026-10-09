"use client";
import Link from "next/link";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useStore } from "@/lib/store";
import { money } from "@/lib/money";
import { IconBag, IconMinus, IconPlus, IconX, ProductImage } from "@/components/ui/primitives";

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, productById, setQty, remove, cartSubtotal } = useStore();

  useEffect(() => {
    if (!cartOpen) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", k);
    const html = document.documentElement, prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); html.style.overflow = prev; };
  }, [cartOpen, setCartOpen]);

  return (
    <AnimatePresence>
      {cartOpen && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Your cart">
          <motion.div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCartOpen(false)} />
          <motion.aside
            className="absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-3xl bg-cream sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[440px] sm:rounded-none"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
          >
            <header className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
              <h2 className="display text-[1.9rem]">Your cart</h2>
              <button onClick={() => setCartOpen(false)} className="grid size-10 place-items-center rounded-full bg-ink/5 hover:bg-ink/10" aria-label="Close cart"><IconX size={20} /></button>
            </header>

            {cart.length === 0 ? (
              <div className="grid flex-1 place-items-center px-6 py-16 text-center">
                <div>
                  <div className="mx-auto grid size-16 place-items-center rounded-full bg-leaf text-green"><IconBag size={28} /></div>
                  <p className="display mt-4 text-[1.6rem]">Nothing in the bag yet</p>
                  <p className="mt-1 text-[14px] text-muted">Find something for your next round.</p>
                  <Link href="/shop" onClick={() => setCartOpen(false)} className="btn btn-green mt-6">Browse the shop</Link>
                </div>
              </div>
            ) : (
              <>
                <ul className="min-h-0 flex-1 divide-y divide-[var(--line)] overflow-y-auto overscroll-contain px-5">
                  {cart.map((l) => {
                    const p = productById(l.productId);
                    if (!p) return null;
                    return (
                      <li key={`${l.productId}-${l.option}`} className="flex gap-3.5 py-4">
                        <Link href={`/shop/${p.slug}`} onClick={() => setCartOpen(false)} className="size-20 shrink-0 overflow-hidden rounded-xl">
                          <ProductImage product={p} sizes="80px" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[14.5px] font-semibold leading-snug">{p.name}</p>
                            <button onClick={() => remove(l.productId, l.option)} className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-faint hover:text-ink" aria-label={`Remove ${p.name}`}><IconX size={16} /></button>
                          </div>
                          {l.option && <p className="text-[12.5px] text-muted">{l.option}</p>}
                          <div className="mt-2 flex items-center justify-between">
                            <Stepper value={l.qty} max={p.stock ?? 20} onChange={(q) => setQty(l.productId, l.option, q)} />
                            <span className="price text-[1.05rem]">{money(p.priceCents * l.qty)}</span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <footer className="border-t border-[var(--line)] bg-paper px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[14px] text-muted">Subtotal</span>
                    <span className="price text-[1.5rem]">{money(cartSubtotal)}</span>
                  </div>
                  <p className="mt-0.5 text-[12.5px] text-muted">HST calculated at checkout · Free in-store pickup</p>
                  <Link href="/checkout" onClick={() => setCartOpen(false)} className="btn btn-flag mt-4 w-full">Checkout</Link>
                </footer>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Stepper({ value, onChange, max = 20, min = 1 }: { value: number; onChange: (v: number) => void; max?: number; min?: number }) {
  return (
    <div className="inline-flex h-9 items-center rounded-full border-[1.5px] border-[var(--line-strong)]">
      <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min && min > 0} className="grid size-9 place-items-center disabled:opacity-30" aria-label="Decrease quantity"><IconMinus size={16} /></button>
      <span className="w-6 text-center text-[14px] font-semibold tabular" aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max} className="grid size-9 place-items-center disabled:opacity-30" aria-label="Increase quantity"><IconPlus size={16} /></button>
    </div>
  );
}
