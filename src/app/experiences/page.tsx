// Tutte le esperienze, divise per tipo, con il filtro per città (?city=positano). Da qui si sceglie "cosa".
import type { Metadata } from "next";
import Link from "next/link";
import { ExperienceCard } from "@/components/ExperienceCard";
import { FloatingNav } from "@/components/FloatingNav";
import { Footer } from "@/components/Footer";
import { getCategories, getCity, getExperiences, getLiveCities, getStays, nightPrice } from "@/lib/content";
import { paths } from "@/lib/site";

export const metadata: Metadata = {
  title: "Experiences on the Amalfi Coast, picked by locals",
  description: "Boats, food, walks, drivers and places to stay in Sorrento, Positano, Amalfi and Capri. The price and the local partner are shown on every page.",
  alternates: { canonical: "/experiences" },
};

type Props = { searchParams: Promise<{ city?: string }> };

export default async function ExperiencesPage({ searchParams }: Props) {
  const { city: q } = await searchParams;
  const live = getLiveCities();
  const city = q && getCity(q)?.status === "live" ? getCity(q) : undefined;
  const all = getExperiences(city?.slug);
  const cats = getCategories().filter((c) => all.some((e) => e.category === c.slug));
  const stays = getStays(city?.slug);

  return (
    <>
      <FloatingNav city={city?.slug} />
      <main className="wrap co-page-pad">
        <p className="co-eyebrow">Experiences</p>
        <h1 className="co-h2">{city ? <>What we book in <em>{city.name}</em></> : <>What we book on the coast</>}</h1>
        <p className="co-status">A few things in each town, the ones we would do ourselves. Pick one and ask for a date, or put several in the <Link href="/amalfi-coast#package">Amalfi Coast package</Link>.</p>

        <nav className="co-filter" aria-label="Filter by town">
          <Link href="/experiences" aria-current={!city ? "page" : undefined}>All towns</Link>
          {live.map((c) => (
            <Link key={c.slug} href={`/experiences?city=${c.slug}`} aria-current={city?.slug === c.slug ? "page" : undefined} style={{ ["--chip" as string]: c.accent }}>
              {c.name}
            </Link>
          ))}
        </nav>

        {cats.map((c) => {
          const list = all.filter((e) => e.category === c.slug);
          return (
            <section key={c.slug} className="co-exp-cat">
              <div className="co-exp-head">
                <h2 className="co-h3">{c.name}</h2>
                <p className="co-status">{c.intro}</p>
              </div>
              <div className="co-exp-grid">
                {list.map((e) => (
                  <div key={`${e.city}-${e.slug}`}>
                    {!city && <p className="co-exp-town">{getCity(e.city)?.name}</p>}
                    <ExperienceCard e={e} />
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {stays.length > 0 && (
          <section className="co-exp-cat">
            <div className="co-exp-head">
              <h2 className="co-h3">Where to stay</h2>
              <p className="co-status">Two or three hotels and houses per town. Places we know.</p>
            </div>
            <div className="co-exp-grid">
              {stays.map((s) => (
                <Link key={`${s.city}-${s.slug}`} href={paths.stay(s.city, s.slug)} className="co-exp-stay">
                  {s.image && <img src={s.image} alt="" loading="lazy" />}
                  <span className="co-exp-town">{getCity(s.city)?.name} · {s.kind === "hotel" ? "Hotel" : "House"}</span>
                  <b>{s.title}</b>
                  <small>From {nightPrice(s)}</small>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
