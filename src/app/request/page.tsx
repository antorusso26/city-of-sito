// Richiesta di prenotazione: riepilogo di cosa si chiede, poi nome, email, date e persone.
import type { Metadata } from "next";
import Link from "next/link";
import { FloatingNav } from "@/components/FloatingNav";
import { Footer } from "@/components/Footer";
import { formatPrice, getCity, getExperiences, getStays, nightPrice } from "@/lib/content";
import { paths, whatsappLink } from "@/lib/site";
import { RequestForm } from "./RequestForm";

export const metadata: Metadata = { title: "Request a booking", robots: { index: false } };

type Props = { searchParams: Promise<{ items?: string; people?: string; package?: string }> };

function resolve(key: string) {
  const [kind, rest = ""] = key.split(":");
  const parts = rest.split("/");
  if (kind === "exp") {
    const e = getExperiences(parts[0], parts[1]).find((x) => x.slug === parts[2]);
    return e && { key, title: e.title, city: getCity(e.city)?.name ?? e.city, price: formatPrice(e), href: paths.experience(e.city, e.category, e.slug) };
  }
  if (kind === "stay") {
    const s = getStays(parts[0]).find((x) => x.slug === parts[1]);
    return s && { key, title: s.title, city: getCity(s.city)?.name ?? s.city, price: nightPrice(s), href: `${paths.city(s.city)}#stay` };
  }
  return undefined;
}

export default async function RequestPage({ searchParams }: Props) {
  const sp = await searchParams;
  const lines = (sp.items ?? "").split(",").filter(Boolean).map(resolve).filter((x): x is NonNullable<ReturnType<typeof resolve>> => Boolean(x));
  const people = Math.min(50, Math.max(1, Number(sp.people) || 2));
  const wa = whatsappLink(`Hi City Of, I'd like to book: ${lines.map((l) => `${l.title} (${l.city})`).join("; ")}. People: ${people}. Dates: …`);

  return (
    <>
      <FloatingNav />
      <main className="wrap co-page-pad">
        <p className="co-eyebrow">Booking request</p>
        <h1 className="co-h2">What you are asking for</h1>
        {lines.length === 0 ? (
          <p className="co-status">Nothing selected yet. Start from a <Link href="/amalfi-coast">city</Link> or the <Link href="/amalfi-coast#package">Amalfi Coast package</Link>.</p>
        ) : (
          <>
            <ul className="co-lines">
              {lines.map((l) => (
                <li key={l.key}><span><Link href={l.href}>{l.title}</Link> · {l.city}</span><b>{l.price}</b></li>
              ))}
            </ul>
            <p className="co-note">Prices in [brackets] are being confirmed with the partner. We send the total before you pay anything.</p>
            <h2 className="co-h3" style={{ marginTop: 40 }}>Your details</h2>
            <RequestForm items={lines.map((l) => l.key)} people={people} pkg={sp.package} whatsapp={wa} />
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
