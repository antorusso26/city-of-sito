// Impostazioni del sito. Tutto ciò che cambia tra mockup e lancio sta qui o nelle variabili d'ambiente.

export const SITE_NAME = "City Of";
export const AREA = { slug: "amalfi-coast", name: "Amalfi Coast" } as const;

/** Indirizzo pubblico. Su Vercel usa l'indirizzo del mockup finché non c'è un dominio. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "http://localhost:3000"
).replace(/\/$/, "");

/** Finché è un mockup con contenuti segnaposto, i motori di ricerca non devono indicizzarlo. */
export const INDEXABLE = process.env.NEXT_PUBLIC_INDEXABLE === "true";

/** Numero WhatsApp in formato internazionale senza "+", es. 39333xxxxxxx. Vuoto = non ancora attivo. */
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

export function whatsappLink(message: string): string | null {
  if (!WHATSAPP_NUMBER) return null;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const abs = (path: string) => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

// Percorsi: un solo posto dove si decide la forma degli indirizzi.
export const paths = {
  home: () => "/",
  area: () => `/${AREA.slug}`,
  city: (city: string) => `/${AREA.slug}/${city}`,
  section: (city: string, section: string) => `/${AREA.slug}/${city}/${section}`,
  experience: (city: string, category: string, slug: string) => `/${AREA.slug}/${city}/${category}/${slug}`,
  guides: (city: string) => `/${AREA.slug}/${city}/guides`,
  guide: (city: string, slug: string) => `/${AREA.slug}/${city}/guides/${slug}`,
  stay: (city: string, slug: string) => `/${AREA.slug}/${city}/stay/${slug}`,
  /** Richiesta di prenotazione. Voci: "exp:città/categoria/slug" oppure "stay:città/slug". */
  request: (items: string[], people?: number) =>
    `/request?items=${encodeURIComponent(items.join(","))}${people ? `&people=${people}` : ""}`,
};
