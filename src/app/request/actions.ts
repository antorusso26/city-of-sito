"use server";

// Invio della richiesta di prenotazione. I prezzi li calcola il database (funzione request_booking),
// il browser manda solo cosa, quando e per quante persone.
import { supabase, supabaseReady } from "@/lib/supabase";

export type RequestState = { ok: boolean; code?: string; error?: string; notConnected?: boolean } | null;

export async function sendRequest(_prev: RequestState, form: FormData): Promise<RequestState> {
  const email = String(form.get("email") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const phone = String(form.get("phone") ?? "").trim();
  const people = Number(form.get("people") ?? 0);
  const startsOn = String(form.get("starts_on") ?? "") || null;
  const endsOn = String(form.get("ends_on") ?? "") || null;
  const notes = String(form.get("notes") ?? "").trim();
  const pkg = String(form.get("package") ?? "") || null;
  const keys = String(form.get("items") ?? "").split(",").filter(Boolean);

  if (!email.includes("@")) return { ok: false, error: "Please add an email we can answer to." };
  if (!name) return { ok: false, error: "Please add your name." };
  if (!(people >= 1 && people <= 50)) return { ok: false, error: "How many people are you?" };
  if (keys.length === 0) return { ok: false, error: "Nothing to book yet." };
  if (!supabaseReady) return { ok: false, notConnected: true };

  // "exp:sorrento/boat-tours/private-boat-capri" o "stay:capri/white-villa-in-anacapri" → { city, slug }
  // Per alberghi e case le notti vengono dalle date (il database applica il minimo di notti).
  const nights = startsOn && endsOn ? Math.round((Date.parse(endsOn) - Date.parse(startsOn)) / 86_400_000) : 0;
  const items = keys.map((k) => {
    const [kind, rest = ""] = k.split(":");
    const parts = rest.split("/");
    return { city: parts[0], slug: parts[parts.length - 1], starts_on: startsOn, nights: kind === "stay" && nights > 0 ? nights : null };
  });

  const sb = await supabase();
  const { data, error } = await sb.rpc("request_booking", {
    p_email: email, p_name: name, p_phone: phone || null, p_people: people, p_notes: notes || null,
    p_items: items, p_starts_on: startsOn, p_ends_on: endsOn, p_package_slug: pkg, p_channel: "web",
  });
  if (error) return { ok: false, error: "We could not send the request. Please try again, or write to us on WhatsApp." };
  return { ok: true, code: String(data) };
}
