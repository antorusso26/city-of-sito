"use client";

// La mappa del mare in home (portata dalla mappa di Charter DolceVita), nello stile City Of.
// Per non rompere lo scorrimento della pagina è "ferma" finché non la tocchi: solo allora prende
// rotella, trascinamento e pinch. Si richiude con "Done", con Esc o quando esce dallo schermo.
// La vista 3D si carica solo quando la sezione si avvicina, così la home resta leggera.
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TOUR_STOPS } from "@/data/map-places";
import { PLACE_PHOTO_CREDITS } from "@/data/map-photos";
import { DEPARTURES, buildRoute, customStops, estimateHours, placeById, tourRoute, type Departure, type RoutesData } from "./route";
import { makeTrack, useBoat } from "./useBoat";
import { KIND_COLOR, ROUTE_COLOR } from "./types";
import "./seamap.css";

const Map2D = dynamic(() => import("./Map2D"), { ssr: false });
const Map3D = dynamic(() => import("./Map3D"), { ssr: false });

type Mode = "3d" | "2d";
const CUSTOM = "__custom";

/** Idee di giro in barca, senza prezzi: il prezzo lo dà il partner quando si chiede. */
const ROUTES: { slug: keyof typeof TOUR_STOPS | string; title: string; line: string }[] = [
  { slug: "capri-island-private-tour", title: "Around Capri", line: "The grottoes, the Arch and the Faraglioni, then the harbour." },
  { slug: "capri-positano-tour", title: "Capri and Positano", line: "Capri in the morning, Li Galli and Positano in the afternoon." },
  { slug: "positano-amalfi-tour", title: "Positano and Amalfi", line: "Li Galli, the Furore fjord, the Emerald Grotto and Amalfi." },
  { slug: "romantic-couple-tour", title: "Faraglioni and Nerano", line: "A slower day: the rocks of Capri and lunch in Nerano." },
  { slug: "sorrento-coast-tour", title: "Sorrento coast", line: "Coves, Ieranto bay and Punta Campanella, close to home." },
  { slug: "sunset-experience", title: "Sunset", line: "Queen Giovanna's Baths and Nerano as the light goes." },
];

const KIND_NAME: Record<string, string> = { port: "Harbour", grotto: "Grotto", rock: "Rocks", bay: "Bay", cape: "Cape", beach: "Beach", village: "Village" };

function canUse3D(): boolean {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return false;
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    if (nav.connection?.saveData) return false;
    if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return false;
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return false;
    return true;
  } catch {
    return false;
  }
}

