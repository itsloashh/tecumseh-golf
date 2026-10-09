import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseSession } from "@/lib/auth/server";

/** Landing spot for Supabase email links (confirm sign-up, reset password). */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const next = url.searchParams.get("next") ?? "/account";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const sb = await supabaseSession();
  let ok = false;
  if (code) ok = !(await sb.auth.exchangeCodeForSession(code)).error;
  else if (tokenHash && type) ok = !(await sb.auth.verifyOtp({ token_hash: tokenHash, type })).error;

  const to = url.clone();
  to.search = "";
  to.pathname = ok ? safeNext : "/account";
  if (!ok) to.searchParams.set("link", "expired");
  else if (safeNext === "/account") to.searchParams.set("welcome", "1");
  return NextResponse.redirect(to);
}
