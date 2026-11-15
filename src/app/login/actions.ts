"use server";

import { SITE_URL } from "@/lib/site";
import { supabase } from "@/lib/supabase";

export type LoginState = { sent?: boolean; error?: string } | null;

export async function sendLink(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim();
  const next = String(form.get("next") ?? "/account");
  if (!email.includes("@")) return { error: "Please write a valid email." };
  const sb = await supabase();
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next.startsWith("/") ? next : "/account")}` },
  });
  return error ? { error: "We could not send the link. Try again in a minute." } : { sent: true };
}
