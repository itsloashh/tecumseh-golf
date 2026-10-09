"use client";
/**
 * Auto · Phone · Desktop view switch (site footer + staff dashboard).
 * - Phone on a big screen: the whole app renders in a phone-width frame with the mobile layout.
 * - Desktop on a phone: the browser lays the page out at 1280px, like "Request desktop site".
 * The choice is remembered on this device and applied before first paint (see VIEW_BOOT_SCRIPT).
 */
import { useEffect, useState } from "react";
import { cx } from "@/components/ui/primitives";

export type ViewMode = "auto" | "phone" | "desktop";
const KEY = "tg-view";
const DEVICE_VIEWPORT = "width=device-width, initial-scale=1, viewport-fit=cover";

export function applyViewMode(mode: ViewMode) {
  const root = document.documentElement;
  if (mode === "auto") root.removeAttribute("data-view");
  else root.setAttribute("data-view", mode);
  const meta = document.querySelector('meta[name="viewport"]');
  meta?.setAttribute("content", mode === "desktop" ? "width=1280" : DEVICE_VIEWPORT);
}

export function useViewMode(): [ViewMode, (m: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>("auto");
  useEffect(() => {
    try {
      const m = localStorage.getItem(KEY);
      if (m === "phone" || m === "desktop") setMode(m);
    } catch { /* storage blocked */ }
  }, []);
  const set = (m: ViewMode) => {
    setMode(m);
    try { if (m === "auto") localStorage.removeItem(KEY); else localStorage.setItem(KEY, m); } catch { /* ignore */ }
    applyViewMode(m);
    window.dispatchEvent(new CustomEvent("tg-view", { detail: m }));
  };
  // keep several switches on the page in sync
  useEffect(() => {
    const on = (e: Event) => setMode((e as CustomEvent<ViewMode>).detail);
    window.addEventListener("tg-view", on);
    return () => window.removeEventListener("tg-view", on);
  }, []);
  return [mode, set];
}

const OPTIONS: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
  { value: "auto", label: "Auto", icon: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0v18" /> },
  { value: "phone", label: "Phone", icon: <><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" /></> },
  { value: "desktop", label: "Desktop", icon: <><rect x="3" y="4" width="18" height="12" rx="1.5" /><path d="M9 20h6M12 16v4" /></> },
];

export function ViewModeSwitch({ dark, showLabel = true, compact, className }: { dark?: boolean; showLabel?: boolean; compact?: boolean; className?: string }) {
  const [mode, set] = useViewMode();
  return (
    <div className={cx("inline-flex items-center gap-2", className)}>
      {showLabel && <span className={cx("text-[12px]", dark ? "text-cream/55" : "text-muted")}>View</span>}
      <div role="radiogroup" aria-label="View mode" className={cx("inline-flex rounded-full p-0.5", dark ? "bg-black/25" : "bg-ink/[0.06]")}>
        {OPTIONS.map((o) => {
          const on = mode === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={compact ? `${o.label} view` : undefined}
              title={o.value === "auto" ? "Fit this screen" : `${o.label} layout`}
              onClick={() => set(o.value)}
              className={cx(
                "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-semibold transition-colors",
                on ? (dark ? "bg-cream text-ink" : "bg-ink text-cream") : dark ? "text-cream/65 hover:text-cream" : "text-muted hover:text-ink",
              )}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{o.icon}</svg>
              {compact ? <span className="sr-only">{o.label}</span> : o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Runs at the very top of <body>, before anything paints: applies the saved view mode and
 * decides whether this visit gets the logo intro (once per browser tab session, never on /admin).
 */
export const VIEW_BOOT_SCRIPT = `(function(){try{var d=document.documentElement,m=localStorage.getItem('${KEY}');
if(m==='phone'||m==='desktop')d.setAttribute('data-view',m);
if(m==='desktop'){var v=document.querySelector('meta[name="viewport"]');if(v)v.setAttribute('content','width=1280');}
if(location.pathname.indexOf('/admin')===0)return;
if(sessionStorage.getItem('tg-intro'))d.classList.add('no-intro');else sessionStorage.setItem('tg-intro','1');}catch(e){}})();`;
