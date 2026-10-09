"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PERMISSIONS, type StaffUser } from "@/lib/admin/permissions";
import { updateMe, signOut } from "@/app/admin/actions";
import { ViewModeSwitch } from "@/components/shell/ViewMode";
import { Field, PageHead, Pill, Section, TextInput, useAction } from "./kit";
import { IconCheck, cx } from "@/components/ui/primitives";

export function MyAccount({ me }: { me: StaffUser }) {
  const router = useRouter();
  const { run, busy } = useAction();
  const [name, setName] = useState(me.name);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const mismatch = pw && pw2 && pw !== pw2;

  const save = async () => {
    if (pw && pw !== pw2) return;
    if (await run(updateMe({ name, password: pw || undefined }), pw ? "Saved — new password is active" : "Saved")) {
      setPw(""); setPw2(""); router.refresh();
    }
  };

  return (
    <>
      <PageHead kicker="My account" title={me.name || me.email.split("@")[0]} sub={<span className="flex flex-wrap items-center gap-2">{me.email} <Pill tone={me.role === "manager" ? "green" : "muted"}>{me.role === "manager" ? "Manager" : "Employee"}</Pill></span>} />

      <Section title="Details">
        <div className="card space-y-4 p-5">
          <Field label="Your name" hint="shown on the activity log"><TextInput value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="New password" hint="leave blank to keep it"><TextInput type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></Field>
          {pw && <Field label="Type it again"><TextInput type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></Field>}
          {mismatch && <p className="text-[13px] text-clay">Passwords don't match.</p>}
          <button onClick={save} disabled={busy || !!mismatch || (!!pw && pw !== pw2) || (name === me.name && !pw)} className="btn btn-green">{busy ? "Saving…" : "Save"}</button>
        </div>
      </Section>

      <Section title="Screen layout">
        <div className="card p-5">
          <ViewModeSwitch />
          <p className="mt-3 text-[13.5px] text-muted"><b>Auto</b> fits whatever you're on. <b>Phone</b> uses the app-style layout even on a computer. <b>Desktop</b> shows the full layout on a phone or tablet. Saved on this device.</p>
        </div>
      </Section>

      <Section title="Your access">
        <ul className="card divide-y divide-[var(--line)]">
          {PERMISSIONS.map((p) => {
            const on = me.role === "manager" || me.permissions.includes(p.key);
            return (
              <li key={p.key} className={cx("flex items-center gap-3 p-3.5", !on && "opacity-45")}>
                <span className={cx("grid size-6 shrink-0 place-items-center rounded-full", on ? "bg-green text-cream" : "border-2 border-[var(--line-strong)]")}>{on && <IconCheck size={14} strokeWidth={3} />}</span>
                <span><span className="block text-[14.5px] font-semibold">{p.label}</span><span className="block text-[12.5px] text-muted">{p.desc}</span></span>
              </li>
            );
          })}
        </ul>
        {me.role !== "manager" && <p className="mt-3 text-[13px] text-muted">Need more access? Ask a manager.</p>}
      </Section>

      <form action={signOut} className="mt-10"><button className="btn btn-ghost">Sign out</button></form>
    </>
  );
}
