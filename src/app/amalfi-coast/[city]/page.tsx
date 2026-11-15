// Pagina di una città: la nostra apertura con la foto e la scelta delle città, poi il catalogo a schede di Luigi,
// dove dormire, le altre città della costa e il rimando al pacchetto.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CityPicker, CityTiles } from "@/components/CityParts";
import { CitySections } from "@/components/CitySections";
import { JsonLd } from "@/components/JsonLd";
import { StayCards } from "@/components/Stays";
import { getCity, getExperiences, getLiveCities, getStays } from "@/lib/content";
import { breadcrumbs, itemList } from "@/lib/schema";
import { AREA, paths } from "@/lib/site";
import { chip } from "@/lib/view";

type Props = { params: Promise<{ city: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => getLiveCities().map((c) => ({ city: c.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCity((await params).city);
  if (!city) return {};
  return {
    title: `${city.name}: things to do and places to stay, picked by locals`,
    description: `Things to do in ${city.name}, chosen by people who live here. Full price shown before you book, and the local partner named on every page.`,
    alternates: { canonical: paths.city(city.slug) },
  };
}

export default async function CityPage({ params }: Props) {
  const city = getCity((await params).city);
  if (!city) notFound();
  const live = getLiveCities();
  const experiences = getExperiences(city.slug);
  const near = (city.near ?? []).flatMap((s) => live.filter((c) => c.slug === s));
  const others = [...near, ...live.filter((c) => c.slug !== city.slug && !near.includes(c))];
  const crumbs = [
    { name: "City Of", path: paths.home() },
    { name: AREA.name, path: paths.area() },
    { name: city.name, path: paths.city(city.slug) },
  ];

  return (
    <>
      <main>
        <section className="co-city-hero">
          {city.hero && <img className="co-city-photo" src={city.hero} alt={city.heroAlt ?? ""} />}
          <div className="wrap co-city-copy">
            <p className="co-eyebrow">{city.coordinates}</p>
            <h1 className="co-city-title" dangerouslySetInnerHTML={{ __html: city.headline ?? city.name }} />
            <p className="co-sub">{city.intro}</p>
            <CityPicker cities={live.map(chip)} active={city.slug} near={near.map(chip)} />
          </div>
        </section>
        <div className="co-crumbs"><Breadcrumbs items={crumbs} /></div>

        <CitySections city={city} heading="h2" intro={false} otherCoasts={false} />

        <div className="wrap">
          <StayCards stays={getStays(city.slug)} cityName={city.name} />
          <section className="co-also">
            <h2 className="co-h2">Also on the coast</h2>
            <CityTiles cities={others.map(chip)} small />
          </section>
          <Link className="co-pkg-link" href="/amalfi-coast#package">
            <span><b>{city.name}</b> is part of the Amalfi Coast package.</span><span>Build it ›</span>
          </Link>
        </div>
      </main>
      <JsonLd data={[breadcrumbs(crumbs), itemList(`Things to do in ${city.name}`, experiences.map((e) => ({ name: e.title, path: paths.experience(e.city, e.category, e.slug) })))]} />
    </>
  );
}
