"use client";
import { useMemo, useState } from "react";
import type { ActivityEntry } from "@/lib/admin/queries";
import { PageHead } from "./kit";

const day = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { weekday: "long", month: "short", day: "numeric", timeZone: "America/Toronto" });
const time = (iso: string) => new Date(iso).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" });

export function ActivityLog({ entries }: { entries: ActivityEntry[] }) {
  const people = useMemo(() => [...new Map(entries.map((e) => [e.actorEmail, e.actorName || e.actorEmail.split("@")[0]])).entries()], [entries]);
  const [who, setWho] = useState("all");
  const [kind, setKind] = useState("all");
  const KINDS: Record<string, (e: ActivityEntry) => boolean> = {
    all: () => true,
    prices: (e) => /price|sale/i.test(`${e.action} ${e.detail}`),
    stock: (e) => /stock/i.test(`${e.action} ${e.detail}`),
    orders: (e) => /^order/i.test(e.action),
    team: (e) => /team|password|updated .*@|added .* to/i.test(e.action),
  };
  const list = entries.filter((e) => (who === "all" || e.actorEmail === who) && KINDS[kind](e));
  const grouped = list.reduce<Record<string, ActivityEntry[]>>((acc, e) => { (acc[day(e.at)] ??= []).push(e); return acc; }, {});

  return (
    <>
      <PageHead kicker="Manager" title="Activity" sub="Every change made in the dashboard — who, what and when." />
      <div className="mt-6 flex flex-wrap gap-2">
        <select value={who} onChange={(e) => setWho(e.target.value)} className="field !h-10 !w-auto !rounded-full text-[14px]">
          <option value="all">Everyone</option>
          {people.map(([email, name]) => <option key={email} value={email}>{name}</option>)}
        </select>
        {Object.keys(KINDS).map((k) => <button key={k} className="chip !h-10" aria-pressed={kind === k} onClick={() => setKind(k)}>{{ all: "All", prices: "Prices", stock: "Stock", orders: "Orders", team: "Team" }[k]}</button>)}
      </div>
      {Object.entries(grouped).map(([d, items]) => (
        <section key={d} className="mt-7">
          <h2 className="label mb-2 text-ink">{d}</h2>
          <ul className="card divide-y divide-[var(--line)]">
            {items.map((e) => (
              <li key={e.id} className="flex gap-3 p-3.5 text-[14px]">
                <span className="w-16 shrink-0 pt-px text-[12.5px] tabular text-faint">{time(e.at)}</span>
                <span className="min-w-0 flex-1">
                  <b>{e.actorName || e.actorEmail.split("@")[0]}</b> <span>{e.action.charAt(0).toLowerCase() + e.action.slice(1)}</span>
                  {e.detail && <span className="block text-[12.5px] text-muted">{e.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {!list.length && <p className="card mt-6 p-8 text-center text-[14px] text-muted">Nothing recorded yet.</p>}
    </>
  );
}
