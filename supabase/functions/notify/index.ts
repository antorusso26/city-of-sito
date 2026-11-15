// Edge Function "notify": legge la coda `notifications`, manda le email con Resend e le segna come inviate.
// Si chiama ogni minuto (Supabase Cron) o da un Database Webhook su insert in `notifications`.
// Variabili: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (automatiche), RESEND_API_KEY, MAIL_FROM, ADMIN_EMAIL, SITE_URL.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const RESEND = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM = Deno.env.get("MAIL_FROM") ?? "City Of <bookings@example.com>";
const ADMIN = Deno.env.get("ADMIN_EMAIL") ?? "";
const SITE = (Deno.env.get("SITE_URL") ?? "").replace(/\/$/, "");

type Booking = {
  code: string; people: number; starts_on: string | null; notes: string | null; status: string;
  customers: { email: string; full_name: string | null } | null;
  booking_items: { status: string; partner_id: string; listings: { title: string } | null; partners: { name: string; contact_email: string | null } | null }[];
};

const lines = (b: Booking, partnerId?: string) =>
  b.booking_items.filter((i) => !partnerId || i.partner_id === partnerId).map((i) => `• ${i.listings?.title ?? "?"}`).join("\n");

function compose(template: string, audience: string, b: Booking, partnerId?: string): { subject: string; text: string } | null {
  const who = b.customers?.full_name ?? "there";
  const when = b.starts_on ?? "dates to agree";
  if (audience === "customer") {
    switch (template) {
      case "booking_requested": return { subject: `We have your request (${b.code})`, text: `Hi ${who},\n\nWe have your request for ${b.people} people, ${when}:\n${lines(b)}\n\nWe ask each partner and write back, usually within a day.\nFollow it here: ${SITE}/account\n\nCity Of` };
      case "booking_partner_confirmed": return { subject: `Confirmed by the partners (${b.code})`, text: `Hi ${who},\n\nEvery partner said yes. We will send the total and how to hold the date.\n\nCity Of` };
      case "booking_confirmed": return { subject: `Your booking is confirmed (${b.code})`, text: `Hi ${who},\n\nIt is confirmed:\n${lines(b)}\n\nMeeting points and times are in ${SITE}/account.\n\nCity Of` };
      case "booking_cancelled_weather": return { subject: `Cancelled because of the weather (${b.code})`, text: `Hi ${who},\n\nThe sea is not safe on ${when}. We refund your deposit in full, or move the date if you prefer.\n\nCity Of` };
      case "booking_declined": return { subject: `We could not book it (${b.code})`, text: `Hi ${who},\n\nThe partners cannot do these dates. Reply to this email and we propose alternatives.\n\nCity Of` };
      default: return null;
    }
  }
  if (audience === "partner" && template === "item_new") {
    return { subject: `New request ${b.code}: ${b.people} people, ${when}`, text: `New request from City Of:\n${lines(b, partnerId)}\n\nPeople: ${b.people}\nDate: ${when}\n${b.notes ? `Notes: ${b.notes}\n` : ""}\nAccept or decline: ${SITE}/partner` };
  }
  if (audience === "admin") return { subject: `[City Of] ${template.replace(/_/g, " ")} · ${b.code}`, text: `${template} for ${b.code} (${b.status}).\n${lines(b)}\n\n${SITE}/admin` };
  return null;
}

async function send(to: string, subject: string, text: string) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, text }),
  });
  if (!r.ok) throw new Error(`resend ${r.status}: ${await r.text()}`);
}

Deno.serve(async () => {
  const { data: queue, error } = await db.from("notifications").select("id, booking_id, audience, partner_id, template").is("sent_at", null).order("created_at").limit(25);
  if (error) return new Response(error.message, { status: 500 });
  let sent = 0;
  for (const n of queue ?? []) {
    try {
      const { data: b } = await db.from("bookings")
        .select("code, people, starts_on, notes, status, customers(email, full_name), booking_items(status, partner_id, listings(title), partners(name, contact_email))")
        .eq("id", n.booking_id).single<Booking>();
      if (!b) throw new Error("booking not found");
      const to = n.audience === "customer" ? b.customers?.email
        : n.audience === "admin" ? ADMIN
        : b.booking_items.find((i) => i.partner_id === n.partner_id)?.partners?.contact_email;
      const mail = compose(n.template, n.audience, b, n.partner_id ?? undefined);
      if (mail && to && RESEND) await send(to, mail.subject, mail.text);
      await db.from("notifications").update({ sent_at: new Date().toISOString(), to_address: to ?? null, error: mail && to ? null : "skipped: no template or no address" }).eq("id", n.id);
      sent++;
    } catch (e) {
      await db.from("notifications").update({ error: String(e) }).eq("id", n.id);
    }
  }
  return Response.json({ processed: queue?.length ?? 0, sent });
});
