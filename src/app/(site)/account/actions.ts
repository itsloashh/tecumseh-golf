"use server";
import { revalidatePath } from "next/cache";
import { supabaseSession } from "@/lib/auth/server";

export async function updateProfile(input: { name: string; phone: string; marketing: boolean }): Promise<{ ok: boolean; error?: string }> {
  const sb = await supabaseSession();
  const { data } = await sb.auth.getUser();
  if (!data.user) return { ok: false, error: "Please sign in again." };
  const name = input.name.trim().slice(0, 120), phone = input.phone.trim().slice(0, 40);
  // RLS: shoppers can only update their own row
  const { error } = await sb.from("customers").update({ name: name || null, phone: phone || null, marketing: input.marketing }).eq("id", data.user.id);
  if (error) return { ok: false, error: "Couldn't save — please try again." };
  await sb.auth.updateUser({ data: { name, phone } });
  revalidatePath("/account");
  return { ok: true };
}
