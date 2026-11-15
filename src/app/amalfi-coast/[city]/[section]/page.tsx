// Una "sezione" è una categoria (boat-tours) oppure una landing mirata (private-boat-tours).
// Le landing sono le pagine d'arrivo degli annunci: un pubblico, una promessa, un invito.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ExperienceCard } from "@/components/ExperienceCard";
import { FaqList } from "@/components/FaqList";
import { JsonLd } from "@/components/JsonLd";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getCategory, getCity, getCityCategories, getExperiences, getGuides, getLanding, getLandings, getLiveCities } from "@/lib/content";
import { breadcrumbs, faqPage, itemList } from "@/lib/schema";
import { AREA, paths } from "@/lib/site";

type Props = { params: Promise<{ city: string; section: string }> };

export const dynamicParams = false;
export const generateStaticParams = () =>
  getLiveCities().flatMap((c) => [
    ...getCityCategories(c.slug).map((cat) => ({ city: c.slug, section: cat.slug })),
    ...getLandings(c.slug).map((l) => ({ city: c.slug, section: l.slug })),
  ]);

function resolve(citySlug: string, section: string) {
  const city = getCity(citySlug);
  if (!city) return null;
  const landing = getLanding(citySlug, section);
  const category = getCategory(landing ? landing.category : section);
  if (!category) return null;
  const experiences = getExperiences(citySlug, category.slug).filter((e) => !landing?.format || e.format === landing.format);
  return { city, landing, category, experiences };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, section } = await params;
  const r = resolve(city, section);
  if (!r) return {};
  return {
    title: r.landing?.title ?? `${r.category.name} in ${r.city.name}: prices and what is included`,
    description: r.landing?.description ?? `${r.category.name} in ${r.city.name}, picked by locals. Full price shown before you book, local partner named on every page.`,
    alternates: { canonical: paths.section(city, section) },
  };
}

export default async function SectionPage({ params }: Props) {
  const { city: citySlug, section } = await params;
  const r = resolve(citySlug, section);
  if (!r) notFound();
  const { city, landing, category, experiences } = r;

  const crumbs = [
    { name: "City Of", path: paths.home() },
    { name: AREA.name, path: paths.area() },
    { name: city.name, path: paths.city(city.slug) },
    { name: category.name, path: paths.section(city.slug, category.slug) },
    ...(landing ? [{ name: landing.h1, path: paths.section(city.slug, landing.slug) }] : []),
  ];
  const h1 = landing?.h1 ?? `${category.name} in ${city.name}`;
  const siblings = getLandings(city.slug).filter((l) => l.category === category.slug && l.slug !== landing?.slug);
  const guides = getGuides(city.slug).filter((g) => g.related === category.slug);
  const message = `Hi, I'm looking at ${h1.toLowerCase()} from ${city.name}.`;

  return (
    <>
      <Breadcrumbs items={crumbs} />
      <main>
        <section className="wrap pt-10">
          <p className="label text-citta-chiaro">City of {city.name}</p>
          <h1 className="mt-3 max-w-3xl text-6xl">{h1}</h1>
          <p className="mt-5 max-w-2xl text-lg text-pietra">{landing?.lead ?? category.intro}</p>
          {landing && (
            <div className="mt-7 flex flex-wrap gap-3">
              <WhatsAppButton message={message} />
              <a href="#options" className="btn btn-ghost">See prices</a>
            </div>
          )}
        </section>

        {landing && landing.benefits.length > 0 && (
          <section className="wrap mt-14 grid gap-5 md:grid-cols-3">
            {landing.benefits.map((b) => (
              <div key={b.title} className="card p-5">
                <h2 className="font-text text-xl font-semibold leading-6">{b.title}</h2>
                <p className="mt-2 text-pietra">{b.text}</p>
              </div>
            ))}
          </section>
        )}

        <section id="options" className="wrap mt-14 scroll-mt-6">
          <h2 className="text-4xl">{landing ? "Your options, with full prices" : `${experiences.length} picked by us`}</h2>
          <p className="mt-2 max-w-2xl text-pietra">We list few on purpose. Each one is run by a partner we know, and the price you see is the price you pay.</p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {experiences.map((e) => <ExperienceCard key={e.slug} e={e} />)}
          </div>
          {!landing && siblings.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-3">
              {siblings.map((l) => (
                <li key={l.slug}><Link href={paths.section(city.slug, l.slug)} className="btn btn-ghost px-5 py-2.5">{l.h1}</Link></li>
              ))}
            </ul>
          )}
        </section>

        {landing?.html && (
          <section className="wrap mt-14">
            <div className="prose" dangerouslySetInnerHTML={{ __html: landing.html }} />
          </section>
        )}

        {guides.length > 0 && (
          <section className="wrap mt-14">
            <h2 className="text-4xl">Before you choose</h2>
            <ul className="mt-5 space-y-2">
              {guides.map((g) => (
                <li key={g.slug}><Link href={paths.guide(city.slug, g.slug)} className="text-lg text-mare underline">{g.h1}</Link></li>
              ))}
            </ul>
          </section>
        )}

        <FaqList faq={landing?.faq ?? []} />

        <section className="wrap mt-16">
          <div className="rounded-[4px] bg-abisso p-8 text-calce md:p-12">
            <h2 className="text-4xl">Not sure which one fits?</h2>
            <p className="mt-3 max-w-xl text-sabbia">Tell us how many you are and which day. A person from {city.name} answers.</p>
            <div className="mt-6"><WhatsAppButton message={message} /></div>
          </div>
        </section>
      </main>
      <JsonLd
        data={[
          breadcrumbs(crumbs),
          itemList(h1, experiences.map((e) => ({ name: e.title, path: paths.experience(e.city, e.category, e.slug) }))),
          faqPage(landing?.faq ?? []),
        ]}
      />
    </>
  );
}
