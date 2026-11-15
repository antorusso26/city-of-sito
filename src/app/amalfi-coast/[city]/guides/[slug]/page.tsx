// Una guida: pillar, pagina locale o informazione pratica.
// Struttura pensata per motori di ricerca e assistenti AI: risposta breve in alto, punti chiave, indice,
// sezioni con titoli-domanda, fonti con data di controllo, domande frequenti, esperienze prenotabili.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ExperienceCard } from "@/components/ExperienceCard";
import { FaqList } from "@/components/FaqList";
import { JsonLd } from "@/components/JsonLd";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getCategory, getCity, getExperiences, getGuide, getGuides, getLandings, getLiveCities } from "@/lib/content";
import { article, breadcrumbs, faqPage } from "@/lib/schema";
import { AREA, paths } from "@/lib/site";

type Props = { params: Promise<{ city: string; slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () =>
  getLiveCities().flatMap((c) => getGuides(c.slug).map((g) => ({ city: c.slug, slug: g.slug })));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, slug } = await params;
  const g = getGuide(city, slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: paths.guide(city, slug) },
    // Una scaletta non va indicizzata nemmeno dopo il lancio.
    ...(g.draft ? { robots: { index: false, follow: true } } : {}),
    openGraph: { type: "article", modifiedTime: g.updated },
  };
}

const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default async function GuidePage({ params }: Props) {
  const { city: citySlug, slug } = await params;
  const city = getCity(citySlug);
  const g = getGuide(citySlug, slug);
  if (!city || !g) notFound();

  const here = paths.guide(city.slug, g.slug);
  const crumbs = [
    { name: "City Of", path: paths.home() },
    { name: AREA.name, path: paths.area() },
    { name: city.name, path: paths.city(city.slug) },
    { name: "Guides", path: paths.guides(city.slug) },
    { name: g.h1, path: here },
  ];
  const related = g.related ? getCategory(g.related) : undefined;
  const experiences = related ? getExperiences(city.slug, related.slug).slice(0, 5) : [];
  const landings = related ? getLandings(city.slug).filter((l) => l.category === related.slug) : [];
  const all = getGuides(city.slug);
  const next = (g.next ?? []).map((s) => all.find((x) => x.slug === s)).filter((x) => x !== undefined);
  const more = next.length ? next : all.filter((x) => x.slug !== g.slug && x.related === g.related).slice(0, 3);

  return (
    <>
      <Breadcrumbs items={crumbs} />
      <main>
        <article>
          <header className="wrap pt-10">
            <p className="label text-blu">City of {city.name} · {g.type === "practical" ? "Getting around" : g.type === "local" ? "Around town" : "Guide"}</p>
            <h1 className="mt-3 max-w-4xl text-[44px] md:text-[68px]">{g.h1}</h1>
            <p className="mt-4 text-sm text-pietra">
              By the City of {city.name} team, who live here · Updated <time dateTime={g.updated}>{fmt(g.updated)}</time>
              {g.checked && <> · Prices and timetables checked {fmt(g.checked)}</>}
            </p>
            {g.draft && (
              <p className="mt-6 max-w-2xl rounded-2xl border border-sabbia bg-nebbia p-4 text-sm">
                Outline. The headings below are the plan for this guide. Facts, prices and timetables are added and checked before it is published.
              </p>
            )}
          </header>

          <div className="wrap mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0">
              {g.answer && (
                <div className="rounded-2xl bg-crema p-6 md:p-8">
                  <p className="label text-blu">The short answer</p>
                  <p className="mt-3 text-xl font-medium leading-relaxed md:text-[22px]">{g.answer}</p>
                  {g.keyFacts && g.keyFacts.length > 0 && (
                    <ul className="mt-5 grid gap-2 text-[15px] sm:grid-cols-2">
                      {g.keyFacts.map((f) => (
                        <li key={f} className="flex gap-2"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blu" />{f}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="prose mt-10" dangerouslySetInnerHTML={{ __html: g.html }} />

              {g.sources && g.sources.length > 0 && (
                <section className="mt-12 border-t border-sabbia pt-6" aria-labelledby="sources">
                  <h2 id="sources" className="text-[28px]">Sources</h2>
                  <p className="mt-2 text-sm text-pietra">Where the figures in this guide come from{g.checked && <>, last checked {fmt(g.checked)}</>}. Prices change: confirm before you travel.</p>
                  <ul className="mt-3 space-y-1 text-sm">
                    {g.sources.map((s) => (
                      <li key={s.url}><a href={s.url} rel="nofollow noopener" target="_blank" className="text-blu underline">{s.name}</a></li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <aside className="lg:sticky lg:top-6 lg:h-fit">
              {g.toc.length > 2 && (
                <nav aria-label="In this guide" className="rounded-2xl border border-sabbia p-5">
                  <p className="label text-pietra">In this guide</p>
                  <ol className="mt-3 space-y-2 text-sm">
                    {g.toc.map((t) => (
                      <li key={t.id}><a href={`#${t.id}`} className="hover:text-blu hover:underline">{t.text}</a></li>
                    ))}
                  </ol>
                </nav>
              )}
              <div className="mt-4 rounded-2xl bg-abisso p-5 text-white">
                <p className="font-display text-[26px] uppercase leading-none">Ask someone who lives here</p>
                <p className="mt-2 text-sm text-white/80">Tell us your dates and how many you are. A person from {city.name} answers.</p>
                <div className="mt-4"><WhatsAppButton message={`Hi, I just read "${g.h1}" and have a question.`} label="Message us on WhatsApp" /></div>
              </div>
            </aside>
          </div>
        </article>

        <FaqList faq={g.faq} title="Quick answers" />

        {related && experiences.length > 0 && (
          <section className="wrap mt-16">
            <div className="flex items-end justify-between gap-4">
              <h2 className="text-[34px] md:text-[44px]">{related.name} in {city.name}, picked by us</h2>
              <Link href={paths.section(city.slug, related.slug)} className="shrink-0 whitespace-nowrap text-sm font-bold text-blu hover:underline">See all</Link>
            </div>
            <div className="row-scroll mt-6">{experiences.map((e) => <ExperienceCard key={e.slug} e={e} />)}</div>
            {landings.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-3">
                {landings.map((l) => (
                  <li key={l.slug}><Link href={paths.section(city.slug, l.slug)} className="btn btn-ghost px-5 py-2.5 text-sm">{l.h1}</Link></li>
                ))}
              </ul>
            )}
          </section>
        )}

        {more.length > 0 && (
          <section className="wrap mt-16">
            <h2 className="text-[34px] md:text-[44px]">Read next</h2>
            <ul className="mt-6 grid gap-4 md:grid-cols-3">
              {more.map((x) => (
                <li key={x.slug} className="card p-5">
                  <h3 className="text-lg font-bold leading-snug"><Link href={paths.guide(city.slug, x.slug)} className="hover:underline">{x.h1}</Link></h3>
                  <p className="mt-2 text-sm text-pietra">{x.description}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <JsonLd data={[breadcrumbs(crumbs), article(g, here), faqPage(g.faq)]} />
    </>
  );
}
