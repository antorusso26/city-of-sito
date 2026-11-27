import Link from "next/link";
import type { Category } from "@/lib/content";
import { getLiveCities } from "@/lib/content";
import { paths } from "@/lib/site";
import { Wordmark } from "./Veil";

/**
 * Barra in alto, uguale su tutte le pagine, nell'ordine in cui si prenota:
 * Home → Cities (scegli la città) → Experiences (scegli cosa) → Package (tutta la costa) → Book.
 * I menu sono <details>: si aprono anche senza JavaScript.
 */
export function FloatingNav({ city, cityName }: { city?: string; cityName?: string; categories?: Category[] }) {
  const cities = getLiveCities();
  return (
    <nav aria-label="Main" className="co-nav">
      <Link href={paths.home()} aria-label="City Of, home" className="co-nav-logo"><Wordmark className="co-nav-mark" /></Link>
      {cityName && city && <Link href={paths.city(city)} className="co-nav-city">{cityName}</Link>}
      <div className="co-nav-links">
        <Link href={paths.home()}>Home</Link>
        <details className="co-nav-drop">
          <summary>Cities</summary>
          <div>
            {cities.map((c) => (
              <Link key={c.slug} href={paths.city(c.slug)} aria-current={c.slug === city ? "page" : undefined}>
                <span className="co-drop-bar" style={{ background: c.accent }} />{c.name}<small>{c.coordinates}</small>
              </Link>
            ))}
            <Link href={paths.area()} className="co-drop-all">The whole Amalfi Coast ›</Link>
          </div>
        </details>
        <Link href="/experiences">Experiences</Link>
        <Link href="/#map">Map</Link>
        <Link href="/amalfi-coast#package">Package</Link>
      </div>
      <span className="co-nav-gap" />
      {/* Su telefono tutte le voci stanno in un menu che si apre sotto la barra. */}
      <details className="co-nav-menu">
        <summary>Menu</summary>
        <div>
          <Link href={paths.home()}>Home</Link>
          <span className="co-menu-label">Cities</span>
          {cities.map((c) => (
            <Link key={c.slug} href={paths.city(c.slug)} className="co-menu-city"><span className="co-drop-bar" style={{ background: c.accent }} />{c.name}</Link>
          ))}
          <Link href="/experiences">Experiences</Link>
          <Link href="/#map">Map</Link>
          <Link href="/amalfi-coast#package">Package</Link>
          <Link href="/account">My bookings</Link>
        </div>
      </details>
      <Link href="/account" className="co-nav-account">My bookings</Link>
      <Link href={paths.area()} className="co-nav-cta">Book</Link>
    </nav>
  );
}
