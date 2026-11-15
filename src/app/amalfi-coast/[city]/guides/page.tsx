// Indice delle guide di una città: pillar, pagine locali, informazioni pratiche.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { getCity, getGuides, getLiveCities, type Guide } from "@/lib/content";
import { breadcrumbs } from "@/lib/schema";
import { AREA, paths } from "@/lib/site";

type Props = { params: Promise<{ city: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => getLiveCities().map((c) => ({ city: c.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCity((await params).city);
  if (!city) return {};
  return {
    title: `${city.name} travel guides, written by locals`,
    description: `What things cost, how to get around and what is worth your time in ${city.name}. Practical guides by people who live here.`,
    alternates: { canonical: paths.guides(city.slug) },
  };
}

const GROUPS: { type: Guide["type"]; title: string; text: string }[] = [
  { type: "pillar", title: "Start here", text: "The long guides. Read one and you can plan the whole day." },
  { type: "local", title: "Around town", text: "Marinas, beaches and corners of town, one page each." },
  { type: "practical", title: "Getting around", text: "Ferries, buses, trains and transfers." },
];

export default async function GuidesIndex({ params }: Props) {
  const city = getCity((await params).city);
  if (!city) notFound();
  const guides = getGuides(city.slug);
  const crumbs = [
    { name: "City Of", path: paths.home() },
    { name: AREA.name, path: paths.area() },
    { name: city.name, path: paths.city(city.slug) },
    { name: "Guides", path: paths.guides(city.slug) },
  ];
  return (
    <>
      <Breadcrumbs items={crumbs} />
      <main className="wrap">
        <h1 className="mt-10 text-6xl">{city.name} guides</h1>
        <p className="mt-4 max-w-2xl text-lg text-pietra">Written by people who live here. Prices and timetables are checked, and every guide shows the date it was last updated.</p>
        {GROUPS.map((g) => {
          const list = guides.filter((x) => x.type === g.type);
          if (list.length === 0) return null;
          return (
            <section key={g.type} className="mt-14">
              <h2 className="text-4xl">{g.title}</h2>
              <p className="mt-2 text-pietra">{g.text}</p>
              <ul className="mt-6 grid gap-4 md:grid-cols-3">
                {list.map((x) => (
                  <li key={x.slug} className="card p-5">
                    <h3 className="font-display text-2xl leading-7"><Link href={paths.guide(city.slug, x.slug)}>{x.h1}</Link></h3>
                    <p className="mt-2 text-sm text-pietra">{x.description}</p>
                    {x.draft && <p className="label mt-3 text-citta-chiaro">Outline</p>}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>
      <JsonLd data={[breadcrumbs(crumbs)]} />
    </>
  );
}
