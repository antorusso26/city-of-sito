// Area nostra: prenotazioni con il loro stato, partner, schede, email in uscita.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AreaShell, money, statusLabel } from "@/components/AreaShell";
import { BackendNotice } from "@/components/BackendNotice";
import { currentRole, currentUser, supabase, supabaseReady } from "@/lib/supabase";
import { setBookingStatus, setListingStatus } from "./actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const BOOKING_STATUSES = ["requested", "partner_confirmed", "deposit_pending", "confirmed", "completed", "cancelled_customer", "cancelled_weather", "cancelled_partner", "declined"];

export default async function AdminPage() {
  if (!supabaseReady) return <AreaShell eyebrow="Admin" title="Bookings"><BackendNotice /></AreaShell>;
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if ((await currentRole()) !== "admin") {
    return <AreaShell eyebrow="Admin" title="Bookings" email={user.email}><p className="co-status">This account is not an admin.</p></AreaShell>;
  }

  const sb = await supabase();
  const [{ data: bookings }, { data: partners }, { data: listings }, { count: unsent }] = await Promise.all([
    sb.from("bookings").select("id, code, status, people, starts_on, total_cents, deposit_cents, created_at, customers(email, full_name), booking_items(status, listings(title))").order("created_at", { ascending: false }).limit(100),
    sb.from("partners").select("id, name, kind, status, commission_pct").order("name"),
    sb.from("listings").select("id, title, kind, status, price_cents, price_unit, cities(name)").order("title"),
    sb.from("notifications").select("id", { count: "exact", head: true }).is("sent_at", null),
  ]);

  const open = (bookings ?? []).filter((b) => ["requested", "partner_confirmed", "deposit_pending"].includes(b.status));

  return (
    <AreaShell eyebrow="Admin" title="Bookings" email={user.email}>
      <div className="co-grid-2" style={{ marginBottom: 32 }}>
        <div className="co-card co-stat"><b>{open.length}</b>open requests</div>
        <div className="co-card co-stat"><b>{(partners ?? []).filter((p) => p.status === "active").length}</b>active partners</div>
        <div className="co-card co-stat"><b>{(listings ?? []).filter((l) => l.status === "published").length}</b>published listings</div>
        <div className="co-card co-stat"><b>{unsent ?? 0}</b>emails waiting to go out</div>
      </div>

      <table className="co-table">
        <thead><tr><th>Ref</th><th>Customer</th><th>What</th><th>People / date</th><th>Total · deposit</th><th>Status</th></tr></thead>
        <tbody>
          {(bookings ?? []).map((b: any) => (
            <tr key={b.id}>
              <td><b>{b.code}</b></td>
              <td>{b.customers?.full_name}<br /><small>{b.customers?.email}</small></td>
              <td>{(b.booking_items ?? []).map((i: any, k: number) => <div key={k}>{i.listings?.title} <span className={`co-badge ${i.status}`}>{statusLabel(i.status)}</span></div>)}</td>
              <td>{b.people} · {b.starts_on ?? "—"}</td>
              <td>{money(b.total_cents)} · {money(b.deposit_cents)}</td>
              <td>
                <form action={setBookingStatus} style={{ display: "flex", gap: 6 }}>
                  <input type="hidden" name="id" value={b.id} />
                  <select name="status" defaultValue={b.status} className="co-badge">{BOOKING_STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}</select>
                  <button className="co-btn small ghost">Save</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="co-h3" style={{ marginTop: 48 }}>Listings</h2>
      <table className="co-table">
        <thead><tr><th>Listing</th><th>Town</th><th>Kind</th><th>Price</th><th>Status</th></tr></thead>
        <tbody>
          {(listings ?? []).map((l: any) => (
            <tr key={l.id}>
              <td>{l.title}</td><td>{l.cities?.name}</td><td>{l.kind}</td><td>{money(l.price_cents)} {l.price_unit.replace("_", " ")}</td>
              <td>
                <form action={setListingStatus} style={{ display: "flex", gap: 6 }}>
                  <input type="hidden" name="id" value={l.id} />
                  <select name="status" defaultValue={l.status} className="co-badge">{["draft", "review", "published", "archived"].map((s) => <option key={s}>{s}</option>)}</select>
                  <button className="co-btn small ghost">Save</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="co-h3" style={{ marginTop: 48 }}>Partners</h2>
      <table className="co-table">
        <thead><tr><th>Partner</th><th>Kind</th><th>Status</th><th>Commission</th></tr></thead>
        <tbody>{(partners ?? []).map((p: any) => <tr key={p.id}><td>{p.name}</td><td>{p.kind}</td><td>{p.status}</td><td>{p.commission_pct}%</td></tr>)}</tbody>
      </table>
    </AreaShell>
  );
}
