// Catalogo (esperienze, alberghi e case) dal database Supabase, quando è configurato.
// Senza variabili, o se il database non risponde, content.ts usa i file in content/ come prima.
// Il catalogo si carica una volta all'avvio del server (o della build) e si rinnova in background ogni minuto:
// le funzioni di content.ts restano sincrone e tutte le pagine funzionano senza modifiche.
import { createClient } from "@supabase/supabase-js";
import { marked } from "marked";
import type { Experience, Faq, Stay } from "./content";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** true = il catalogo viene dal database. CATALOG_SOURCE=files forza i file anche con Supabase configurato. */
export const catalogFromDb = Boolean(URL && ANON) && process.env.CATALOG_SOURCE !== "files";

type Catalog = { experiences: Experience[]; stays: Stay[]; at: number };

const TTL = 60_000;
let current: Catalog | null = null;
let loading: Promise<void> | null = null;
let lastTry = 0;

/** Foto in Storage (bucket "listings"). Un percorso che inizia con "/" resta un file di public/.
 *  Se il bucket non ha ancora le foto, si usa la copia con lo stesso nome in public/photos/. */
export function photoUrl(path: string, inStorage = true): string {
  if (path.startsWith("/") || path.startsWith("http")) return path;
  if (!inStorage) return `/photos/${path}`;
  return `${URL}/storage/v1/object/public/listings/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/** Controlla una foto a campione: se manca in Storage, le foto si servono da public/photos/. */
async function storageHasPhotos(rows: Row[]): Promise<boolean> {
  const sample = rows.flatMap((r) => r.listing_photos ?? []).find((p) => !p.path.startsWith("/"));
  if (!sample) return true;
  try {
    const res = await fetch(photoUrl(sample.path), { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

const UNIT: Record<string, Experience["priceUnit"]> = {
  per_boat: "per boat", per_person: "per person", per_car: "per vehicle", per_group: "per group",
};

type Row = {
  kind: "experience" | "stay";
  slug: string;
  title: string;
  summary: string | null;
  body_md: string | null;
  why_we_picked: string | null;
  includes: string[];
  excludes: string[];
  meeting_point: string | null;
  price_cents: number | null;
  price_unit: string;
  details: Record<string, unknown> | null;
  is_sample: boolean;
  position: number;
  cities: { slug: string } | null;
  categories: { slug: string } | null;
  partners: { name: string } | null;
  listing_photos: { path: string; position: number }[];
};

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);

function toCatalog(rows: Row[], inStorage: boolean): Catalog {
  const sorted = [...rows].sort((a, b) =>
    (a.cities?.slug ?? "").localeCompare(b.cities?.slug ?? "") || a.position - b.position || a.slug.localeCompare(b.slug));
  const experiences: Experience[] = [];
  const stays: Stay[] = [];
  for (const r of sorted) {
    const d = r.details ?? {};
    const photo = [...(r.listing_photos ?? [])].sort((a, b) => a.position - b.position)[0];
    const base = {
      slug: r.slug,
      city: r.cities?.slug ?? "",
      title: r.title,
      summary: r.summary ?? "",
      priceFrom: r.price_cents === null ? null : r.price_cents / 100,
      // Il nome si vede solo per i partner attivi (vista pubblica); altrimenti resta il segnaposto.
      partner: r.partners?.name ?? null,
      placeholder: r.is_sample,
      image: photo ? photoUrl(photo.path, inStorage) : undefined,
      html: marked.parse(r.body_md ?? "", { async: false }),
    };
    if (r.kind === "stay") {
      stays.push({ ...base, kind: r.categories?.slug === "hotels" ? "hotel" : "house", sleeps: str(d.sleeps) });
    } else {
      experiences.push({
        ...base,
        category: r.categories?.slug ?? "",
        format: d.format === "shared" ? "shared" : "private",
        duration: str(d.duration),
        priceUnit: (str(d.priceUnit) as Experience["priceUnit"]) || UNIT[r.price_unit] || "per group",
        departure: str(d.departure, r.meeting_point ?? ""),
        groupSize: str(d.groupSize),
        included: r.includes ?? [],
        notIncluded: r.excludes ?? [],
        whyWePickedIt: r.why_we_picked ?? "",
        faq: Array.isArray(d.faq) ? (d.faq as Faq[]) : [],
      });
    }
  }
  return { experiences, stays, at: Date.now() };
}

async function fetchCatalog(): Promise<Catalog> {
  const sb = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb
    .from("listings")
    .select("kind, slug, title, summary, body_md, why_we_picked, includes, excludes, meeting_point, price_cents, price_unit, details, is_sample, position, cities!inner(slug), categories(slug), partners(name), listing_photos(path, position)")
    .eq("status", "published");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as unknown as Row[];
  return toCatalog(rows, await storageHasPhotos(rows));
}

async function refresh() {
  lastTry = Date.now();
  try {
    current = await fetchCatalog();
  } catch (e) {
    console.warn(`[catalog] database not reachable, using content/ files: ${(e as Error).message}`);
  } finally {
    loading = null;
  }
}

if (catalogFromDb) await refresh();

/** Il catalogo del database, oppure null (si usano i file). Se è vecchio di più di un minuto si rinnova in background. */
export function dbCatalog(): Catalog | null {
  if (!catalogFromDb) return null;
  if (!loading && Date.now() - (current?.at ?? lastTry) > TTL) loading = refresh();
  return current;
}
