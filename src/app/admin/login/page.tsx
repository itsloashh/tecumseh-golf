import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin/session";
import { supabaseConfigured } from "@/lib/data/supabase";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  return <LoginForm configured={supabaseConfigured()} />;
}
