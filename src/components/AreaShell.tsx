// Cornice delle aree riservate (clienti, partner, admin).
import { FloatingNav } from "./FloatingNav";

export function AreaShell({ eyebrow, title, email, children }: { eyebrow: string; title: string; email?: string; children: React.ReactNode }) {
  return (
    <>
      <FloatingNav />
      <main className="wrap co-page-pad">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
          <div>
            <p className="co-eyebrow">{eyebrow}</p>
            <h1 className="co-h2">{title}</h1>
          </div>
          {email && (
            <form action="/auth/signout" method="post" style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span className="co-note" style={{ margin: 0 }}>{email}</span>
              <button className="co-btn small ghost">Sign out</button>
            </form>
          )}
        </div>
        <div style={{ marginTop: 28 }}>{children}</div>
      </main>
    </>
  );
}

export const money = (cents: number | null | undefined, currency = "EUR") =>
  cents === null || cents === undefined ? "[PRICE]" : new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(cents / 100);

export const statusLabel = (s: string) => s.replace(/_/g, " ");
