import Link from "next/link";
import { getCategories, getCities, getGuides, getLandings } from "@/lib/content";
import { AREA, paths } from "@/lib/site";
import { Logo } from "./Logo";
import { MockupBanner } from "./MockupBanner";

/** Il piè di pagina è anche la rete di collegamenti interni tra città, categorie e guide. */
export function Footer({ city }: { city?: string }) {
  const cities = getCities();
  const current = city ?? cities.find((c) => c.status === "live")?.slug;
  return (
    <footer className="mt-24 bg-abisso text-white">
      <div className="wrap grid gap-10 py-14 md:grid-cols-4">
        <div>
          <Logo height={24} />
          <p className="mt-4 max-w-xs text-sm text-sabbia">The best of each coastal city, picked by people who live there, with the price shown before you book.</p>
        </div>
        <div>
          <p className="label text-sabbia">Cities</p>
          <ul className="mt-4 space-y-2 text-sm">
            {cities.map((c) => (
              <li key={c.slug}>
                {c.status === "live" ? <Link href={paths.city(c.slug)}>City of {c.name}</Link> : <span className="text-white/70">City of {c.name} · soon</span>}
              </li>
            ))}
            <li><Link href={paths.area()}>{AREA.name}</Link></li>
          </ul>
        </div>
        {current && (
          <>
            <div>
              <p className="label text-sabbia">Things to do</p>
              <ul className="mt-4 space-y-2 text-sm">
                {getCategories().map((c) => (
                  <li key={c.slug}><Link href={paths.section(current, c.slug)}>{c.name}</Link></li>
                ))}
                {getLandings(current).map((l) => (
                  <li key={l.slug}><Link href={paths.section(current, l.slug)}>{l.h1}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="label text-sabbia">Guides</p>
              <ul className="mt-4 space-y-2 text-sm">
                {getGuides(current).slice(0, 6).map((g) => (
                  <li key={g.slug}><Link href={paths.guide(current, g.slug)}>{g.h1}</Link></li>
                ))}
                <li><Link href={paths.guides(current)}>All guides</Link></li>
              </ul>
            </div>
          </>
        )}
      </div>
      <div className="wrap border-t border-white/15 py-6 text-xs text-sabbia">
        <p>© {new Date().getFullYear()} City Of. Experiences are run by local partners, named on every page.</p>
        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/about">About</Link><Link href="/contact">Contact</Link><Link href="/contact#partners">Partners</Link>
          <Link href="/terms">Terms</Link><Link href="/cancellation">Cancellation</Link><Link href="/privacy">Privacy</Link><Link href="/cookies">Cookies</Link>
          <span>[COMPANY NAME] · VAT [VAT ID]</span>
        </p>
        <MockupBanner />
      </div>
    </footer>
  );
}
