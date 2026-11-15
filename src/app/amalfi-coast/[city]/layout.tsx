// Cornice comune a tutte le pagine di una città: colore città, intestazione, piè di pagina.
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { FloatingNav } from "@/components/FloatingNav";
import { getCity, getCityCategories } from "@/lib/content";

export default async function CityLayout({ children, params }: { children: React.ReactNode; params: Promise<{ city: string }> }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city || city.status !== "live") notFound();
  return (
    <div data-city={city.slug} className="relative">
      <FloatingNav city={city.slug} cityName={city.name} categories={getCityCategories(city.slug)} />
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[88px] bg-crema" />
      {children}
      <Footer city={city.slug} />
    </div>
  );
}
