import type { RoutesData } from "./route";

export const UNIT = 100; // metres per world unit
export const VEX = 1.6; // vertical exaggeration
export const SEA_Y = 0.15;

export interface World {
  W: number;
  H: number;
  width: number; // world units, west → east
  depth: number; // world units, north → south
  heights: Float32Array; // metres, row-major north → south
}

/** World y of a land/seabed height in metres (same formula as the terrain mesh) */
export const yOf = (m: number) => (m >= 0.5 ? 0.22 + (m / UNIT) * VEX : -0.45 + (Math.max(m, -90) / UNIT) * 1.4);

/** Elevation (metres) at world x/z, bilinear */
export function heightAt(w: World, x: number, z: number): number {
  const fi = (x / w.width + 0.5) * (w.W - 1);
  const fj = (z / w.depth + 0.5) * (w.H - 1);
  const i = Math.max(0, Math.min(w.W - 2, Math.floor(fi)));
  const j = Math.max(0, Math.min(w.H - 2, Math.floor(fj)));
  const dx = fi - i, dz = fj - j;
  const h = (a: number, b: number) => w.heights[b * w.W + a];
  return h(i, j) * (1 - dx) * (1 - dz) + h(i + 1, j) * dx * (1 - dz) + h(i, j + 1) * (1 - dx) * dz + h(i + 1, j + 1) * dx * dz;
}

/** Ground slope (rise over run, real metres) at world x/z */
export function slopeAt(w: World, x: number, z: number): number {
  const e = 0.6; // units (~60 m)
  const dx = heightAt(w, x + e, z) - heightAt(w, x - e, z);
  const dz = heightAt(w, x, z + e) - heightAt(w, x, z - e);
  return Math.hypot(dx, dz) / (2 * e * UNIT);
}

export function lngLatToXZ(data: RoutesData, w: World, lng: number, lat: number): [number, number] {
  const u = (lng - data.bbox.west) / (data.bbox.east - data.bbox.west);
  const v = (data.bbox.north - lat) / (data.bbox.north - data.bbox.south);
  return [(u - 0.5) * w.width, (v - 0.5) * w.depth];
}

/** Deterministic PRNG so the scenery is the same on every visit */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
