"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

// Le regole del database lasciano scrivere qui solo chi ha il ruolo admin.
const BOOKING = new Set(["requested", "partner_confirmed", "deposit_pending", "confirmed", "completed", "cancelled_customer", "cancelled_weather", "cancelled_partner", "declined"]);
const LISTING = new Set(["draft", "review", "published", "archived"]);

export async function setBookingStatus(form: FormData) {
  const id = String(form.get("id") ?? ""), status = String(form.get("status") ?? "");
  if (!id || !BOOKING.has(status)) return;
  await (await supabase()).from("bookings").update({ status }).eq("id", id);
  revalidatePath("/admin");
}

export async function setListingStatus(form: FormData) {
  const id = String(form.get("id") ?? ""), status = String(form.get("status") ?? "");
  if (!id || !LISTING.has(status)) return;
  await (await supabase()).from("listings").update({ status }).eq("id", id);
  revalidatePath("/admin");
}
