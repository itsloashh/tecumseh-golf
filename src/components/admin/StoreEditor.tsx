"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DayHours, StoreSettings } from "@/lib/types";
import type { AdminService } from "@/lib/admin/queries";
import { deleteService, saveService, saveSettings, type ServiceInput } from "@/app/admin/actions";
import { DAYS } from "@/lib/hours";
import { ConfirmButton, Field, PageHead, Pill, Section, Sheet, TextArea, TextInput, Toggle, useAction } from "./kit";
import { IconPlus, IconX, cx } from "@/components/ui/primitives";

export function StoreEditor({ settings, services, stripeReady }: { settings: StoreSettings; services: AdminService[]; stripeReady: boolean }) {
  const router = useRouter();
  const { run, busy } = useAction();
  const [s, setS] = useState(settings);
  const [taxPct, setTaxPct] = useState(String(Math.round(settings.taxRate * 10000) / 100));
  const [rating, setRating] = useState(settings.googleRating?.toString() ?? "");
  const [reviews, setReviews] = useState(settings.googleReviews?.toString() ?? "");
  const [svc, setSvc] = useState<AdminService | "new" | null>(null);
  const dirty = JSON.stringify(s) !== JSON.stringify(settings) || taxPct !== String(Math.round(settings.taxRate * 10000) / 100) || rating !== (settings.googleRating?.toString() ?? "") || reviews !== (settings.googleReviews?.toString() ?? "");

  const up = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => setS((x) => ({ ...x, [k]: v }));
  const setDay = (day: number, patch: Partial<DayHours>) => up("hours", s.hours.map((h) => (h.day === day ? { ...h, ...patch } : h)));

  const save = async () => {
    const r = await run(saveSettings({
      ...s, taxRate: (Number(taxPct) || 0) / 100,
      googleRating: rating ? Math.min(5, Math.max(0, Number(rating))) : null,
      googleReviews: reviews ? Math.round(Number(reviews)) : null,
    }), "Saved — live on the site");
    if (r) router.refresh();
  };

  return (
    <>
      <PageHead kicker="Settings" title="Store" sub="Everything here shows on the public site." />

      <Section title="Homepage">
        <div className="space-y-4">
          <Toggle checked={s.announcementOn} onChange={(v) => up("announcementOn", v)} label="Announcement bar" sub="The yellow scrolling strip across the top" />
          {s.announcementOn && <Field label="Announcement"><TextInput value={s.announcement} onChange={(e) => up("announcement", e.target.value)} placeholder="Boxing Day sale — 20% off all bags" /></Field>}
          <Field label="Headline" hint="last word turns yellow"><TextInput value={s.heroTitle} onChange={(e) => up("heroTitle", e.target.value)} /></Field>
          <Field label="Intro"><TextArea value={s.heroSub} onChange={(e) => up("heroSub", e.target.value)} className="!min-h-20" /></Field>
        </div>
      </Section>

      <Section title="Hours" action={!s.hoursConfirmed && <Pill tone="clay">Not confirmed</Pill>}>
        <ul className="card divide-y divide-[var(--line)]">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const h = s.hours.find((x) => x.day === d)!;
            return (
              <li key={d} className="flex flex-wrap items-center gap-3 p-3">
                <span className="w-24 font-semibold">{DAYS[d]}</span>
                <button type="button" className="chip !h-9" aria-pressed={h.closed} onClick={() => setDay(d, { closed: !h.closed })}>Closed</button>
                {!h.closed && (
                  <span className="flex items-center gap-2">
                    <input type="time" value={h.open} onChange={(e) => setDay(d, { open: e.target.value })} className="field !h-10 !w-32" aria-label={`${DAYS[d]} opens`} />
                    <span className="text-muted">to</span>
                    <input type="time" value={h.close} onChange={(e) => setDay(d, { close: e.target.value })} className="field !h-10 !w-32" aria-label={`${DAYS[d]} closes`} />
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <div className="mt-3 space-y-3">
          <Field label="Note under the hours"><TextInput value={s.hoursNote} onChange={(e) => up("hoursNote", e.target.value)} placeholder="Range closes 30 min before the shop" /></Field>
          <Toggle checked={s.hoursConfirmed} onChange={(v) => up("hoursConfirmed", v)} label="These hours are correct" sub="Ticks it off the launch checklist" />
        </div>
      </Section>

      <Section title="Range prices">
        <div className="space-y-2">
          {s.rangePrices.map((r, i) => (
            <div key={i} className="card grid grid-cols-[1fr_1fr_6.5rem_auto] gap-2 p-2.5 max-sm:grid-cols-2">
              <TextInput className="!h-10" value={r.label} placeholder="Large bucket" onChange={(e) => up("rangePrices", s.rangePrices.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} />
              <TextInput className="!h-10" value={r.detail} placeholder="~100 balls" onChange={(e) => up("rangePrices", s.rangePrices.map((x, k) => (k === i ? { ...x, detail: e.target.value } : x)))} />
              <TextInput className="!h-10" value={r.price} placeholder="$15" onChange={(e) => up("rangePrices", s.rangePrices.map((x, k) => (k === i ? { ...x, price: e.target.value } : x)))} />
              <button type="button" onClick={() => up("rangePrices", s.rangePrices.filter((_, k) => k !== i))} className="grid size-10 place-items-center rounded-xl text-muted hover:text-clay" aria-label="Remove row"><IconX size={16} /></button>
            </div>
          ))}
          <button type="button" onClick={() => up("rangePrices", [...s.rangePrices, { label: "", detail: "", price: "" }])} className="btn btn-ghost btn-sm"><IconPlus size={16} /> Add row</button>
          <Field label="Range note"><TextInput value={s.rangeNote} onChange={(e) => up("rangeNote", e.target.value)} /></Field>
        </div>
      </Section>

      <Section title="Services" action={<button onClick={() => setSvc("new")} className="text-[13px] font-semibold text-green">+ Add service</button>}>
        <ul className="card divide-y divide-[var(--line)]">
          {services.map((v) => (
            <li key={v.id}>
              <button onClick={() => setSvc(v)} className={cx("flex w-full items-center gap-3 p-3.5 text-left hover:bg-ink/[0.02]", !v.published && "opacity-60")}>
                <span className="flex-1 font-semibold">{v.title}</span>
                <span className="text-[13px] text-muted">{v.priceLabel || "No price set"}</span>
                {v.bookable ? <Pill tone="green">Bookable</Pill> : <Pill>Walk-in</Pill>}
              </button>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Contact & location">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Street address" className="sm:col-span-2"><TextInput value={s.address} onChange={(e) => up("address", e.target.value)} /></Field>
          <Field label="City"><TextInput value={s.city} onChange={(e) => up("city", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Province"><TextInput value={s.province} onChange={(e) => up("province", e.target.value)} /></Field>
            <Field label="Postal code"><TextInput value={s.postal} onChange={(e) => up("postal", e.target.value)} /></Field>
          </div>
          <Field label="Phone"><TextInput type="tel" value={s.phone} onChange={(e) => up("phone", e.target.value)} /></Field>
          <Field label="Email"><TextInput type="email" value={s.email} onChange={(e) => up("email", e.target.value)} /></Field>
          <Field label="Google Maps link" className="sm:col-span-2"><TextInput value={s.googleUrl} onChange={(e) => up("googleUrl", e.target.value)} /></Field>
          <Field label="Google rating"><TextInput inputMode="decimal" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="4.5" /></Field>
          <Field label="Google review count"><TextInput inputMode="numeric" value={reviews} onChange={(e) => setReviews(e.target.value.replace(/\D/g, ""))} placeholder="161" /></Field>
        </div>
        <div className="mt-4">
          <span className="mb-1.5 block text-[13.5px] font-semibold">Social links</span>
          <div className="space-y-2">
            {s.socials.map((x, i) => (
              <div key={i} className="flex gap-2">
                <TextInput className="!w-32 shrink-0" value={x.label} placeholder="Instagram" onChange={(e) => up("socials", s.socials.map((y, k) => (k === i ? { ...y, label: e.target.value } : y)))} />
                <TextInput value={x.href} placeholder="https://instagram.com/…" onChange={(e) => up("socials", s.socials.map((y, k) => (k === i ? { ...y, href: e.target.value } : y)))} />
                <button type="button" onClick={() => up("socials", s.socials.filter((_, k) => k !== i))} className="grid size-12 shrink-0 place-items-center text-muted" aria-label="Remove"><IconX size={16} /></button>
              </div>
            ))}
            <button type="button" onClick={() => up("socials", [...s.socials, { label: "", href: "" }])} className="btn btn-ghost btn-sm"><IconPlus size={16} /> Add link</button>
          </div>
        </div>
      </Section>

      <Section title="About the shop">
        <div className="space-y-2">
          {s.about.map((p, i) => (
            <div key={i} className="flex gap-2">
              <TextArea className="!min-h-24" value={p} onChange={(e) => up("about", s.about.map((x, k) => (k === i ? e.target.value : x)))} />
              <button type="button" onClick={() => up("about", s.about.filter((_, k) => k !== i))} className="grid size-10 shrink-0 place-items-center text-muted" aria-label="Remove paragraph"><IconX size={16} /></button>
            </div>
          ))}
          <button type="button" onClick={() => up("about", [...s.about, ""])} className="btn btn-ghost btn-sm"><IconPlus size={16} /> Add paragraph</button>
        </div>
      </Section>

      <Section title="Checkout">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            <Field label="Sales tax %"><TextInput inputMode="decimal" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} /></Field>
            <Field label="Pickup message"><TextInput value={s.pickupNote} onChange={(e) => up("pickupNote", e.target.value)} /></Field>
          </div>
          <Toggle checked={s.onlinePayments} onChange={(v) => up("onlinePayments", v)} label="Take card payments online" sub={stripeReady ? "Stripe is connected" : "Needs STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET in Vercel first"} />
          {s.onlinePayments && !stripeReady && <p className="text-[13px] text-clay">Shoppers will only see “Pay at pickup” until Stripe keys are added.</p>}
        </div>
      </Section>

      <div className="sticky bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+12px)] z-30 mt-10 flex justify-end lg:bottom-6">
        <button onClick={save} disabled={busy || !dirty} className={cx("btn shadow-xl", dirty ? "btn-flag" : "btn-ghost bg-cream")}>{busy ? "Saving…" : dirty ? "Save changes" : "All saved"}</button>
      </div>

      {svc && <ServiceSheet key={svc === "new" ? "new" : svc.id} service={svc === "new" ? null : svc} nextOrder={(services[services.length - 1]?.order ?? 1) - 1} onClose={() => setSvc(null)} onSaved={() => { setSvc(null); router.refresh(); }} />}
    </>
  );
}

function ServiceSheet({ service, nextOrder, onClose, onSaved }: { service: AdminService | null; nextOrder: number; onClose: () => void; onSaved: () => void }) {
  const { run, busy } = useAction();
  const [f, setF] = useState<ServiceInput>({
    id: service?.id, title: service?.title ?? "", summary: service?.summary ?? "", details: service?.details ?? [],
    priceLabel: service?.priceLabel ?? "", bookable: service?.bookable ?? true, published: service?.published ?? true, order: service?.order ?? nextOrder,
  });
  const [details, setDetails] = useState((service?.details ?? []).join("\n"));
  const save = async () => { if (await run(saveService({ ...f, details: details.split("\n") }), "Service saved")) onSaved(); };
  return (
    <Sheet open onClose={onClose} title={service ? "Edit service" : "New service"}
      footer={<div className="flex gap-2">{service && <ConfirmButton busy={busy} onConfirm={async () => { if (await run(deleteService(service.id), "Service deleted")) onSaved(); }} />}<button onClick={save} disabled={busy} className="btn btn-green ml-auto">{busy ? "Saving…" : "Save"}</button></div>}>
      <div className="space-y-4">
        <Field label="Title"><TextInput value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Price" hint="shown as typed"><TextInput value={f.priceLabel} onChange={(e) => setF({ ...f, priceLabel: e.target.value })} placeholder="From $60 · $8/grip · Free with purchase" /></Field>
        <Field label="Summary"><TextArea value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} className="!min-h-20" /></Field>
        <Field label="Bullet points" hint="one per line"><TextArea value={details} onChange={(e) => setDetails(e.target.value)} /></Field>
        <Toggle checked={f.bookable} onChange={(v) => setF({ ...f, bookable: v })} label="Bookable online" sub="Shows a “Request a time” button and appears on /book" />
        <Toggle checked={f.published} onChange={(v) => setF({ ...f, published: v })} label="Show on the site" />
      </div>
    </Sheet>
  );
}
