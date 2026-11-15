"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

/** Il partner accetta o rifiuta una riga. Il database permette solo questo cambio, e solo sulle sue righe. */
export async function answer(form: FormData) {
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  const note = String(form.get("note") ?? "").trim();
  if (!id || !["accepted", "declined"].includes(status)) return;
  const sb = await supabase();
  await sb.from("booking_items").update({ status, partner_note: note || null }).eq("id", id);
  revalidatePath("/partner");
}
