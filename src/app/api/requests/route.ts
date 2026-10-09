import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/data/supabase";
import { getCustomer } from "@/lib/auth/server";
import { emailNewRequest } from "@/lib/notify";

const bad = (error: string, status = 422) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  let b: { service?: string; date?: string | null; time?: string; name?: string; email?: string; phone?: string; details?: string; company?: string };
  try { b = await req.json(); } catch { return bad("Malformed request.", 400); }
  if (b.company) return NextResponse.json({ ok: true, demo: true });

  const name = b.name?.trim() ?? "", email = b.email?.trim().toLowerCase() ?? "";
  if (!b.service) return bad("Pick a service.");
  if (!name) return bad("Please add your name.");
  if (!/^\S+@\S+\.\S+$/.test(email)) return bad("Please add a valid email.");
  const date = b.date && /^\d{4}-\d{2}-\d{2}$/.test(b.date) ? b.date : null;

  const db = supabaseService();
  if (!db) return NextResponse.json({ ok: true, demo: true });

  const { data: svc } = await db.from("services").select("slug,title").eq("slug", b.service).maybeSingle();
  if (!svc) return bad("That service isn't available.");
  const user = await getCustomer();

  const { error } = await db.from("service_requests").insert({
    service_slug: svc.slug, service_title: svc.title, preferred_date: date, preferred_time: b.time?.slice(0, 40) || null,
    name: name.slice(0, 120), email: email.slice(0, 200), phone: b.phone?.trim().slice(0, 40) || null,
    details: b.details?.trim().slice(0, 2000) || null, customer_id: user?.id ?? null,
  });
  if (error) {
    console.error("[requests]", error);
    return bad("Couldn't send your request. Please call the shop.", 500);
  }
  await emailNewRequest({ name, email, phone: b.phone, service: svc.title, when: [date, b.time].filter(Boolean).join(" · ") || "Flexible", details: b.details });
  return NextResponse.json({ ok: true });
}
