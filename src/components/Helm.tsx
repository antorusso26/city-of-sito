"use client";

// Il timone (disegno di Luigi, comportamento rifatto).
// Ogni maniglia è una città, a 60° l'una dall'altra; quella in alto è la città scelta.
// Si trascina e si ferma sempre su uno scatto; frecce ← →; tastiera solo quando il timone ha il fuoco;
// tocchi una maniglia e gira fino a lei, la ritocchi in alto (o premi Explore) e apri la città.
import { useCallback, useEffect, useRef, useState } from "react";
import { useVeil } from "./Veil";

export type HelmCity = { slug: string; name: string; accent: string; live: boolean; coordinates?: string; href: string };

const SLOTS = 6;
const STEP = 360 / SLOTS;
const mod = (n: number) => ((n % SLOTS) + SLOTS) % SLOTS;

export function Helm({ cities }: { cities: (HelmCity | undefined)[] }) {
  // cities[i] sta sulla maniglia i; le maniglie senza città restano spente.
  const go = useVeil();
  const spin = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [drag, setDrag] = useState<number | null>(null); // rotazione in corso, in gradi
  const [intro, setIntro] = useState(true);
  const d = useRef<{ id: number; last: number; acc: number; start: number; slot: number | null; moved: boolean } | null>(null);

  const rotation = drag ?? -step * STEP;
  const active = mod(Math.round(-rotation / STEP));
  const city = cities[active];

  useEffect(() => {
    const t = window.setTimeout(() => setIntro(false), 60);
    return () => clearTimeout(t);
  }, []);

  const toSlot = useCallback((i: number) => setStep((s) => {
    let diff = i - mod(s);
    if (diff > SLOTS / 2) diff -= SLOTS;
    if (diff < -SLOTS / 2) diff += SLOTS;
    return s + diff;
  }), []);
  const open = useCallback((i: number) => {
    const c = cities[i];
    if (c?.live) go(c.href, { name: c.name, accent: c.accent });
  }, [cities, go]);

  const angle = (e: React.PointerEvent) => {
    const r = spin.current!.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };

  function onDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    const h = (e.target as Element).closest?.("[data-slot]");
    d.current = { id: e.pointerId, last: angle(e), acc: 0, start: -step * STEP, slot: h ? Number(h.getAttribute("data-slot")) : null, moved: false };
    spin.current!.setPointerCapture(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    const g = d.current;
    if (!g || e.pointerId !== g.id) return;
    const a = angle(e);
    let diff = a - g.last;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    g.last = a;
    g.acc += diff;
    if (!g.moved && Math.abs(g.acc) > 6) g.moved = true;
    if (g.moved) setDrag(g.start + g.acc);
  }
  function onEnd(e: React.PointerEvent) {
    const g = d.current;
    if (!g || e.pointerId !== g.id) return;
    d.current = null;
    if (g.moved) setStep(Math.round(-(g.start + g.acc) / STEP));
    else if (g.slot !== null && e.type === "pointerup") {
      if (g.slot === mod(step)) open(g.slot);
      else toSlot(g.slot);
    }
    setDrag(null);
  }
  function onKey(e: React.KeyboardEvent) {
    const k = e.key;
    if (k === "ArrowRight" || k === "ArrowDown") setStep((s) => s + 1);
    else if (k === "ArrowLeft" || k === "ArrowUp") setStep((s) => s - 1);
    else if (k === "Home") toSlot(0);
    else if (k === "End") toSlot(SLOTS - 1);
    else if (k === "Enter" || k === " ") open(active);
    else return;
    e.preventDefault();
  }

  const label = city ? (city.live ? `City of ${city.name}` : `${city.name}, opening later`) : "Next port";

  return (
    <div className="co-helm-box" style={{ ["--disc" as string]: city?.accent ?? "#A7B4BC" }} data-c={city?.slug}>
      <span className="co-sticker" aria-hidden="true">Ciao</span>
      <div className="co-helm-stage">
        <div className="co-disc" />
        <div
          ref={spin}
          className="co-helm-spin"
          tabIndex={0}
          role="slider"
          aria-roledescription="helm"
          aria-label="Choose a city: drag the helm or use the arrow keys"
          aria-valuemin={0}
          aria-valuemax={SLOTS - 1}
          aria-valuenow={active}
          aria-valuetext={label}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onEnd}
          onPointerCancel={onEnd}
          onKeyDown={onKey}
        >
          <svg
            className="co-helm"
            viewBox="0 0 200 200"
            aria-hidden="true"
            style={{
              transform: `rotate(${intro ? rotation + 2 * STEP : rotation}deg)`,
              transition: drag === null && !intro ? "transform 1100ms cubic-bezier(.2,.75,.15,1)" : "none",
            }}
          >
            <circle cx="100" cy="100" r="55" fill="none" stroke="currentColor" strokeWidth="17" />
            <circle cx="100" cy="100" r="16" fill="currentColor" />
            {Array.from({ length: SLOTS }, (_, i) => {
              const c = cities[i];
              return (
                <g key={i} transform={`rotate(${i * STEP} 100 100)`}>
                  <rect x="95.5" y="46" width="9" height="54" fill="currentColor" />
                  <g data-slot={i} className={`co-hs${i === active ? " on" : ""}${c?.live ? "" : " soon"}`}>
                    <title>{c ? (c.live ? `City of ${c.name}` : `${c.name}, opening later`) : "Next port"}</title>
                    <rect x="78" y="0" width="44" height="52" fill="transparent" />
                    <rect className="co-handle" x="92" y="10" width="16" height="35" rx="8" />
                  </g>
                </g>
              );
            })}
            <circle className="co-hubdot" cx="100" cy="100" r="6" />
          </svg>
        </div>
      </div>
      <div className="co-helm-bar" aria-live="polite">
        <div className="co-hb-txt">
          <small className="co-hb-coords">{city?.coordinates ?? "Opening later"}</small>
          <b className="co-hb-name">
            {city?.live ? (
              <><span className="co-cof">City of </span><em>{city.name}</em></>
            ) : (
              <>{city?.name ?? "Next port"} <small>opening later</small></>
            )}
          </b>
        </div>
        <button type="button" className="co-hb-btn" aria-label="Previous city" onClick={() => setStep((s) => s - 1)}>←</button>
        <button type="button" className="co-hb-btn" aria-label="Next city" onClick={() => setStep((s) => s + 1)}>→</button>
        {city?.live ? (
          <button type="button" className="co-hb-go" onClick={() => open(active)}>Explore</button>
        ) : (
          <span className="co-hb-go" aria-disabled="true">Soon</span>
        )}
      </div>
    </div>
  );
}
