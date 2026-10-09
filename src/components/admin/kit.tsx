"use client";
/** Form + feedback kit for the admin — same building blocks as LOASH Admin, in Tecumseh colours. */
import { createContext, useCallback, useContext, useEffect, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cx, IconX } from "@/components/ui/primitives";

/* ── Toasts ── */
type Toast = { id: number; text: string; tone: "ok" | "error" };
const ToastCtx = createContext<(text: string, tone?: "ok" | "error") => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, tone: "ok" | "error" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "error" ? 6000 : 2600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+12px)] z-[90] flex flex-col items-center gap-2 px-4 lg:bottom-6">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} role={t.tone === "error" ? "alert" : "status"}
              className={cx("pointer-events-auto max-w-md rounded-full px-5 py-3 text-[14px] font-semibold shadow-xl", t.tone === "error" ? "bg-clay text-white" : "bg-ink text-cream")}>
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/** Wraps a server action call with a toast on success / failure. */
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = useCallback(async <T,>(p: Promise<{ ok: true; data?: T } | { ok: false; error: string }>, okText?: string) => {
    setBusy(true);
    try {
      const r = await p;
      if (!r.ok) { toast(r.error, "error"); return null; }
      if (okText) toast(okText);
      return (r.data ?? true) as T | true;
    } catch (e) {
      toast(e instanceof Error ? e.message : "Something went wrong.", "error");
      return null;
    } finally { setBusy(false); }
  }, [toast]);
  return { run, busy };
}

/* ── Fields ── */
export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      <span className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[13.5px] font-semibold">{label}</span>
        {hint && <span className="text-[12px] text-faint">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
export const TextInput = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx("field", p.className)} />;
export const TextArea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...p} className={cx("field", p.className)} />;

export function Select({ value, onChange, options, className }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={cx("field", className)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Toggle({ checked, onChange, label, sub }: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-xl border-[1.5px] border-[var(--line)] bg-white px-4 py-3 text-left hover:border-[var(--line-strong)]">
      <span>
        <span className="block text-[14.5px] font-semibold">{label}</span>
        {sub && <span className="block text-[12.5px] text-muted">{sub}</span>}
      </span>
      <span className={cx("relative h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "bg-green" : "bg-ink/15")}>
        <span className={cx("absolute top-1 size-5 rounded-full bg-white shadow transition-all duration-300", checked ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}

/* ── Sheet: full screen on phones, side panel on desktop ── */
export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    const html = document.documentElement, prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); html.style.overflow = prev; };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="absolute inset-0 flex flex-col bg-cream lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[600px] lg:shadow-2xl"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 360, damping: 40 }}>
            <header className="flex shrink-0 items-center justify-between border-b border-[var(--line)] px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] lg:px-6">
              <h2 className="display text-[1.9rem]">{title}</h2>
              <button onClick={onClose} className="grid size-10 place-items-center rounded-full bg-ink/5 hover:bg-ink/10" aria-label="Close"><IconX size={20} /></button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 lg:px-6">{children}</div>
            {footer && <footer className="shrink-0 border-t border-[var(--line)] bg-paper px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 lg:px-6">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/** Two-tap delete: avoids accidental taps without a browser confirm() dialog. */
export function ConfirmButton({ onConfirm, children = "Delete", busy, className }: { onConfirm: () => void; children?: ReactNode; busy?: boolean; className?: string }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3500);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button type="button" disabled={busy} onClick={() => (armed ? onConfirm() : setArmed(true))}
      className={cx("btn btn-sm border-[1.5px]", armed ? "border-clay bg-clay text-white" : "border-[var(--line-strong)] text-muted hover:border-clay hover:text-clay", className)}>
      {armed ? "Tap again to confirm" : children}
    </button>
  );
}

export function PageHead({ kicker, title, action, sub }: { kicker: string; title: string; action?: ReactNode; sub?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="label text-green">{kicker}</p>
        <h1 className="display mt-2 text-[2.8rem] sm:text-[3.4rem]">{title}</h1>
        {sub && <div className="mt-1 text-[14px] text-muted">{sub}</div>}
      </div>
      {action}
    </header>
  );
}

export function Section({ title, children, action, className }: { title: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <section className={cx("mt-10", className)}>
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-[var(--line)] pb-2">
        <h2 className="label text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Pill({ children, tone = "muted" }: { children: ReactNode; tone?: "green" | "flag" | "clay" | "muted" | "ink" }) {
  const t = { green: "bg-leaf text-green", flag: "bg-flag/40 text-ink", clay: "bg-clay/15 text-clay", muted: "bg-ink/5 text-muted", ink: "bg-ink text-cream" }[tone];
  return <span className={cx("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-semibold", t)}>{children}</span>;
}

export const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d < 14 ? `${d}d ago` : new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });
};
