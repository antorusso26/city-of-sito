// Area clienti: tutte le prenotazioni (future e passate), cosa c'è dentro, chi lo gestisce, a che punto è.
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AreaShell, money, statusLabel } from "@/components/AreaShell";
import { BackendNotice } from "@/components/BackendNotice";
import { currentUser, supabase, supabaseReady } from "@/lib/supabase";

export const metadata: Metadata = { title: "My bookings", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (!supabaseReady) return <AreaShell eyebrow="City Of" title="My bookings"><BackendNotice /></AreaShell>;
  const user = await currentUser();
  if (!user) redirect("/login?next=/account");

  const sb = await supabase();
  const { data: bookings } = await sb
    .from("bookings")
    .select("id, code, status, people, starts_on, ends_on, total_cents, deposit_cents, currency, created_at, booking_items(id, status, starts_at, line_cents, listings(title, kind, cities(name)), partners(name))")
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().slice(0, 10);
  const list = bookings ?? [];
  const upcoming = list.filter((b) => !b.starts_on || b.starts_on >= today);
  const past = list.filter((b) => b.starts_on && b.starts_on < today);

  const Card = ({ b }: { b: (typeof list)[number] }) => (
    <article className="co-card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <b>Booking {b.code}</b>
        <span className={`co-badge ${b.status}`}>{statusLabel(b.status)}</span>
      </div>
      <p className="co-note">{b.people} people · {b.starts_on ?? "dates to agree"}{b.ends_on ? ` → ${b.ends_on}` : ""}</p>
      <ul className="co-lines" style={{ marginTop: 12 }}>
        {(b.booking_items ?? []).map((i: any) => (
          <li key={i.id}>
            <span>{i.listings?.title} · {i.listings?.cities?.name}<br /><small className="co-note">Run by {i.partners?.name}</small></span>
            <span className={`co-badge ${i.status}`}>{statusLabel(i.status)}</span>
          </li>
        ))}
      </ul>
      <p className="co-note">Total {money(b.total_cents, b.currency)} · deposit {money(b.deposit_cents, b.currency)}</p>
    </article>
  );

  return (
    <AreaShell eyebrow="City Of" title="My bookings" email={user.email}>
      {list.length === 0 && <p className="co-status">No bookings yet. <Link href="/amalfi-coast">Start from a city</Link>.</p>}
      {upcoming.length > 0 && <><h2 className="co-h3">Coming up</h2><div className="co-grid-2">{upcoming.map((b) => <Card key={b.id} b={b} />)}</div></>}
      {past.length > 0 && <><h2 className="co-h3" style={{ marginTop: 40 }}>Past trips</h2><div className="co-grid-2">{past.map((b) => <Card key={b.id} b={b} />)}</div></>}
    </AreaShell>
  );
}
