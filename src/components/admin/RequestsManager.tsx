"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RequestStatus, ServiceRequest } from "@/lib/types";
import { deleteRequest, updateRequest } from "@/app/admin/actions";
import { ConfirmButton, PageHead, Pill, Sheet, TextArea, ago, useAction } from "./kit";
import { IconMail, IconPhone, cx } from "@/components/ui/primitives";

const FLOW: { id: RequestStatus; label: string }[] = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "scheduled", label: "Scheduled" },
  { id: "completed", label: "Done" },
  { id: "cancelled", label: "Cancelled" },
];

export function RequestsManager({ requests }: { requests: ServiceRequest[] }) {
  const [tab, setTab] = useState<RequestStatus | "open">("open");
  const [openId, setOpenId] = useState<string | null>(null);
  const list = requests.filter((r) => (tab === "open" ? ["new", "contacted", "scheduled"].includes(r.status) : r.status === tab));
  const open = requests.find((r) => r.id === openId) ?? null;

  return (
    <>
      <PageHead kicker="Fittings · lessons · repairs" title="Bookings" sub="Requests from the website. Call or email to lock in a time, then move them along." />
      <div className="rail mt-6 flex gap-2 overflow-x-auto">
        <button className="chip shrink-0" aria-pressed={tab === "open"} onClick={() => setTab("open")}>Open <span className="opacity-60">{requests.filter((r) => ["new", "contacted", "scheduled"].includes(r.status)).length}</span></button>
        {FLOW.map((f) => <button key={f.id} className="chip shrink-0" aria-pressed={tab === f.id} onClick={() => setTab(f.id)}>{f.label} <span className="opacity-60">{requests.filter((r) => r.status === f.id).length}</span></button>)}
      </div>
      <ul className="mt-5 space-y-2.5">
        {list.map((r) => (
          <li key={r.id}>
            <button onClick={() => setOpenId(r.id)} className={cx("card flex w-full items-center gap-4 p-4 text-left hover:border-[var(--line-strong)]", r.status === "new" && "border-l-4 border-l-clay")}>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold">{r.name}<Pill tone={r.status === "new" ? "clay" : r.status === "scheduled" ? "green" : "muted"}>{FLOW.find((f) => f.id === r.status)?.label}</Pill></p>
                <p className="mt-0.5 truncate text-[13.5px] text-muted">{r.serviceTitle}{r.preferredDate ? ` · ${r.preferredDate}` : ""}{r.preferredTime ? ` · ${r.preferredTime}` : ""}</p>
              </div>
              <span className="shrink-0 text-[12px] text-muted">{ago(r.createdAt)}</span>
            </button>
          </li>
        ))}
        {!list.length && <li className="card p-8 text-center text-[14px] text-muted">No requests here.</li>}
      </ul>
      {open && <RequestSheet key={open.id} r={open} onClose={() => setOpenId(null)} />}
    </>
  );
}

function RequestSheet({ r, onClose }: { r: ServiceRequest; onClose: () => void }) {
  const router = useRouter();
  const { run, busy } = useAction();
  const [notes, setNotes] = useState(r.internalNotes);
  const tel = r.phone?.replace(/[^0-9+]/g, "");
  const set = async (patch: Parameters<typeof updateRequest>[1], msg: string) => { if (await run(updateRequest(r.id, patch), msg)) router.refresh(); };

  return (
    <Sheet open onClose={onClose} title={r.serviceTitle}
      footer={<div className="flex items-center gap-2"><ConfirmButton busy={busy} onConfirm={async () => { if (await run(deleteRequest(r.id), "Deleted")) { onClose(); router.refresh(); } }} /><button onClick={onClose} className="btn btn-ghost ml-auto">Close</button></div>}>
      <div className="card p-4">
        <p className="text-[16px] font-semibold">{r.name}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {tel && <a href={`tel:${tel}`} className="btn btn-flag btn-sm"><IconPhone size={16} /> {r.phone}</a>}
          <a href={`mailto:${r.email}?subject=${encodeURIComponent(`Your ${r.serviceTitle.toLowerCase()} at Tecumseh Golf`)}`} className="btn btn-ghost btn-sm"><IconMail size={16} /> Email</a>
        </div>
        <p className="mt-2 break-all text-[13px] text-muted">{r.email}</p>
      </div>
      <dl className="card mt-4 divide-y divide-[var(--line)] text-[14px]">
        <div className="flex justify-between p-3.5"><dt className="text-muted">Preferred day</dt><dd className="font-semibold">{r.preferredDate ?? "Flexible"}</dd></div>
        <div className="flex justify-between p-3.5"><dt className="text-muted">Time of day</dt><dd className="font-semibold">{r.preferredTime ?? "Any"}</dd></div>
        <div className="flex justify-between p-3.5"><dt className="text-muted">Sent</dt><dd>{new Date(r.createdAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Toronto" })}</dd></div>
      </dl>
      {r.details && <p className="mt-4 whitespace-pre-line rounded-xl bg-paper p-4 text-[14.5px] leading-relaxed">{r.details}</p>}

      <p className="label mb-2 mt-6 text-ink">Status</p>
      <div className="flex flex-wrap gap-2">
        {FLOW.map((f) => <button key={f.id} disabled={busy} className="chip" aria-pressed={r.status === f.id} onClick={() => set({ status: f.id }, `Marked ${f.label.toLowerCase()}`)}>{f.label}</button>)}
      </div>

      <div className="mt-6">
        <span className="mb-1.5 block text-[13.5px] font-semibold">Staff notes</span>
        <TextArea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Booked Thu 4pm with Dave…" />
        {notes !== r.internalNotes && <button disabled={busy} onClick={() => set({ internalNotes: notes }, "Notes saved")} className="btn btn-green btn-sm mt-2">Save notes</button>}
      </div>
    </Sheet>
  );
}
