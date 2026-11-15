// Piccoli adattatori dai contenuti ai componenti (schede città, pacchetto).
import type { CityChip } from "@/components/CityParts";
import type { PkgCity } from "@/components/PackageBuilder";
import { type City, getExperiences, getLiveCities } from "./content";
import { paths } from "./site";

export const chip = (c: City): CityChip => ({
  slug: c.slug, name: c.name, accent: c.accent, href: paths.city(c.slug), coordinates: c.coordinates, hero: c.hero,
  count: getExperiences(c.slug).length,
});

export function packageCities(slugs: string[]): PkgCity[] {
  const live = getLiveCities();
  return slugs.flatMap((s) => live.filter((c) => c.slug === s)).map((c) => ({
    slug: c.slug, name: c.name, accent: c.accent, coordinates: c.coordinates,
    items: getExperiences(c.slug).map((e) => ({
      key: `exp:${e.city}/${e.category}/${e.slug}`, title: e.title, duration: e.duration, priceFrom: e.priceFrom, priceUnit: e.priceUnit,
    })),
  }));
}
