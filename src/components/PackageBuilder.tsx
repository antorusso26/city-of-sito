"use client";

// Il pacchetto "Amalfi Coast, complete": accendi e spegni le città, scegli cosa fare in ognuna,
// indica quante persone siete. Poi una sola richiesta: un prezzo da noi, un partner per ogni tappa.
import Link from "next/link";
import { useMemo, useState } from "react";

export type PkgItem = { key: string; title: string; duration: string; priceFrom: number | null; priceUnit: string };
export type PkgCity = { slug: string; name: string; accent: string; coordinates?: string; items: PkgItem[] };

const eur = (n: number) => `€${n.toLocaleString("en-GB")}`;

export function PackageBuilder({ name, summary, cities }: { name: string; summary: string; cities: PkgCity[] }) {
  const [on, setOn] = useState<Set<string>>(() => new Set(cities.map((c) => c.slug)));
  const [picked, setPicked] = useState<Set<string>>(() => new Set(cities.flatMap((c) => (c.items[0] ? [c.items[0].key] : []))));
  const [people, setPeople] = useState(2);

  const toggle = (set: Set<string>, k: string) => { const n = new Set(set); if (n.has(k)) n.delete(k); else n.add(k); return n; };

  const chosen = useMemo(() => cities.filter((c) => on.has(c.slug)).flatMap((c) => c.items.filter((i) => picked.has(i.key))), [cities, on, picked]);
  const known = chosen.filter((i) => i.priceFrom !== null);
  const total = known.reduce((s, i) => s + (i.priceUnit === "per person" ? i.priceFrom! * people : i.priceFrom!), 0);
  const allPriced = chosen.length > 0 && known.length === chosen.length;
  const towns = cities.filter((c) => on.has(c.slug) && c.items.some((i) => picked.has(i.key))).length;
  const href = `/request?people=${people}&items=${encodeURIComponent(chosen.map((i) => i.key).join(","))}&package=amalfi-coast-complete`;

  return (
    <section className="co-pkg" id="package">
      <div className="wrap">
        <div className="co-pkg-head">
          <div>
            <p className="co-tag">Package</p>
            <h2 className="co-h2">{name}.</h2>
            <p className="co-status">{summary}</p>
          </div>
          <div className="co-seg" role="group" aria-label="People">
            <span>People</span>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <button key={n} type="button" aria-pressed={people === n} onClick={() => setPeople(n)}>{n}</button>
            ))}
          </div>
        </div>

        <div className="co-pkg-body">
          {cities.map((c) => {
            const isOn = on.has(c.slug);
            return (
              <div key={c.slug} className={`co-bcity${isOn ? "" : " off"}`} style={{ ["--c" as string]: c.accent }}>
                <label className="co-bcity-head">
                  <span className="co-bname">{c.name}<small>{c.coordinates}</small></span>
                  <input type="checkbox" className="co-sw-input" checked={isOn} onChange={() => setOn((s) => toggle(s, c.slug))} aria-label={`Include ${c.name}`} />
                  <span className="co-switch" aria-hidden="true" />
                </label>
                {isOn && (
                  <div className="co-bitems">
                    {c.items.map((i) => {
                      const sel = picked.has(i.key);
                      return (
                        <button key={i.key} type="button" role="checkbox" aria-checked={sel} className="co-bitem" onClick={() => setPicked((s) => toggle(s, i.key))}>
                          <span className="co-tick" aria-hidden="true" />
                          <span className="co-bt">{i.title}<small>{i.duration}</small></span>
                          <span className="co-bp">
                            {i.priceFrom === null ? "[PRICE]" : eur(i.priceUnit === "per person" ? i.priceFrom * people : i.priceFrom)}
                            <small>{i.priceFrom !== null && i.priceUnit === "per person" ? `${eur(i.priceFrom)} × ${people}` : i.priceUnit}</small>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="co-pkg-total">
            <div>
              <b>{chosen.length === 0 ? "Nothing picked yet" : allPriced ? `About ${eur(total)}` : "We send one price"}</b>
              <small>{towns} {towns === 1 ? "town" : "towns"} · {chosen.length} {chosen.length === 1 ? "thing" : "things"} · {people} {people === 1 ? "person" : "people"}</small>
            </div>
            {chosen.length > 0 ? <Link className="co-send" href={href}>Request this trip</Link> : <span className="co-send" aria-disabled="true">Request this trip</span>}
          </div>
        </div>
        <p className="co-note">Prices are confirmed with each partner before you pay anything. Until then they show as [PRICE].</p>
      </div>
    </section>
  );
}
