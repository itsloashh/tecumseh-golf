"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TeamMember } from "@/lib/admin/queries";
import { PERMISSIONS, PRESETS, type Permission, type Role } from "@/lib/admin/permissions";
import { removeStaff, saveStaff } from "@/app/admin/actions";
import { ConfirmButton, Field, PageHead, Pill, Sheet, TextInput, Toggle, ago, useAction } from "./kit";
import { IconCheck, IconPlus, cx } from "@/components/ui/primitives";

export function TeamManager({ team, myId }: { team: TeamMember[]; myId: string }) {
  const [editing, setEditing] = useState<TeamMember | "new" | null>(null);
  const managers = team.filter((t) => t.role === "manager");
  const staff = team.filter((t) => t.role === "staff");

  const Row = ({ t }: { t: TeamMember }) => (
    <li>
      <button onClick={() => setEditing(t)} className={cx("card flex w-full items-center gap-3.5 p-4 text-left hover:border-[var(--line-strong)]", !t.active && "opacity-55")}>
        <span className={cx("grid size-11 shrink-0 place-items-center rounded-full text-[15px] font-bold uppercase", t.role === "manager" ? "bg-green text-cream" : "bg-leaf text-green")}>
          {(t.name || t.email).slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2 font-semibold">
            {t.name || t.email.split("@")[0]}
            {t.owner && <Pill tone="ink">Owner</Pill>}
            {t.userId === myId && <Pill>You</Pill>}
            {!t.active && <Pill tone="clay">Deactivated</Pill>}
          </span>
          <span className="block truncate text-[13px] text-muted">{t.email}</span>
          <span className="mt-1 flex flex-wrap gap-1">
            {t.role === "manager"
              ? <Pill tone="green">Full access</Pill>
              : t.permissions.length ? t.permissions.map((p) => <Pill key={p}>{PERMISSIONS.find((x) => x.key === p)?.label}</Pill>) : <Pill tone="clay">No access</Pill>}
          </span>
        </span>
        <span className="hidden shrink-0 text-right text-[12px] text-faint sm:block">{t.lastSeenAt ? `Signed in ${ago(t.lastSeenAt)}` : "Not signed in yet"}</span>
      </button>
    </li>
  );

  return (
    <>
      <PageHead kicker="Manager" title="Team & access" sub="Add employees, choose exactly which screens they can use, reset passwords, or switch someone off."
        action={<button onClick={() => setEditing("new")} className="btn btn-flag"><IconPlus size={18} /> Add employee</button>} />

      <h2 className="label mb-3 mt-8 text-ink">Managers · {managers.length}</h2>
      <ul className="space-y-2.5">{managers.map((t) => <Row key={t.id} t={t} />)}</ul>
      <h2 className="label mb-3 mt-8 text-ink">Employees · {staff.length}</h2>
      {staff.length ? <ul className="space-y-2.5">{staff.map((t) => <Row key={t.id} t={t} />)}</ul>
        : <p className="card p-6 text-[14px] text-muted">No employees yet. Add one and they can sign in at <b>/admin</b> with the email and temporary password you set.</p>}

      <div className="card mt-8 p-5 text-[14px]">
        <p className="font-semibold">How access works</p>
        <ul className="mt-2 space-y-1.5 text-muted">
          <li>• <b className="text-ink">Managers</b> see everything, manage the team, and see the activity log.</li>
          <li>• <b className="text-ink">Employees</b> only see the screens you tick. Every change they make is recorded under Activity.</li>
          <li>• Removing someone only removes dashboard access — they can still shop with the same email.</li>
        </ul>
      </div>

      {editing && <StaffSheet key={editing === "new" ? "new" : editing.id} member={editing === "new" ? null : editing} isMe={editing !== "new" && editing.userId === myId} onClose={() => setEditing(null)} />}
    </>
  );
}

const tempPassword = () => {
  const words = ["birdie", "eagle", "fairway", "bunker", "putter", "wedge", "driver", "green", "tee", "chip"];
  return `${words[Math.floor(Math.random() * words.length)]}-${words[Math.floor(Math.random() * words.length)]}-${Math.floor(100 + Math.random() * 900)}`;
};

function StaffSheet({ member, isMe, onClose }: { member: TeamMember | null; isMe: boolean; onClose: () => void }) {
  const router = useRouter();
  const { run, busy } = useAction();
  const [name, setName] = useState(member?.name ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [role, setRole] = useState<Role>(member?.role ?? "staff");
  const [perms, setPerms] = useState<Permission[]>(member?.permissions ?? ["orders", "stock", "bookings"]);
  const [active, setActive] = useState(member?.active ?? true);
  const [password, setPassword] = useState(member ? "" : tempPassword());
  const [resetting, setResetting] = useState(false);
  const [done, setDone] = useState<{ email: string; password: string } | null>(null);
  const locked = !!member && (member.owner || isMe);

  const toggle = (p: Permission) => setPerms((xs) => (xs.includes(p) ? xs.filter((x) => x !== p) : [...xs, p]));
  const save = async () => {
    const pw = member ? (resetting ? password : undefined) : password;
    const r = await run(saveStaff({ id: member?.id, name, email, password: pw, role, permissions: perms, active }), member ? "Saved" : "Employee added");
    if (!r) return;
    router.refresh();
    if (pw) setDone({ email: email.trim().toLowerCase(), password: pw });
    else onClose();
  };
  const remove = async () => {
    if (member && (await run(removeStaff(member.id), "Removed from the team"))) { router.refresh(); onClose(); }
  };

  if (done) {
    return (
      <Sheet open onClose={onClose} title={member ? "Password reset" : "Employee added"} footer={<button onClick={onClose} className="btn btn-green w-full">Done</button>}>
        <div className="rounded-2xl bg-green p-5 text-cream">
          <span className="grid size-10 place-items-center rounded-full bg-flag text-ink"><IconCheck size={20} strokeWidth={2.6} /></span>
          <p className="mt-4 text-[15px]">Give {name.split(" ")[0] || "them"} these sign-in details. They can change the password under <b>My account</b>.</p>
          <dl className="mt-4 space-y-2 rounded-xl bg-black/20 p-4 font-mono text-[14px]">
            <div><dt className="text-[11px] uppercase tracking-widest text-cream/60">Sign in at</dt><dd>{typeof window !== "undefined" ? window.location.origin : ""}/admin</dd></div>
            <div><dt className="text-[11px] uppercase tracking-widest text-cream/60">Email</dt><dd className="break-all">{done.email}</dd></div>
            <div><dt className="text-[11px] uppercase tracking-widest text-cream/60">Password</dt><dd>{done.password}</dd></div>
          </dl>
          <button onClick={() => navigator.clipboard?.writeText(`Tecumseh Golf staff login\n${window.location.origin}/admin\nEmail: ${done.email}\nPassword: ${done.password}`)} className="btn btn-flag btn-sm mt-4">Copy details</button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet open onClose={onClose} title={member ? (member.name || "Team member") : "Add employee"}
      footer={
        <div className="flex items-center gap-2">
          {member && !locked && <ConfirmButton busy={busy} onConfirm={remove}>Remove</ConfirmButton>}
          <button onClick={save} disabled={busy} className="btn btn-green ml-auto">{busy ? "Saving…" : member ? "Save" : "Add employee"}</button>
        </div>
      }>
      <div className="space-y-5">
        <Field label="Name"><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="First and last name" /></Field>
        <Field label="Email" hint={member ? "can't be changed" : "they'll sign in with this"}><TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!member} /></Field>

        {!member ? (
          <Field label="Temporary password" hint="share it with them"><TextInput value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        ) : !resetting ? (
          <button type="button" onClick={() => { setResetting(true); setPassword(tempPassword()); }} disabled={!member.userId} className="btn btn-ghost btn-sm">Reset their password</button>
        ) : (
          <Field label="New temporary password"><TextInput value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        )}

        <div>
          <span className="mb-1.5 block text-[13.5px] font-semibold">Role</span>
          <div className="grid grid-cols-2 gap-2">
            {([["staff", "Employee", "Only the screens you choose"], ["manager", "Manager", "Everything + team & activity"]] as const).map(([v, label, sub]) => (
              <button key={v} type="button" disabled={locked} onClick={() => setRole(v)} aria-pressed={role === v}
                className={cx("rounded-2xl border-2 p-3.5 text-left transition-colors disabled:opacity-50", role === v ? "border-green bg-paper" : "border-[var(--line)]")}>
                <span className="block font-semibold">{label}</span>
                <span className="block text-[12.5px] text-muted">{sub}</span>
              </button>
            ))}
          </div>
          {locked && <p className="mt-2 text-[12.5px] text-faint">{member?.owner ? "The owner account is always a manager." : "You can't change your own role."}</p>}
        </div>

        {role === "staff" && (
          <div>
            <span className="mb-1.5 block text-[13.5px] font-semibold">What can they access?</span>
            <div className="mb-3 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.label} type="button" title={p.desc} onClick={() => setPerms(p.permissions)} className="chip !h-9" aria-pressed={p.permissions.length === perms.length && p.permissions.every((x) => perms.includes(x))}>{p.label}</button>
              ))}
            </div>
            <ul className="card divide-y divide-[var(--line)]">
              {PERMISSIONS.map((p) => {
                const on = perms.includes(p.key);
                return (
                  <li key={p.key}>
                    <button type="button" role="checkbox" aria-checked={on} onClick={() => toggle(p.key)} className="flex w-full items-center gap-3 p-3.5 text-left hover:bg-ink/[0.02]">
                      <span className={cx("grid size-6 shrink-0 place-items-center rounded-md border-2 transition-colors", on ? "border-green bg-green text-cream" : "border-[var(--line-strong)]")}>{on && <IconCheck size={14} strokeWidth={3} />}</span>
                      <span><span className="block text-[14.5px] font-semibold">{p.label}</span><span className="block text-[12.5px] text-muted">{p.desc}</span></span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {member && !locked && <Toggle checked={active} onChange={setActive} label="Active" sub="Turn off to block their sign-in without deleting them" />}
      </div>
    </Sheet>
  );
}
