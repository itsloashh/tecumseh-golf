"use client";
import { useMemo, useState } from "react";
import type { AdminCustomer } from "@/lib/admin/queries";
import { money } from "@/lib/money";
import { PageHead, Pill, ago } from "./kit";
import { IconMail, IconPhone } from "@/components/ui/primitives";

export function CustomersList({ customers }: { customers: AdminCustomer[] }) {
  const [q, setQ] = useState("");
  const [optIn, setOptIn] = useState(false);
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return customers.filter((c) => (!optIn || c.marketing) && (!n || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(n)));
  }, [customers, q, optIn]);

  const copyEmails = () => {
    navigator.clipboard?.writeText(list.filter((c) => c.marketing).map((c) => c.email).join(", "));
  };

  return (
    <>
      <PageHead kicker="Shopper accounts" title="Customers" sub={`${customers.length} accounts · ${customers.filter((c) => c.marketing).length} opted in to emails`}
        action={<button onClick={copyEmails} className="btn btn-ghost btn-sm">Copy opted-in emails</button>} />
      <div className="mt-6 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone" className="field !rounded-full flex-1" type="search" />
        <button className="chip !h-12" aria-pressed={optIn} onClick={() => setOptIn(!optIn)}>Email opt-ins</button>
      </div>
      <ul className="mt-5 space-y-2.5">
        {list.map((c) => (
          <li key={c.id} className="card flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-semibold">{c.name || "No name yet"}{c.marketing && <Pill tone="green">Emails OK</Pill>}</p>
              <p className="truncate text-[13px] text-muted">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p>
              <p className="text-[12.5px] text-faint">Joined {ago(c.createdAt)}{c.lastOrder ? ` · last order ${ago(c.lastOrder)}` : ""}</p>
            </div>
            <div className="text-right">
              <p className="price">{money(c.spentCents)}</p>
              <p className="text-[12px] text-muted">{c.orders} order{c.orders === 1 ? "" : "s"}</p>
            </div>
            <div className="flex gap-1.5">
              {c.phone && <a href={`tel:${c.phone.replace(/[^0-9+]/g, "")}`} className="grid size-10 place-items-center rounded-full border-[1.5px] border-[var(--line-strong)]" aria-label={`Call ${c.name}`}><IconPhone size={17} /></a>}
              <a href={`mailto:${c.email}`} className="grid size-10 place-items-center rounded-full border-[1.5px] border-[var(--line-strong)]" aria-label={`Email ${c.name}`}><IconMail size={17} /></a>
            </div>
          </li>
        ))}
        {!list.length && <li className="card p-8 text-center text-[14px] text-muted">No customer accounts yet. They appear here as shoppers sign up.</li>}
      </ul>
    </>
  );
}