export function SeaMapSection({ waNumber }: { waNumber?: string }) {
  const rootRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false);
  const [active, setActive] = useState(false);
  const [data, setData] = useState<RoutesData | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [tour, setTour] = useState<string | null>(null);
  const [departure, setDeparture] = useState<Departure>("sorrento");
  const [picked, setPicked] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [playKey, setPlayKey] = useState(0);
  const [inset, setInset] = useState({ left: 0, top: 0, bottom: 0 });

  // Carica la mappa quando la sezione è a meno di uno schermo; la disattiva quando esce di vista.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setNear(true);
    }, { rootMargin: "100% 0px" });
    const out = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) setActive(false);
    }, { threshold: 0.15 });
    io.observe(el);
    out.observe(el);
    return () => { io.disconnect(); out.disconnect(); };
  }, []);

  useEffect(() => {
    if (!near || data) return;
    fetch("/map/routes.json").then((r) => r.json()).then(setData).catch(() => setMode("2d"));
    setMode(canUse3D() ? "3d" : "2d");
  }, [near, data]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  // L'inquadratura tiene conto del pannello (a sinistra su computer, in basso su telefono).
  useEffect(() => {
    const measure = () => {
      const root = rootRef.current?.getBoundingClientRect();
      const pr = panelRef.current?.getBoundingClientRect();
      if (!root) return;
      const desktop = window.innerWidth >= 768;
      const next = desktop
        ? { left: pr ? pr.right - root.left + 8 : 0, top: 72, bottom: 0 }
        : { left: 0, top: 72, bottom: pr ? Math.max(0, root.bottom - pr.top) : 0 };
      setInset((o) => (Math.abs(o.left - next.left) + Math.abs(o.top - next.top) + Math.abs(o.bottom - next.bottom) > 24 ? next : o));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (panelRef.current) ro.observe(panelRef.current);
    if (rootRef.current) ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, [near]);

  const isCustom = tour === CUSTOM;
  const route = useMemo(() => {
    if (!data || !tour) return null;
    if (isCustom) return picked.length ? buildRoute(data, customStops(data, picked, departure)) : null;
    return TOUR_STOPS[tour] ? tourRoute(data, tour, departure) : null;
  }, [data, tour, isCustom, picked, departure]);

  const ghosts = useMemo(() => (data ? Object.keys(TOUR_STOPS).map((s) => tourRoute(data, s, departure)) : []), [data, departure]);
  const track = useMemo(() => (data && route ? makeTrack(data, route) : null), [data, route]);
  const { state: boat, stop } = useBoat(track, playKey);

  const chooseTour = (slug: string | null) => {
    setTour(slug);
    setSelected(null);
    setActive(true);
    setPlayKey((k) => k + 1);
  };

  const onPlace = useCallback((id: string) => {
    if (tour === CUSTOM && id !== departure) {
      setPicked((ps) => (ps.includes(id) ? ps.filter((x) => x !== id) : [...ps, id]));
      setPlayKey((k) => k + 1);
    }
    setSelected(id);
  }, [tour, departure]);

  const nameOf = (id: string) => placeById[id].name.en.split(" · ")[0];
  const sel = selected ? placeById[selected] : null;
  const hours = route ? estimateHours(route) : 0;
  const km = route ? Math.round(route.meters / 1000) : 0;
  const routeInfo = tour && !isCustom ? ROUTES.find((r) => r.slug === tour) : null;
  const toursHere = sel ? ROUTES.filter((r) => TOUR_STOPS[r.slug]?.includes(sel.id)) : [];

  const askText = route
    ? `Hi City Of, I'd like a boat day on this route: ${route.stops.map(nameOf).join(" → ")} (about ${hours}h). Dates and people: …`
    : "Hi City Of, I'd like a boat day on the coast.";
  const askHref = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(askText)}` : "/contact";

  const viewProps = data && {
    data, route, track, boat, stop, ghosts, picked, selected, departure, locale: "en" as const, onPlace,
    focusKey: `${tour}|${departure}|${isCustom ? picked.join(",") : ""}`,
    inset,
  };

  return (
    <section ref={rootRef} id="map" className="sm-map" data-active={active} aria-label="Map of the coast by sea">
      <div className="sm-stage" aria-hidden={!active}>
        {near && viewProps && mode ? (mode === "3d" ? <Map3D {...viewProps} /> : <Map2D {...viewProps} />) : <div className="sm-loading"><span>Loading the map…</span></div>}
      </div>

      {/* Finché non è attiva, questo velo lascia scorrere la pagina e invita a toccare. */}
      {!active && (
        <button type="button" className="sm-veil" onClick={() => setActive(true)}>
          <span className="sm-veil-pill">Tap to explore the map</span>
        </button>
      )}

      <div className="sm-top">
        <div className="sm-chips" role="group" aria-label="Boat routes">
          <button type="button" className="sm-chip" aria-pressed={!tour} onClick={() => chooseTour(null)}>All routes</button>
          {ROUTES.map((r) => (
            <button key={r.slug} type="button" className="sm-chip" aria-pressed={tour === r.slug} onClick={() => chooseTour(r.slug)}>{r.title}</button>
          ))}
          <button type="button" className="sm-chip accent" aria-pressed={isCustom} onClick={() => chooseTour(CUSTOM)}>✦ Your own route</button>
        </div>
        <div className="sm-tools">
          <div className="sm-seg" role="group" aria-label="3D or 2D">
            {(["3d", "2d"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>{m.toUpperCase()}</button>
            ))}
          </div>
          {active && <button type="button" className="sm-done" onClick={() => setActive(false)}>Done</button>}
        </div>
      </div>

      <aside ref={panelRef} className="sm-panel">
        <div className="sm-panel-in">
          <p className="co-eyebrow">Leaving from</p>
          <div className="sm-deps">
            {DEPARTURES.map((d) => (
              <button key={d} type="button" aria-pressed={departure === d} onClick={() => { setDeparture(d); setPlayKey((k) => k + 1); }}>{nameOf(d)}</button>
            ))}
          </div>

          {!tour && (
            <>
              <p className="co-eyebrow sm-gap">The coast by sea</p>
              <h2 className="sm-title">Where the boat <em>can take you.</em></h2>
              <p className="sm-text">Grottoes, coves and harbours from Capri to Amalfi. Pick a route to watch it, or draw your own and ask us for a boat that does it.</p>
            </>
          )}

          {routeInfo && route && (
            <>
              <p className="co-eyebrow sm-gap">About {hours}h · {km} km</p>
              <h2 className="sm-title">{routeInfo.title}</h2>
              <p className="sm-text">{routeInfo.line}</p>
              <Stops stops={route.stops} current={stop} nameOf={nameOf} onPick={setSelected} />
            </>
          )}

          {isCustom && (
            <>
              <p className="co-eyebrow sm-gap">✦ Your own route</p>
              <h2 className="sm-title">Draw it <em>on the sea.</em></h2>
              {!route ? (
                <p className="sm-empty">Tap the places on the map you want to see. We put them in a sensible order and bring you back.</p>
              ) : (
                <>
                  <p className="sm-text"><b>About {hours}h on the water, {km} km.</b> The skipper confirms the timing with the sea of the day.</p>
                  <Stops stops={route.stops} current={stop} nameOf={nameOf} onPick={setSelected}
                    removable={picked} onRemove={(id) => { setPicked((ps) => ps.filter((x) => x !== id)); setPlayKey((k) => k + 1); }} />
                  <button type="button" className="sm-link" onClick={() => { setPicked([]); setSelected(null); }}>Clear the route</button>
                </>
              )}
            </>
          )}

          {(route || isCustom) && (
            <div className="sm-ctas">
              <a className="co-btn" href={askHref} target={waNumber ? "_blank" : undefined} rel="noopener noreferrer">Ask for this route</a>
              <a className="sm-link" href="/experiences">See boat days</a>
              {route && <button type="button" className="sm-link" onClick={() => setPlayKey((k) => k + 1)}>↻ Replay</button>}
            </div>
          )}

          {sel && (
            <div className="sm-place">
              <div className="sm-place-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img key={sel.id} src={`/map/places/${sel.id}.jpg`} alt={sel.name.en} />
                {PLACE_PHOTO_CREDITS[sel.id] && (
                  <a href={PLACE_PHOTO_CREDITS[sel.id]!.source} target="_blank" rel="noopener noreferrer">© {PLACE_PHOTO_CREDITS[sel.id]!.author} · {PLACE_PHOTO_CREDITS[sel.id]!.license}</a>
                )}
              </div>
              <div className="sm-place-body">
                <p className="sm-kind" style={{ color: KIND_COLOR[sel.kind] }}><span style={{ background: KIND_COLOR[sel.kind] }} />{KIND_NAME[sel.kind]}</p>
                <h3>{sel.name.en}</h3>
                <button type="button" className="sm-x" aria-label="Close" onClick={() => setSelected(null)}>✕</button>
                <p className="sm-text">{sel.desc.en}</p>
                {isCustom && sel.id !== departure && (
                  <button type="button" className="co-btn sm-add" onClick={() => onPlace(sel.id)}>{picked.includes(sel.id) ? "Remove from route" : "+ Add to route"}</button>
                )}
                {!isCustom && toursHere.length > 0 && (
                  <div className="sm-passes">
                    {toursHere.map((r) => <button key={r.slug} type="button" onClick={() => chooseTour(r.slug)}>{r.title}</button>)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}

function Stops({ stops, current, nameOf, onPick, onRemove, removable }: {
  stops: string[]; current: number; nameOf: (id: string) => string; onPick: (id: string) => void;
  onRemove?: (id: string) => void; removable?: string[];
}) {
  return (
    <ol className="sm-stops">
      {stops.map((s, i) => (
        <li key={`${s}-${i}`} data-reached={i <= current}>
          <span className="sm-dot" style={{ borderColor: i <= current ? ROUTE_COLOR : undefined, background: i === current ? ROUTE_COLOR : undefined }} />
          <button type="button" onClick={() => onPick(s)}>{nameOf(s)}</button>
          {onRemove && removable?.includes(s) && <button type="button" className="sm-rm" aria-label={`Remove ${nameOf(s)}`} onClick={() => onRemove(s)}>✕</button>}
        </li>
      ))}
    </ol>
  );
}
