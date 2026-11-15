// Scheda di un albergo o di una casa: foto, cosa offre, prezzo a notte, chi lo gestisce, richiesta.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StayCards } from "@/components/Stays";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { getCity, getLiveCities, getStays, nightPrice } from "@/lib/content";
import { AREA, paths } from "@/lib/site";

type Props = { params: Promise<{ city: string; slug: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => getLiveCities().flatMap((c) => getStays(c.slug).map((s) => ({ city: c.slug, slug: s.slug })));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, slug } = await params;
  const s = getStays(city).find((x) => x.slug === slug);
  const c = getCity(city);
  if (!s || !c) return {};
  return { title: `${s.title}, ${c.name}`, description: s.summary, alternates: { canonical: paths.stay(city, slug) } };
}

export default async function StayPage({ params }: Props) {
  const { city: citySlug, slug } = await params;
  const city = getCity(citySlug);
  const s = getStays(citySlug).find((x) => x.slug === slug);
  if (!city || !s) notFound();
  const crumbs = [
    { name: "City Of", path: paths.home() },
    { name: AREA.name, path: paths.area() },
    { name: city.name, path: paths.city(city.slug) },
    { name: s.title, path: paths.stay(city.slug, s.slug) },
  ];
  const request = paths.request([`stay:${city.slug}/${s.slug}`]);

  return (
    <>
      <Breadcrumbs items={crumbs} />
      <main className="pb-24">
        <section className="wrap grid gap-10 pt-6 md:grid-cols-[1fr_340px]">
          <div>
            {s.image && <img src={s.image} alt="" className="co-exp-photo mb-8" />}
            <p className="label text-citta-chiaro">{s.kind === "hotel" ? "Hotel" : "House"} · {city.name}</p>
            <h1 className="mt-3 text-[44px] md:text-[64px]">{s.title}</h1>
            <p className="mt-5 max-w-2xl text-lg text-pietra">{s.summary}</p>
            {s.html && <div className="prose mt-10" dangerouslySetInnerHTML={{ __html: s.html }} />}
          </div>
          <aside className="card h-fit p-6 md:sticky md:top-24">
            <p className="text-sm text-pietra">From</p>
            <p className="text-3xl font-semibold">{nightPrice(s)}</p>
            <dl className="mt-5 space-y-3 text-sm">
              <div><dt className="text-pietra">Sleeps</dt><dd>{s.sleeps || "[SLEEPS]"}</dd></div>
              <div><dt className="text-pietra">Run by</dt><dd>{s.partner ?? (s.kind === "hotel" ? "[HOTEL NAME]" : "[HOST NAME]")}</dd></div>
            </dl>
            <div className="mt-6 space-y-3">
              <Link href={request} className="btn btn-blu w-full">Ask for these dates</Link>
              <WhatsAppButton message={`Hi, I'm looking at "${s.title}" in ${city.name}. Dates: … People: …`} label="Ask on WhatsApp" variant="dark" />
            </div>
            <p className="mt-3 text-xs text-pietra">We check the dates with the owner and send you the total before you pay anything.</p>
          </aside>
        </section>
        <div className="wrap"><StayCards stays={getStays(city.slug).filter((x) => x.slug !== s.slug)} cityName={city.name} /></div>
      </main>
    </>
  );
}
