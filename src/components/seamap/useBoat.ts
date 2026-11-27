"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BuiltRoute, RoutesData } from "./route";
import { toUnit } from "./route";

export interface Track {
  /** points in metres, x east / y south from the map's north-west corner */
  pts: [number, number][];
  cum: number[];
  total: number;
  stopAt: number[];
}

export function makeTrack(data: RoutesData, route: BuiltRoute): Track {
  const pts = route.points.map((p) => {
    const [u, v] = toUnit(data, p);
    return [u * data.widthM, v * data.heightM] as [number, number];
  });
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, total: cum[cum.length - 1], stopAt: route.stopIndex.map((i) => cum[i]) };
}

/** Position (metres) and heading (radians, 0 = east, clockwise positive in screen space) at distance d */
export function sample(track: Track, d: number): { x: number; y: number; heading: number } {
  const { pts, cum } = track;
  if (pts.length < 2) return { x: pts[0][0], y: pts[0][1], heading: 0 };
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= d) lo = m; else hi = m; }
  const seg = cum[hi] - cum[lo] || 1;
  const t = Math.min(1, Math.max(0, (d - cum[lo]) / seg));
  const [a, b] = [pts[lo], pts[hi]];
  // look a little ahead for a calmer heading
  const ahead = pts[Math.min(pts.length - 1, hi + 2)];
  const heading = Math.atan2(ahead[1] - a[1], ahead[0] - a[0]);
  return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, heading };
}

const PAUSE_S = 1.8;
/** Longer routes sail a little longer, so the follow camera never has to rush */
export const durationOf = (metres: number) => Math.min(30, Math.max(14, metres / 2400));

/** Drives the boat along a track. `state.current.d` is updated every frame without re-rendering. */
export function useBoat(track: Track | null, playKey: number) {
  const state = useRef({ d: 0, done: false });
  const [stop, setStop] = useState(0);
  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  useEffect(() => {
    if (!track) return;
    if (reduced) { state.current = { d: track.total, done: true }; setStop(track.stopAt.length - 1); return; }
    state.current = { d: 0, done: false };
    setStop(0);
    const speed = track.total / durationOf(track.total); // m per second
    let last = performance.now();
    let pause = PAUSE_S * 0.6;
    let next = 1;
    let raf = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = state.current;
      if (pause > 0) pause -= dt;
      else {
        s.d = Math.min(track.total, s.d + speed * dt);
        if (next < track.stopAt.length && s.d >= track.stopAt[next]) {
          s.d = track.stopAt[next];
          setStop(next);
          next++;
          pause = next < track.stopAt.length ? PAUSE_S : 0;
        }
      }
      if (s.d >= track.total) { s.done = true; return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [track, playKey, reduced]);

  return { state, stop };
}
