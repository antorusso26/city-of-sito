// Dati strutturati (JSON-LD) per motori di ricerca e assistenti AI.
// Regola: si dichiara solo ciò che è vero e visibile in pagina. Niente recensioni o prezzi inventati.
import type { Experience, Faq, Guide } from "./content";
import { SITE_NAME, abs } from "./site";

type Json = Record<string, unknown>;

export const organization = (): Json => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": abs("/#organization"),
  name: SITE_NAME,
  url: abs("/"),
  logo: abs("/icon-512.png"),
  slogan: "Turn the helm. Choose your coast.",
});

export const website = (): Json => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": abs("/#website"),
  name: SITE_NAME,
  url: abs("/"),
  publisher: { "@id": abs("/#organization") },
  inLanguage: "en",
});

export const breadcrumbs = (items: { name: string; path: string }[]): Json => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
});

export const faqPage = (faq: Faq[]): Json | null =>
  faq.length === 0
    ? null
    : {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      };

export const itemList = (name: string, items: { name: string; path: string }[]): Json => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name,
  itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, url: abs(it.path) })),
});

export function experience(e: Experience, pagePath: string, cityName: string): Json {
  const out: Json = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: e.title,
    description: e.summary,
    url: abs(pagePath),
    touristType: e.format === "private" ? "Private group" : "Small shared group",
    itinerary: { "@type": "Place", name: e.departure, address: { "@type": "PostalAddress", addressLocality: cityName, addressCountry: "IT" } },
  };
  // Partner e prezzo entrano nei dati strutturati solo quando sono reali.
  if (e.partner) out.provider = { "@type": "LocalBusiness", name: e.partner };
  if (e.priceFrom !== null) {
    out.offers = { "@type": "Offer", price: e.priceFrom, priceCurrency: "EUR", url: abs(pagePath), availability: "https://schema.org/InStock" };
  }
  return out;
}

export const article = (g: Guide, pagePath: string): Json => ({
  "@context": "https://schema.org",
  "@type": "Article",
  headline: g.h1,
  description: g.description,
  dateModified: g.updated,
  inLanguage: "en",
  mainEntityOfPage: abs(pagePath),
  author: { "@id": abs("/#organization") },
  publisher: { "@id": abs("/#organization") },
});
