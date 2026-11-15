// Mappa del sito generata dai contenuti. Le scalette (draft) restano fuori.
import type { MetadataRoute } from "next";
import { getCityCategories, getExperiences, getGuides, getLandings, getLiveCities } from "@/lib/content";
import { abs, paths } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const urls: MetadataRoute.Sitemap = [{ url: abs(paths.home()) }, { url: abs(paths.area()) }];
  for (const c of getLiveCities()) {
    urls.push({ url: abs(paths.city(c.slug)) }, { url: abs(paths.guides(c.slug)) });
    for (const cat of getCityCategories(c.slug)) urls.push({ url: abs(paths.section(c.slug, cat.slug)) });
    for (const l of getLandings(c.slug)) urls.push({ url: abs(paths.section(c.slug, l.slug)) });
    for (const e of getExperiences(c.slug)) urls.push({ url: abs(paths.experience(c.slug, e.category, e.slug)) });
    for (const g of getGuides(c.slug).filter((x) => !x.draft)) urls.push({ url: abs(paths.guide(c.slug, g.slug)), lastModified: g.updated });
  }
  return urls;
}
