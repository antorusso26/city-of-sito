// Lettura dei contenuti da /content. Tutto è file: città e categorie in JSON, il resto in Markdown.
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { dbCatalog } from "./catalog";

const ROOT = path.join(process.cwd(), "content");

export type Faq = { q: string; a: string };

export type City = {
  slug: string;
  name: string;
  status: "live" | "soon";
  coordinates?: string;
  tagline?: string;
  intro?: string;
  /** Riga breve per la scheda nella home City Of. */
  card?: string;
  /** Titolo della pagina città; il nome della città può stare in <em>. */
  headline?: string;
  /** Colore della città (maniglia del timone, accenti). */
  accent: string;
  /** Maniglia del timone, da 0 a 5. */
  helmSlot: number;
  hero?: string;
  heroAlt?: string;
  /** Città vicine, in ordine di vicinanza. */
  near?: string[];
};

export type Stay = {
  slug: string;
  city: string;
  kind: "hotel" | "house";
  title: string;
  summary: string;
  sleeps: string;
  /** Prezzo a notte in euro, oppure null finché non è confermato. */
  priceFrom: number | null;
  partner: string | null;
  placeholder: boolean;
  image?: string;
  html: string;
};

export type Group = {
  slug: string;
  name: string;
  summary: string;
  cities: string[];
  days: string;
};

export type Category = {
  slug: string;
  name: string;
  singular: string;
  intro: string;
};

export type Experience = {
  slug: string;
  city: string;
  category: string;
  title: string;
  summary: string;
  format: "private" | "shared";
  duration: string;
  /** Numero in euro, oppure null finché il prezzo vero non è confermato dal partner. */
  priceFrom: number | null;
  priceUnit: "per boat" | "per person" | "per vehicle" | "per group";
  departure: string;
  groupSize: string;
  partner: string | null;
  included: string[];
  notIncluded: string[];
  whyWePickedIt: string;
  faq: Faq[];
  /** true = contenuto di esempio, non ancora verificato con un partner reale. */
  placeholder: boolean;
  /** Foto della scheda (in /public). Senza foto si usa il disegno della categoria. */
  image?: string;
  html: string;
};

export type Landing = {
  slug: string;
  city: string;
  category: string;
  /** Quali esperienze mostrare. */
  format?: "private" | "shared";
  title: string;
  description: string;
  h1: string;
  lead: string;
  benefits: { title: string; text: string }[];
  faq: Faq[];
  html: string;
};

export type Guide = {
  slug: string;
  city: string;
  type: "pillar" | "local" | "practical";
  title: string;
  description: string;
  h1: string;
  updated: string;
  /** true = scaletta, non ancora scritta né verificata: non va in sitemap. */
  draft: boolean;
  /** Categoria di esperienze da proporre in fondo alla guida. */
  related?: string;
  /** Risposta breve in apertura (40-60 parole): è ciò che motori e assistenti AI citano. */
  answer?: string;
  /** Punti chiave in elenco, subito sotto la risposta. */
  keyFacts?: string[];
  /** Fonti consultate, con la data dell'ultimo controllo. */
  sources?: { name: string; url: string }[];
  checked?: string;
  /** Altre guide da leggere dopo (slug). */
  next?: string[];
  faq: Faq[];
  html: string;
  /** Indice ricavato dai titoli di sezione. */
  toc: { id: string; text: string }[];
};

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8")) as T;
}

function readMarkdownDir<T>(dir: string, extra: (slug: string, sub: string) => object): T[] {
  const base = path.join(ROOT, dir);
  if (!fs.existsSync(base)) return [];
  const out: T[] = [];
  for (const sub of fs.readdirSync(base)) {
    const subDir = path.join(base, sub);
    if (!fs.statSync(subDir).isDirectory()) continue;
    for (const file of fs.readdirSync(subDir).filter((f) => f.endsWith(".md")).sort()) {
      const { data, content } = matter(fs.readFileSync(path.join(subDir, file), "utf8"));
      const slug = file.replace(/\.md$/, "");
      out.push({ ...data, ...extra(slug, sub), html: marked.parse(content, { async: false }) } as T);
    }
  }
  return out;
}

// La sottocartella è la città: content/experiences/sorrento/…
const byCity = (slug: string, city: string) => ({ slug, city });

export const getCities = () => readJson<City[]>("cities.json");
export const getCity = (slug: string) => getCities().find((c) => c.slug === slug);
export const getLiveCities = () => getCities().filter((c) => c.status === "live");

export const getCategories = () => readJson<Category[]>("categories.json");
export const getCategory = (slug: string) => getCategories().find((c) => c.slug === slug);

// Esperienze, alberghi e case: dal database se Supabase è configurato (vedi catalog.ts), altrimenti dai file.
const allExperiences = () => dbCatalog()?.experiences ?? readMarkdownDir<Experience>("experiences", byCity);
const allStays = () => dbCatalog()?.stays ?? readMarkdownDir<Stay>("stays", byCity);

export const getExperiences = (city?: string, category?: string) =>
  allExperiences().filter(
    (e) => (!city || e.city === city) && (!category || e.category === category),
  );
export const getExperience = (city: string, category: string, slug: string) =>
  getExperiences(city, category).find((e) => e.slug === slug);

export const getLandings = (city?: string) =>
  readMarkdownDir<Landing>("landings", byCity).filter((l) => !city || l.city === city);
export const getLanding = (city: string, slug: string) => getLandings(city).find((l) => l.slug === slug);

const slugify = (t: string) => t.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Aggiunge un id a ogni titolo di sezione e ne ricava l'indice della guida. */
function withToc(g: Omit<Guide, "toc">): Guide {
  const toc: Guide["toc"] = [];
  const html = g.html.replace(/<h2>(.*?)<\/h2>/g, (_m, inner: string) => {
    const id = slugify(inner);
    toc.push({ id, text: inner.replace(/<[^>]+>/g, "") });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { ...g, html, toc };
}

export const getGuides = (city?: string) =>
  readMarkdownDir<Omit<Guide, "toc">>("guides", byCity).filter((g) => !city || g.city === city).map(withToc);
export const getGuide = (city: string, slug: string) => getGuides(city).find((g) => g.slug === slug);

/** Categorie che hanno almeno un'esperienza in una città. */
export const getCityCategories = (city: string) =>
  getCategories().filter((c) => getExperiences(city, c.slug).length > 0);

export const getStays = (city?: string) =>
  allStays().filter((s) => !city || s.city === city);

export const getGroups = () => readJson<Group[]>("groups.json");

/** Città in ordine di maniglia sul timone. */
export const getHelmCities = () => [...getCities()].sort((a, b) => a.helmSlot - b.helmSlot);

export const nightPrice = (s: Pick<Stay, "priceFrom">) =>
  s.priceFrom === null ? "[PRICE] per night" : `€${s.priceFrom.toLocaleString("en-GB")} per night`;

export function formatPrice(e: Pick<Experience, "priceFrom" | "priceUnit">): string {
  return e.priceFrom === null ? `[PRICE] ${e.priceUnit}` : `€${e.priceFrom.toLocaleString("en-GB")} ${e.priceUnit}`;
}
