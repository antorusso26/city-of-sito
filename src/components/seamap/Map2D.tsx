"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PLACES } from "@/data/map-places";
import { toUnit, type BuiltRoute } from "./route";
import { sample } from "./useBoat";
import { KIND_COLOR, ROUTE_COLOR, type MapViewProps } from "./types";

const IW = 2000;
const IH = 952;
type VB = { x: number; y: number; w: number; h: number };

export default function Map2D(p: MapViewProps) {
  const { data, route, track, boat, picked, selected, departure, locale, onPlace, focusKey, ghosts } = p;
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 1, h: 1 });
  const [vb, setVb] = useState<VB>({ x: 0, y: 0, w: IW, h: IH });
  const target = useRef<VB | null>(null);
  const boatRef = useRef<SVGGElement>(null);
  const doneRef = useRef<SVGPathElement>(null);

  const px = useCallback((ll: [number, number]): [number, number] => {
    const [u, v] = toUnit(data, ll);
    return [u * IW, v * IH];
  }, [data]);

  // ─── size ───
  useEffect(() => {
    const el = box.current!;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ─── fit helpers ───
  const { left, top, bottom } = p.inset;
  const fit = useCallback((minX: number, minY: number, maxX: number, maxY: number, pad = 0.18): VB => {
    const visW = Math.max(120, size.w - left), visH = Math.max(120, size.h - top - bottom);
    const s = Math.max(((maxX - minX) * (1 + pad * 2)) / visW, ((maxY - minY) * (1 + pad * 2)) / visH, 260 / size.w);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    return { x: cx - (left + visW / 2) * s, y: cy - (top + visH / 2) * s, w: size.w * s, h: size.h * s };
  }, [size, left, top, bottom]);

  useEffect(() => {
    if (size.w < 2) return;
    let pts: [number, number][];
    if (route) pts = route.points.map(px);
    else pts = PLACES.map((pl) => px(data.anchors[pl.id]));
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    target.current = fit(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), route ? 0.16 : 0.04);
  }, [focusKey, size, route, data, fit, px]);

  // ─── per-frame: camera easing + boat ───
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const t = target.current;
      if (t) {
        setVb((v) => {
          const k = 0.12;
          const n = { x: v.x + (t.x - v.x) * k, y: v.y + (t.y - v.y) * k, w: v.w + (t.w - v.w) * k, h: v.h + (t.h - v.h) * k };
          if (Math.abs(n.w - t.w) < 0.5 && Math.abs(n.x - t.x) < 0.5 && Math.abs(n.y - t.y) < 0.5) { target.current = null; return t; }
          return n;
        });
      }
      if (track && boatRef.current) {
        const s = sample(track, boat.current.d);
        const x = (s.x / data.widthM) * IW, y = (s.y / data.heightM) * IH;
        boatRef.current.setAttribute("transform", `translate(${x} ${y}) rotate(${(s.heading * 180) / Math.PI})`);
        doneRef.current?.setAttribute("stroke-dasharray", `${boat.current.d} ${track.total * 2}`);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [track, boat, data]);

  // ─── pan / zoom ───
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const moved = useRef(0);
  const clamp = (v: VB): VB => {
    const w = Math.min(IW * 1.15, Math.max(160, v.w));
    const h = w * (v.h / v.w);
    return { w, h, x: Math.min(IW - w * 0.3, Math.max(-w * 0.7, v.x)), y: Math.min(IH - h * 0.3, Math.max(-h * 0.7, v.y)) };
  };
  const zoomAt = (cx: number, cy: number, f: number) => {
    target.current = null;
    setVb((v) => {
      const r = box.current!.getBoundingClientRect();
      const ux = v.x + ((cx - r.left) / r.width) * v.w, uy = v.y + ((cy - r.top) / r.height) * v.h;
      const w = v.w * f, h = v.h * f;
      return clamp({ w, h, x: ux - ((cx - r.left) / r.width) * w, y: uy - ((cy - r.top) / r.height) * h });
    });
  };
  const onWheel = (e: React.WheelEvent) => zoomAt(e.clientX, e.clientY, Math.exp(e.deltaY * 0.0015));
  const onDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = 0;
  };
  const onMove = (e: React.PointerEvent) => {
    const prev = ptrs.current.get(e.pointerId);
    if (!prev) return;
    const all = [...ptrs.current.values()];
    if (ptrs.current.size === 2) {
      const [a, b] = all;
      const before = Math.hypot(a.x - b.x, a.y - b.y);
      ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [c, d] = [...ptrs.current.values()];
      const after = Math.hypot(c.x - d.x, c.y - d.y);
      if (before > 0 && after > 0) zoomAt((c.x + d.x) / 2, (c.y + d.y) / 2, before / after);
      moved.current += 10;
      return;
    }
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current += Math.abs(dx) + Math.abs(dy);
    target.current = null;
    setVb((v) => clamp({ ...v, x: v.x - (dx / size.w) * v.w, y: v.y - (dy / size.h) * v.h }));
  };
  const onUp = (e: React.PointerEvent) => ptrs.current.delete(e.pointerId);

  // ─── drawing ───
  const k = vb.w / Math.max(1, size.w); // image px per screen px
  const path = (r: BuiltRoute) => "M" + r.points.map((q) => px(q).map((n) => n.toFixed(1)).join(" ")).join("L");
  const inRoute = useMemo(() => new Set(route?.stops ?? []), [route]);
  const showAllLabels = k < 0.75;

  return (
    <div
      ref={box}
      className="absolute inset-0 touch-none select-none cursor-grab active:cursor-grabbing bg-[#9ed3df]"
      onWheel={onWheel}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <svg className="size-full block" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="m2d-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy={1.5 * k} stdDeviation={2 * k} floodColor="#0b2230" floodOpacity="0.35" />
          </filter>
        </defs>
        <image href="/map/relief.jpg" x={0} y={0} width={IW} height={IH} preserveAspectRatio="none" />

        {!route && ghosts.map((g, i) => (
          <path key={i} d={path(g)} fill="none" stroke="#ffffff" strokeOpacity={0.55} strokeWidth={1.6 * k} strokeDasharray={`${5 * k} ${5 * k}`} />
        ))}

        {route && track && (
          <g>
            <path d={path(route)} fill="none" stroke="#ffffff" strokeOpacity={0.85} strokeWidth={6 * k} strokeLinecap="round" strokeLinejoin="round" />
            <path d={path(route)} fill="none" stroke={ROUTE_COLOR} strokeOpacity={0.45} strokeWidth={2.4 * k} strokeDasharray={`${6 * k} ${5 * k}`} strokeLinecap="round" />
            <path ref={doneRef} d={path(route)} pathLength={track.total} fill="none" stroke={ROUTE_COLOR} strokeWidth={3 * k} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`0 ${track.total * 2}`} />
          </g>
        )}

        {PLACES.map((pl) => {
          const [x, y] = px(data.anchors[pl.id]);
          const isPort = pl.kind === "port";
          const isDep = pl.id === departure;
          const isPicked = picked.includes(pl.id);
          const active = selected === pl.id || isPicked || inRoute.has(pl.id);
          const r = (isPort ? 15 : 12.5) * k * (active ? 1.2 : 1);
          const showLabel = isPort || showAllLabels || active;
          const anchor = pl.label === "left" ? "end" : pl.label === "right" ? "start" : "middle";
          const lx = pl.label === "left" ? -r - 5 * k : pl.label === "right" ? r + 5 * k : 0;
          const ly = pl.label === "bottom" ? r + 15 * k : pl.label === "top" || !pl.label ? -r - 7 * k : 4 * k;
          return (
            <g key={pl.id} transform={`translate(${x} ${y})`} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); if (moved.current < 6) onPlace(pl.id); }}>
              <circle r={r * 1.4} fill="transparent" />
              <clipPath id={`m2d-c-${pl.id}`}><circle r={r} /></clipPath>
              <circle r={r} fill="#ffffff" filter="url(#m2d-shadow)" />
              <image href={`/map/places/${pl.id}-sm.jpg`} x={-r} y={-r} width={r * 2} height={r * 2} preserveAspectRatio="xMidYMid slice" clipPath={`url(#m2d-c-${pl.id})`} />
              <circle r={r} fill="none" stroke={isPicked ? ROUTE_COLOR : KIND_COLOR[pl.kind]} strokeWidth={(isPort ? 3 : 2.6) * k} />
              {isDep && <circle r={r + 4 * k} fill="none" stroke={KIND_COLOR.port} strokeWidth={1.4 * k} />}
              {selected === pl.id && <circle r={r + 7 * k} fill="none" stroke={ROUTE_COLOR} strokeWidth={1.6 * k} />}
              {showLabel && (
                <text
                  x={lx}
                  y={ly}
                  textAnchor={anchor}
                  fontSize={(isPort ? 13 : 12) * k}
                  fontWeight={isPort || active ? 600 : 500}
                  fill="#0e2733"
                  stroke="#ffffff"
                  strokeWidth={3.2 * k}
                  strokeLinejoin="round"
                  paintOrder="stroke"
                  style={{ fontFamily: "var(--font-onest), system-ui, sans-serif", letterSpacing: "0.01em" }}
                >
                  {pl.name[locale].split(" · ")[0]}
                </text>
              )}
            </g>
          );
        })}

        {route && track && (
          <g ref={boatRef} filter="url(#m2d-shadow)" style={{ pointerEvents: "none" }}>
            <g transform={`scale(${k})`}>
              {/* gozzo seen from above, bow pointing east */}
              <path d="M-11 -4.5 L5 -4.5 Q13 -4 15 0 Q13 4 5 4.5 L-11 4.5 Q-13 0 -11 -4.5Z" fill="#ffffff" stroke="#12303b" strokeWidth="1.2" />
              <path d="M-11 -4.5 L5 -4.5 Q13 -4 15 0" fill="none" stroke="#b5743f" strokeWidth="1.6" />
              <rect x="-6" y="-2.6" width="8" height="5.2" rx="1.4" fill="#12303b" />
              <path d="M-12 -3 L-20 -5 M-12 3 L-20 5 M-12 0 L-22 0" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1.1" strokeLinecap="round" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
