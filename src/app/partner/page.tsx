// Area tour operator / albergo: le richieste che lo riguardano (accetta o rifiuta) e le sue schede.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AreaShell, money, statusLabel } from "@/components/AreaShell";
import { BackendNotice } from "@/components/BackendNotice";
import { currentUser, supabase, supabaseReady } from "@/lib/supabase";
import { answer } from "./actions";

export const metadata: Metadata = { title: "Partner area", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PartnerPage() {
  if (!supabaseReady) return <AreaShell eyebrow="Partner area" title="Your requests"><BackendNotice /></AreaShell>;
  const user = await currentUser();
  if (!user) redirect("/login?next=/partner");

  const sb = await supabase();
  const { data: memberships } = await sb.from("partner_members").select("partner_id, partners(name, kind)");
  if (!memberships?.length) {
    return (
      <AreaShell eyebrow="Partner area" title="Your requests" email={user.email}>
        <p className="co-status">This email is not linked to a partner yet. Ask us to add you.</p>
      </AreaShell>
    );
  }

  // Le regole del database fanno vedere solo le righe dei propri partner.
  const { data: items } = await sb
    .from("booking_items")
    .select("id, status, starts_at, people, line_cents, partner_note, created_at, listings(title, cities(name)), bookings(code, notes, starts_on, ends_on)")
    .order("created_at", { ascending: false })
    .limit(100);
  const { data: listings } = await sb.from("listings").select("id, title, status, kind, price_cents, price_unit, cities(name)").order("title");

  const pending = (items ?? []).filter((i) => i.status === "pending");
  const others = (items ?? []).filter((i) => i.status !== "pending");
  const names = memberships.map((m: any) => m.partners?.name).join(", ");

  return (
    <AreaShell eyebrow={`Partner area · ${names}`} title="Your requests" email={user.email}>
      <h2 className="co-h3">To answer ({pending.length})</h2>
      {pending.length === 0 && <p className="co-status">Nothing waiting for you.</p>}
      <div className="co-grid-2">
        {pending.map((i: any) => (
          <article key={i.id} className="co-card">
            <b>{i.listings?.title}</b>
            <p className="co-note">{i.listings?.cities?.name} · {i.people} people · {i.bookings?.starts_on ?? "date to agree"} · ref {i.bookings?.code}</p>
            {i.bookings?.notes && <p>“{i.bookings.notes}”</p>}
            <form action={answer} className="co-form" style={{ marginTop: 12 }}>
              <input type="hidden" name="id" value={i.id} />
              <label>Note to us (optional)<input name="note" placeholder="e.g. the boat leaves at 9:30" /></label>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="co-btn small" name="status" value="accepted">Accept</button>
                <button className="co-btn small ghost" name="status" value="declined">Decline</button>
              </div>
            </form>
          </article>
        ))}
      </div>

      <h2 className="co-h3" style={{ marginTop: 40 }}>Answered</h2>
      <table className="co-table">
        <thead><tr><th>Ref</th><th>What</th><th>People</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>
          {others.map((i: any) => (
            <tr key={i.id}><td>{i.bookings?.code}</td><td>{i.listings?.title}</td><td>{i.people}</td><td>{i.bookings?.starts_on ?? "—"}</td><td><span className={`co-badge ${i.status}`}>{statusLabel(i.status)}</span></td></tr>
          ))}
        </tbody>
      </table>

      <h2 className="co-h3" style={{ marginTop: 40 }}>Your listings</h2>
      <p className="co-status">To change a price, text or photo, write to us: we publish every change.</p>
      <table className="co-table">
        <thead><tr><th>Listing</th><th>Town</th><th>Price</th><th>Status</th></tr></thead>
        <tbody>
          {(listings ?? []).map((l: any) => (
            <tr key={l.id}><td>{l.title}</td><td>{l.cities?.name}</td><td>{money(l.price_cents)} {l.price_unit.replace("_", " ")}</td><td>{l.status}</td></tr>
          ))}
        </tbody>
      </table>
    </AreaShell>
  );
}
