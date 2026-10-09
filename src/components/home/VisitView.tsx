"use client";
import { useStore } from "@/lib/store";
import { HoursTable, MapEmbed } from "./HomeView";
import { OpenPill } from "@/components/shell/SiteShell";
import { IconMail, IconPhone, IconPin, Stars } from "@/components/ui/primitives";

export function VisitView() {
  const { snapshot } = useStore();
  const s = snapshot.settings;
  const tel = s.phone.replace(/[^0-9+]/g, "");
  const directions = s.googleUrl || `https://maps.google.com/?q=${encodeURIComponent(`${s.address} ${s.city} ${s.province}`)}`;
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12">
      <p className="label text-green">Visit</p>
      <h1 className="display display-i mt-2 text-[3.4rem] sm:text-[4.6rem]">Come say hi.</h1>
      <div className="mt-3"><OpenPill /></div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="label text-ink">Hours</h2>
            <HoursTable className="mt-3" />
            {s.hoursNote && <p className="mt-4 text-[13px] text-muted">{s.hoursNote}</p>}
          </div>
          <div className="card divide-y divide-[var(--line)]">
            <a href={directions} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-5 hover:bg-ink/[0.02]">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-leaf text-green"><IconPin /></span>
              <span><b className="block">{s.address}</b><span className="text-[14px] text-muted">{s.city}, {s.province} {s.postal} · Get directions</span></span>
            </a>
            {tel && (
              <a href={`tel:${tel}`} className="flex items-center gap-4 p-5 hover:bg-ink/[0.02]">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-leaf text-green"><IconPhone /></span>
                <span><b className="block">{s.phone}</b><span className="text-[14px] text-muted">Tap to call the shop</span></span>
              </a>
            )}
            {s.email && (
              <a href={`mailto:${s.email}`} className="flex items-center gap-4 p-5 hover:bg-ink/[0.02]">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-leaf text-green"><IconMail /></span>
                <span><b className="block break-all">{s.email}</b><span className="text-[14px] text-muted">We reply within a day</span></span>
              </a>
            )}
          </div>
          {s.googleRating && (
            <a href={s.googleUrl || "#"} target="_blank" rel="noreferrer" className="dimples flex items-center justify-between gap-4 rounded-[14px] p-5 text-cream">
              <span>
                <span className="label text-flag">On Google</span>
                <span className="display mt-1 block text-[2.6rem] leading-none">{s.googleRating.toFixed(1)} <Stars rating={s.googleRating} className="align-middle text-cream" /></span>
              </span>
              {s.googleReviews ? <span className="text-right text-[14px] text-cream/80">{s.googleReviews} reviews<br /><u>Read them</u></span> : null}
            </a>
          )}
        </div>
        <div className="min-h-[420px] overflow-hidden rounded-[14px] border border-[var(--line)] bg-sand"><MapEmbed /></div>
      </div>

      {s.about.length > 0 && (
        <section className="mt-16 max-w-3xl">
          <p className="label text-green">About the shop</p>
          <div className="mt-3 space-y-4 text-[17px] leading-relaxed text-ink/85">{s.about.map((p, i) => <p key={i}>{p}</p>)}</div>
        </section>
      )}
    </div>
  );
}
