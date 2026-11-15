// Catalogo di una città, a schede (riferimento: sorrentoinsider.com):
// ricerca, "Plan your day", una fila per categoria, guide, altre città.
import Link from "next/link";
import { getCities, getCityCategories, getExperiences, getGuides, getLandings, type City } from "@/lib/content";
import { paths } from "@/lib/site";
import { Art } from "./Art";
import { ExperienceCard } from "./ExperienceCard";
import { SearchBox } from "./SearchBox";

function RowHead({ title, text, href, link }: { title: string; text?: string; href?: string; link?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-[34px] md:text-[44px]">{title}</h2>
        {text && <p className="mt-2 max-w-2xl text-pietra">{text}</p>}
      </div>
      {href && <Link href={href} className="flex min-h-11 shrink-0 items-center whitespace-nowrap text-sm font-bold text-blu hover:underline">{link}</Link>}
    </div>
  );
}

export function CitySections({ city, heading, intro = true, otherCoasts = true }: { city: City; heading: "h1" | "h2"; intro?: boolean; otherCoasts?: boolean }) {
  const categories = getCityCategories(city.slug);
  const landings = getLandings(city.slug);
  const guides = getGuides(city.slug);
  const H = heading;

  // Schede piccole di "Plan your day": le landing mirate, le categorie, le guide più utili.
  const quick = [
    ...landings.map((l) => ({ title: l.h1.replace(` from ${city.name}`, ""), text: l.format === "private" ? "Priced per boat" : "Priced per person", href: paths.section(city.slug, l.slug), kind: l.category })),
    ...categories.filter((c) => c.slug !== "boat-tours").map((c) => ({ title: c.name, text: `In ${city.name}`, href: paths.section(city.slug, c.slug), kind: c.slug })),
    ...guides.slice(0, 8).map((g) => ({ title: g.h1, text: g.type === "practical" ? "Getting around" : g.type === "local" ? "Around town" : "Guide", href: paths.guide(city.slug, g.slug), kind: "guide" })),
  ].slice(0, 8);

  return (
    <div id={city.slug} data-city={city.slug} className="scroll-mt-24 bg-white">
      {intro && <section className="wrap pb-6 pt-16 text-center md:pt-20">
        <p className="label text-pietra">{city.coordinates}</p>
        <H className="font-display mx-auto mt-3 max-w-4xl text-[44px] md:text-[72px]">
          <span className="text-blu">{city.name}:</span> find it, book it, <span className="text-citta-chiaro">go.</span>
        </H>
        <div className="mt-8">
          <SearchBox city={city.slug} categories={categories.map((c) => ({ slug: c.slug, name: c.name, href: paths.section(city.slug, c.slug) }))} />
        </div>
        <p className="mt-5 text-sm text-pietra">We choose every partner in person. The full price is shown before you book.</p>
      </section>}

      <section className="wrap mt-12">
        <RowHead title="Plan your day" />
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quick.map((q) => (
            <li key={q.href}>
              <Link href={q.href} className="group flex items-center gap-4 rounded-2xl p-1.5 hover:bg-nebbia">
                <Art kind={q.kind} className="h-[84px] w-[110px] shrink-0 rounded-xl" />
                <span className="min-w-0">
                  <span className="block font-bold leading-snug group-hover:underline">{q.title}</span>
                  <span className="mt-0.5 block text-sm text-pietra">{q.text}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {categories.map((c) => {
        const list = getExperiences(city.slug, c.slug);
        return (
          <section key={c.slug} className="wrap mt-16">
            <RowHead title={c.name} text={c.intro} href={paths.section(city.slug, c.slug)} link={`See all ${c.name.toLowerCase()}`} />
            {list.length >= 4 ? (
              <div className="row-scroll mt-6">
                {list.slice(0, 5).map((e) => <ExperienceCard key={e.slug} e={e} />)}
              </div>
            ) : (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {list.map((e) => <ExperienceCard key={e.slug} e={e} wide />)}
              </div>
            )}
          </section>
        );
      })}

      {guides.length > 0 && <section className="wrap mt-16">
        <RowHead title="Get your bearings" text={`Practical guides to ${city.name}, written by people who live here.`} href={paths.guides(city.slug)} link="See all guides" />
        <div className="row-scroll mt-6">
          {guides.slice(0, 5).map((g) => (
            <article key={g.slug} className="group">
              <Link href={paths.guide(city.slug, g.slug)} className="block">
                <Art kind="guide" className="aspect-[4/3] rounded-2xl transition-transform duration-500 ease-giro group-hover:-translate-y-1" />
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-pietra">{g.type === "practical" ? "Getting around" : g.type === "local" ? "Around town" : "Guide"}</p>
                <h3 className="mt-1.5 text-[17px] font-bold leading-snug group-hover:underline">{g.h1}</h3>
              </Link>
            </article>
          ))}
        </div>
      </section>}

      {otherCoasts && <section className="wrap mt-16">
        <RowHead title="Other coasts" text="One helm, many towns. These open next." />
        <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {getCities().filter((c) => c.slug !== city.slug).map((c) => (
            <li key={c.slug} data-city={c.slug}>
              <div className="flex aspect-[4/3] flex-col justify-between rounded-2xl bg-abisso p-4 text-white">
                <span className="block h-7 w-3 rounded-full" style={{ background: "var(--citta)" }} />
                <p className="font-display text-[26px] uppercase leading-none">City of {c.name}</p>
              </div>
              <p className="mt-3 text-xs font-bold uppercase tracking-wider text-pietra">{c.status === "live" ? c.coordinates : "Opening soon"}</p>
            </li>
          ))}
        </ul>
      </section>}
    </div>
  );
}
