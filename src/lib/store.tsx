"use client";
/**
 * Client-side app state for the storefront: the catalogue snapshot, the cart (kept in this
 * browser), the cart drawer, and the signed-in shopper. Pages stay static and fast; the
 * account is picked up in the browser.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartLine, Product, Snapshot } from "./types";
import { browserSupabase } from "./auth/client";

export interface Shopper { id: string; email: string; name: string; phone: string }

interface StoreApi {
  snapshot: Snapshot;
  productById: (id: string) => Product | undefined;
  cart: CartLine[];
  cartCount: number;
  cartSubtotal: number;
  add: (productId: string, option: string | null, qty?: number) => void;
  setQty: (productId: string, option: string | null, qty: number) => void;
  remove: (productId: string, option: string | null) => void;
  clear: () => void;
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
  shopper: Shopper | null;
  shopperReady: boolean;
  accountsEnabled: boolean;
}

const Ctx = createContext<StoreApi | null>(null);
const KEY = "tg-cart-v1";

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore outside StoreProvider");
  return c;
}

const same = (l: CartLine, id: string, opt: string | null) => l.productId === id && (l.option ?? null) === (opt ?? null);

export function StoreProvider({ snapshot, children }: { snapshot: Snapshot; children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [shopper, setShopper] = useState<Shopper | null>(null);
  const [shopperReady, setShopperReady] = useState(false);

  const byId = useMemo(() => new Map(snapshot.products.map((p) => [p.id, p])), [snapshot.products]);
  const productById = useCallback((id: string) => byId.get(id), [byId]);

  // Restore cart (dropping anything no longer sold)
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as CartLine[];
      if (Array.isArray(raw)) setCart(raw.filter((l) => byId.has(l.productId) && l.qty > 0));
    } catch { /* storage unavailable — cart lives in memory */ }
    setLoaded(true);
  }, [byId]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch { /* ignore */ }
  }, [cart, loaded]);

  // Keep tabs in sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      try { setCart(JSON.parse(e.newValue ?? "[]")); } catch { /* ignore */ }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Signed-in shopper
  useEffect(() => {
    const sb = browserSupabase();
    if (!sb) { setShopperReady(true); return; }
    const toShopper = (u: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null | undefined): Shopper | null =>
      u ? { id: u.id, email: u.email ?? "", name: String(u.user_metadata?.name ?? ""), phone: String(u.user_metadata?.phone ?? "") } : null;
    sb.auth.getSession().then(({ data }) => { setShopper(toShopper(data.session?.user)); setShopperReady(true); });
    // No awaits inside this callback (Supabase can deadlock) — same rule as Yard$.
    const { data } = sb.auth.onAuthStateChange((_e, session) => setShopper(toShopper(session?.user)));
    return () => data.subscription.unsubscribe();
  }, []);

  const maxFor = useCallback((id: string) => {
    const p = byId.get(id);
    return p?.stock == null ? 20 : Math.min(20, p.stock);
  }, [byId]);

  const add = useCallback((productId: string, option: string | null, qty = 1) => {
    setCart((c) => {
      const max = maxFor(productId);
      const hit = c.find((l) => same(l, productId, option));
      if (hit) return c.map((l) => (l === hit ? { ...l, qty: Math.min(max, l.qty + qty) } : l));
      return [...c, { productId, option, qty: Math.min(max, qty) }];
    });
  }, [maxFor]);

  const setQty = useCallback((productId: string, option: string | null, qty: number) => {
    setCart((c) => (qty <= 0 ? c.filter((l) => !same(l, productId, option)) : c.map((l) => (same(l, productId, option) ? { ...l, qty: Math.min(maxFor(productId), qty) } : l))));
  }, [maxFor]);

  const remove = useCallback((productId: string, option: string | null) => setCart((c) => c.filter((l) => !same(l, productId, option))), []);
  const clear = useCallback(() => {
    setCart([]);
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  }, []);

  const cartCount = cart.reduce((n, l) => n + l.qty, 0);
  const cartSubtotal = cart.reduce((n, l) => n + (byId.get(l.productId)?.priceCents ?? 0) * l.qty, 0);

  const value: StoreApi = {
    snapshot, productById, cart, cartCount, cartSubtotal, add, setQty, remove, clear, cartOpen, setCartOpen,
    shopper, shopperReady, accountsEnabled: snapshot.source === "supabase",
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
