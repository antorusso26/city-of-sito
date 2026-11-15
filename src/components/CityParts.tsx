"use client";

// Barra delle città e schede città: ogni link a una città fa partire il velo City Of.
import { CityLink } from "./Veil";

export type CityChip = { slug: string; name: string; accent: string; href: string; coordinates?: string; hero?: string; count?: number };

export function CityPicker({ cities, active, near }: { cities: CityChip[]; active?: string; near?: CityChip[] }) {
  return (
    <div className="co-picker-wrap">
      <p className="co-picker-label">Where are you going?</p>
      <nav className="co-picker" aria-label="Cities">
        {cities.map((c) => (
          <CityLink key={c.slug} href={c.href} city={{ name: c.name, accent: c.accent }}
            className={`co-chip${c.slug === active ? " active" : ""}`} aria-current={c.slug === active ? "page" : undefined}
            style={{ ["--chip" as string]: c.accent }}>
            {c.name}
          </CityLink>
        ))}
      </nav>
      {near && near.length > 0 && (
        <div className="co-near">
          <span>See also:</span>
          {near.map((c) => <CityLink key={c.slug} href={c.href} city={{ name: c.name, accent: c.accent }}>{c.name}</CityLink>)}
        </div>
      )}
    </div>
  );
}

export function CityTiles({ cities, small = false }: { cities: CityChip[]; small?: boolean }) {
  return (
    <div className={`co-tiles${small ? " small" : ""}`}>
      {cities.map((c) => (
        <CityLink key={c.slug} href={c.href} city={{ name: c.name, accent: c.accent }} className="co-tile">
          {c.hero && <img src={c.hero} alt="" loading="lazy" />}
          <span className="co-bar" style={{ background: c.accent }} />
          <span className="co-tile-name">{c.name}</span>
          {c.count !== undefined && <small>{c.count} things we book</small>}
        </CityLink>
      ))}
    </div>
  );
}
