"use client";

// Il timone che gira mentre scorri: una fermata (con ancora #helm-<città>) per ogni città.
// - la pagina si aggancia dolcemente sulla fermata più vicina (scroll-snap "proximity", in home.css);
// - su ogni fermata la ruota resta ferma per un tratto, poi gira verso la città successiva;
// - la ruota insegue lo scorrimento con una molla leggera: niente scatti con la rotella o il trackpad;
// - i pulsanti delle città scorrono alla loro fermata. Con "riduci movimento" diventa un elenco normale.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type ScrollCity = { slug: string; name: string; accent: string; coords?: string; line?: string; hero?: string; href: string; slot: number };

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function HelmScroll({ cities }: { cities: ScrollCity[] }) {
  const box = useRef<HTMLElement>(null);
  const target = useRef(0);
  const shown = useRef(0);
  const [p, setP] = useState(0); // 0 … n-1, continuo e già ammorbidito
  const n = cities.length;

  useEffect(() => {
    let raf = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const read = () => {
      const el = box.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, -r.top / Math.max(1, el.offsetHeight - window.innerHeight)));
      const seg = t * (n - 1), i = Math.min(n - 2, Math.floor(seg)), f = seg - i;
      target.current = n > 1 ? i + smooth(0.28, 0.72, f) : 0; // sosta su ogni città, poi giro
    };
    const tick = () => {
      const d = target.current - shown.current;
      shown.current = Math.abs(d) < 0.001 || reduce ? target.current : shown.current + d * 0.16;
      setP(shown.current);
      raf = Math.abs(target.current - shown.current) > 0.0005 ? requestAnimationFrame(tick) : 0;
    };
    const on = () => { read(); if (!raf) raf = requestAnimationFrame(tick); };
    read(); shown.current = target.current; setP(shown.current);
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, [n]);

  const active = Math.min(n - 1, Math.max(0, Math.round(p)));
  const c = cities[active];
  const rot = -interpSlot(cities, p) * 60;

  return (
    <section ref={box} className="sc-helm" id="helm" style={{ ["--count" as string]: n, ["--disc" as string]: c.accent }}>
      {/* le fermate: una per città, a distanze uguali lungo la sezione */}
      {cities.map((x, i) => (
        <span key={x.slug} id={`helm-${x.slug}`} className="sc-helm-stop" style={{ ["--stop" as string]: n > 1 ? i / (n - 1) : 0 }} aria-hidden="true" />
      ))}
      <div className="sc-helm-sticky">
        {cities.map((x, i) => (
          <div key={x.slug} className="sc-helm-bg" data-on={i === active} aria-hidden="true">
            {x.hero && <img src={x.hero} alt="" loading={i === 0 ? "eager" : "lazy"} />}
          </div>
        ))}
        <div className="sc-helm-shade" aria-hidden="true" />
        <div className="wrap sc-helm-grid">
          <div className="sc-helm-copy">
            <p className="co-eyebrow">Turn the helm · {String(active + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</p>
            <div className="sc-helm-names">
              {cities.map((x, i) => (
                <div key={x.slug} className="sc-helm-name" data-on={i === active} aria-hidden={i !== active}>
                  <h2><span className="co-cof-line">City of</span> <em>{x.name}</em></h2>
                  <p className="sc-helm-coords">{x.coords}</p>
                  <p className="sc-helm-line">{x.line}</p>
                  <Link className="co-btn" href={x.href} tabIndex={i === active ? 0 : -1}>Open {x.name}</Link>
                </div>
              ))}
            </div>
            <ol className="sc-helm-dots" aria-label="Towns">
              {cities.map((x, i) => (
                <li key={x.slug} data-on={i === active}><a href={`#helm-${x.slug}`}>{x.name}</a></li>
              ))}
            </ol>
          </div>
          <div className="sc-helm-wheel" aria-hidden="true">
            <div className="sc-helm-disc" />
            <svg viewBox="0 0 200 200" style={{ transform: `rotate(${rot}deg)` }}>
              <circle cx="100" cy="100" r="55" fill="none" stroke="currentColor" strokeWidth="17" />
              <circle cx="100" cy="100" r="16" fill="currentColor" />
              {Array.from({ length: 6 }, (_, i) => (
                <g key={i} transform={`rotate(${i * 60} 100 100)`}>
                  <rect x="95.5" y="46" width="9" height="54" fill="currentColor" />
                  <rect x="92" y="10" width="16" height="35" rx="8" fill={i === c.slot ? "#fff" : "currentColor"} style={{ transition: "fill .4s" }} />
                </g>
              ))}
              <circle cx="100" cy="100" r="6" fill="var(--disc)" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Slot del timone (0–5) tra una città e la successiva, per una rotazione continua. */
function interpSlot(cities: ScrollCity[], p: number) {
  const i = Math.max(0, Math.min(cities.length - 1, Math.floor(p))), f = p - i;
  const a = cities[i].slot;
  const b = cities[Math.min(i + 1, cities.length - 1)].slot;
  return a + (b - a) * f;
}
