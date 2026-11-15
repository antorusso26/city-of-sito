// Pagina d'area Amalfi Coast: il timone e la scelta della città, poi dove lavoriamo,
// dove dormire, il pacchetto e perché fidarsi.
import type { Metadata } from "next";
import Link from "next/link";
import { CityPicker, CityTiles } from "@/components/CityParts";
import { FloatingNav } from "@/components/FloatingNav";
import { Footer } from "@/components/Footer";
import { Helm, type HelmCity } from "@/components/Helm";
import { PackageBuilder } from "@/components/PackageBuilder";
import { Trust } from "@/components/Trust";
import { getGroups, getHelmCities, getLiveCities } from "@/lib/content";
import { paths } from "@/lib/site";
import { chip, packageCities } from "@/lib/view";

export const metadata: Metadata = {
  title: "Amalfi Coast: things to do and places to stay, picked by locals",
  description: "Sorrento, Positano, Amalfi and Capri, city by city. Boats, tables, drivers, guides and hotels chosen by people who live here, with the price shown first.",
  alternates: { canonical: "/amalfi-coast" },
};

export default function AreaPage() {
  const helm: (HelmCity | undefined)[] = [];
  for (const c of getHelmCities()) {
    helm[c.helmSlot] = { slug: c.slug, name: c.name, accent: c.accent, live: c.status === "live", coordinates: c.coordinates, href: paths.city(c.slug) };
  }
  const live = getLiveCities();
  const chips = live.map(chip);
  const group = getGroups()[0];

  return (
    <>
      <FloatingNav />
      <main>
        <section className="co-home-hero">
          <div className="wrap co-hh">
            <div className="co-hh-copy">
              <p className="co-eyebrow">City Of · Amalfi Coast</p>
              <h1 className="co-home-title">Turn the helm. Choose your coast.</h1>
              <p className="co-sub">We grew up on this coast. We know the skipper, the cook, the driver and the guide, and we book them for you. Pick a town on the helm.</p>
            </div>
            <Helm cities={helm} />
          </div>
          <div className="wrap">
            <ul className="co-promise">
              <li><b>Local</b>We live here. Every partner is someone we know by name.</li>
              <li><b>Price first</b>What it costs and what&apos;s included, before you ask.</li>
              <li><b>One contact</b>Boats, tables, drivers, guides, hotels. One person books them.</li>
            </ul>
            <CityPicker cities={chips} />
          </div>
        </section>

        <section className="wrap co-section" id="cities">
          <h2 className="co-h2">Where we work</h2>
          <p className="co-status">Four places on the Amalfi Coast for now. Each one has its own local partners. More cities are coming.</p>
          <CityTiles cities={chips} />
          <div className="co-stay-teaser">
            <h3 className="co-h3">Where to stay</h3>
            <p className="co-status">Hotels and houses, two or three per town. Ask us and we check the dates with the owner.</p>
            <div className="co-st-links">
              {live.map((c) => <Link key={c.slug} href={`${paths.city(c.slug)}#stay`}>{c.name} ›</Link>)}
            </div>
          </div>
        </section>

        {group && <PackageBuilder name={group.name} summary={group.summary} cities={packageCities(group.cities)} />}
        <Trust />
      </main>
      <Footer />
    </>
  );
}
