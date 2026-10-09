"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { NotificationSettings } from "@/lib/types";
import type { TeamMember } from "@/lib/admin/queries";
import { saveNotifications, sendTestAlert } from "@/app/admin/actions";
import { Field, PageHead, Section, TextInput, Toggle, useAction } from "./kit";
import { IconX } from "@/components/ui/primitives";

export function NotificationsEditor({ settings, team, emailReady, envFallback }: { settings: NotificationSettings; team: TeamMember[]; emailReady: boolean; envFallback: string }) {
  const router = useRouter();
  const { run, busy } = useAction();
  const [n, setN] = useState(settings);
  const [add, setAdd] = useState("");
  const dirty = JSON.stringify(n) !== JSON.stringify(settings);
  const up = <K extends keyof NotificationSettings>(k: K, v: NotificationSettings[K]) => setN((x) => ({ ...x, [k]: v }));
  const addEmail = (e: string) => {
    const v = e.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(v) || n.recipients.includes(v)) return;
    up("recipients", [...n.recipients, v]);
    setAdd("");
  };
  const suggestions = team.filter((t) => t.active && !n.recipients.includes(t.email));

  return (
    <>
      <PageHead kicker="Website" title="Notifications" sub="Choose which emails go out, and who on the team gets the shop alerts." />

      {!emailReady && (
        <p className="mt-6 rounded-xl border border-dashed border-clay/50 px-4 py-3 text-[13.5px] text-clay">
          Email isn't connected yet, so nothing is sent. Add <b>RESEND_API_KEY</b> and <b>NOTIFY_FROM</b> in Vercel to switch it on — these settings are kept and start working right away.
        </p>
      )}

      <Section title="Who gets shop alerts">
        <div className="card p-4">
          {n.recipients.length ? (
            <ul className="flex flex-wrap gap-2">
              {n.recipients.map((e) => (
                <li key={e} className="inline-flex items-center gap-1.5 rounded-full bg-leaf py-1.5 pl-3.5 pr-1.5 text-[14px] font-semibold text-green">
                  {e}
                  <button onClick={() => up("recipients", n.recipients.filter((x) => x !== e))} className="grid size-6 place-items-center rounded-full hover:bg-green/15" aria-label={`Remove ${e}`}><IconX size={13} /></button>
                </li>
              ))}
            </ul>
          ) : <p className="text-[14px] text-muted">{envFallback ? <>No one added yet — alerts go to <b>{envFallback}</b> (from Vercel settings).</> : "No one yet — add at least one email below."}</p>}
          <div className="mt-3 flex gap-2">
            <TextInput type="email" value={add} onChange={(e) => setAdd(e.target.value)} placeholder="name@example.com" onKeyDown={(e) => e.key === "Enter" && addEmail(add)} />
            <button onClick={() => addEmail(add)} className="btn btn-ghost btn-sm !h-12 shrink-0">Add</button>
          </div>
          {suggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px]">
              <span className="text-muted">Team:</span>
              {suggestions.map((t) => <button key={t.id} onClick={() => addEmail(t.email)} className="chip !h-8 text-[13px]">+ {t.name || t.email}</button>)}
            </div>
          )}
        </div>
      </Section>

      <Section title="Alerts to the shop">
        <div className="space-y-2.5">
          <Toggle checked={n.newOrder} onChange={(v) => up("newOrder", v)} label="New online order" sub="Order details, customer contact, pay-at-pickup or paid" />
          <Toggle checked={n.newBooking} onChange={(v) => up("newBooking", v)} label="New booking request" sub="Fittings, lessons and repairs" />
          <Toggle checked={n.lowStock} onChange={(v) => up("lowStock", v)} label="Low stock" sub="When an order leaves a product running low or sold out" />
          {n.lowStock && (
            <Field label="Alert when stock drops to" hint="also used for the “Low stock” list">
              <TextInput inputMode="numeric" value={String(n.lowStockAt)} onChange={(e) => up("lowStockAt", Number(e.target.value.replace(/\D/g, "")) || 0)} className="!w-28" />
            </Field>
          )}
        </div>
      </Section>

      <Section title="Emails to customers">
        <div className="space-y-2.5">
          <Toggle checked={n.customerReceipt} onChange={(v) => up("customerReceipt", v)} label="Order confirmation" sub="Sent right after they order, with a link to track it" />
          <Toggle checked={n.customerReady} onChange={(v) => up("customerReady", v)} label="Ready for pickup" sub="Sent when staff tap “Ready for pickup”" />
        </div>
      </Section>

      <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
        <button onClick={async () => { const r = await run(sendTestAlert()); if (r) alert("Test sent — check the inbox (and spam)."); }} disabled={busy || dirty || !emailReady} className="btn btn-ghost" title={dirty ? "Save first" : undefined}>Send a test alert</button>
        <button onClick={async () => { if (await run(saveNotifications(n), "Notification settings saved")) router.refresh(); }} disabled={busy || !dirty} className={dirty ? "btn btn-flag" : "btn btn-ghost"}>{busy ? "Saving…" : dirty ? "Save changes" : "All saved"}</button>
      </div>
    </>
  );
}
