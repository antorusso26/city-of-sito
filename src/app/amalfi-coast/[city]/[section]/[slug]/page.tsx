// Scheda di un'esperienza: prezzo completo in alto, cosa è incluso e cosa no, chi la eroga, perché l'abbiamo scelta.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ExperienceCard } from "@/components/ExperienceCard";
import { FaqList } from "@/components/FaqList";
import { JsonLd } from "@/components/JsonLd";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { formatPrice, getCategory, getCity, getExperience, getExperiences, getLiveCities } from "@/lib/content";
import { breadcrumbs, experience as experienceSchema, faqPage } from "@/lib/schema";
import { AREA, paths } from "@/lib/site";

type Props = { params: Promise<{ city: string; section: string; slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () =>
  getLiveCities().flatMap((c) => getExperiences(c.slug).map((e) => ({ city: c.slug, section: e.category, slug: e.slug })));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, section, slug } = await params;
  const e = getExperience(city, section, slug);
  const c = getCity(city);
  if (!e || !c) return {};
  return {
    title: `${e.title} from ${c.name}: price and what is included`,
    description: e.summary,
    alternates: { canonical: paths.experience(city, section, slug) },
  };
}

export default async function ExperiencePage({ params }: Props) {
  const { city: citySlug, section, slug } = await params;
  const city = getCity(citySlug);
  const category = getCategory(section);
  const e = getExperience(citySlug, section, slug);
  if (!city || !category || !e) notFound();

  const here = paths.experience(city.slug, category.slug, e.slug);
  const crumbs = [
    { name: "City Of", path: paths.home() },
    { name: AREA.name, path: paths.area() },
    { name: city.name, path: paths.city(city.slug) },
    { name: category.name, path: paths.section(city.slug, category.slug) },
    { name: e.title, path: here },
  ];
  const others = getExperiences(city.slug, category.slug).filter((o) => o.slug !== e.slug).slice(0, 3);
  const message = `Hi, I'd like to ask about "${e.title}" from ${city.name}. Date: … People: …`;
  const request = paths.request([`exp:${city.slug}/${category.slug}/${e.slug}`]);

  return (
    <>
      <Breadcrumbs items={crumbs} />
      <main className="pb-24 md:pb-0">
        <section className="wrap grid gap-10 pt-6 md:grid-cols-[1fr_340px]">
          <div>
            {e.image && <img src={e.image} alt="" className="co-exp-photo mb-8" />}
            <p className="label text-citta-chiaro">{e.format === "private" ? "Private" : "Shared, small group"} · {e.duration}</p>
            <h1 className="mt-3 text-[44px] md:text-[64px]">{e.title}</h1>
            <p className="mt-5 max-w-2xl text-lg text-pietra">{e.summary}</p>

            <h2 className="mt-12 text-4xl">Why we picked it</h2>
            <p className="mt-3 max-w-2xl">{e.whyWePickedIt}</p>

            <div className="mt-12 grid gap-8 md:grid-cols-2">
              <div>
                <h2 className="text-3xl">Included in the price</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5">{e.included.map((i) => <li key={i}>{i}</li>)}</ul>
              </div>
              <div>
                <h2 className="text-3xl">Not included</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-pietra">{e.notIncluded.map((i) => <li key={i}>{i}</li>)}</ul>
              </div>
            </div>

            {e.html && <div className="prose mt-12" dangerouslySetInnerHTML={{ __html: e.html }} />}
          </div>

          {/* Riquadro prezzo: resta in vista mentre si scorre. */}
          <aside className="card h-fit p-6 md:sticky md:top-24">
            <p className="text-sm text-pietra">From</p>
            <p className="text-3xl font-semibold">{formatPrice(e)}</p>
            <dl className="mt-5 space-y-3 text-sm">
              <div><dt className="text-pietra">Duration</dt><dd>{e.duration}</dd></div>
              <div><dt className="text-pietra">Leaves from</dt><dd>{e.departure}</dd></div>
              <div><dt className="text-pietra">Group</dt><dd>{e.groupSize}</dd></div>
              <div><dt className="text-pietra">Run by</dt><dd>{e.partner ?? "[PARTNER]"}</dd></div>
            </dl>
            <div id="book" className="mt-6 scroll-mt-28 space-y-3">
              <Link href={request} className="btn btn-blu w-full">Request this date</Link>
              <WhatsAppButton message={message} label="Ask on WhatsApp" variant="dark" />
            </div>
            <p className="mt-3 text-xs text-pietra">A person answers. You pay a deposit to hold the date and the balance to the partner on the day.</p>
          </aside>
        </section>

        <FaqList faq={e.faq} />

        {/* Su telefono prezzo e invito restano sempre a portata di dito. */}
        <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t-2 border-abisso bg-white px-4 py-3 md:hidden">
          <p className="min-w-0 text-sm leading-tight">From<br /><strong className="text-lg">{formatPrice(e)}</strong></p>
          <Link href={request} className="btn btn-city shrink-0">Request this date</Link>
        </div>

        {others.length > 0 && (
          <section className="wrap mt-16">
            <h2 className="text-4xl">Other {category.name.toLowerCase()} in {city.name}</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">{others.map((o) => <ExperienceCard key={o.slug} e={o} />)}</div>
            <Link href={paths.section(city.slug, category.slug)} className="mt-5 inline-block font-semibold text-mare underline">See all {category.name.toLowerCase()}</Link>
          </section>
        )}
      </main>
      <JsonLd data={[breadcrumbs(crumbs), experienceSchema(e, here, city.name), faqPage(e.faq)]} />
    </>
  );
}
