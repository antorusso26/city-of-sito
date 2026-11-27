import { PLACES, TOUR_STOPS } from "@/data/map-places";

export type LngLat = [number, number];

export interface RoutesData {
  bbox: { west: number; east: number; south: number; north: number };
  grid: { w: number; h: number; cellM: number };
  widthM: number;
  heightM: number;
  anchors: Record<string, LngLat>;
  legs: Record<string, LngLat[]>;
  meters: Record<string, number>;
}

export interface BuiltRoute {
  stops: string[];
  /** Full polyline, lng/lat */
  points: LngLat[];
  /** Index in `points` where each stop sits */
  stopIndex: number[];
  meters: number;
}

export const DEPARTURES = ["sorrento", "positano", "capri", "amalfi", "praiano"] as const;
export type Departure = (typeof DEPARTURES)[number];
const CRUISE_KMH = 30; // ~16 knots average including slow sections
const STOP_MIN = 25;

export const placeById = Object.fromEntries(PLACES.map((p) => [p.id, p]));

export function leg(data: RoutesData, a: string, b: string): LngLat[] {
  if (a === b) return [data.anchors[a]];
  return a < b ? data.legs[`${a}~${b}`] : [...data.legs[`${b}~${a}`]].reverse();
}

export function legMeters(data: RoutesData, a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? data.meters[`${a}~${b}`] : data.meters[`${b}~${a}`];
}

export function buildRoute(data: RoutesData, stops: string[]): BuiltRoute {
  const points: LngLat[] = [data.anchors[stops[0]]];
  const stopIndex = [0];
  let meters = 0;
  for (let i = 1; i < stops.length; i++) {
    const l = leg(data, stops[i - 1], stops[i]);
    points.push(...l.slice(1));
    stopIndex.push(points.length - 1);
    meters += legMeters(data, stops[i - 1], stops[i]);
  }
  return { stops, points, stopIndex, meters };
}

/** Same itinerary, starting and ending at another port (consecutive duplicates removed). */
export function withDeparture(stops: string[], from: Departure): string[] {
  const inner = stops.filter((s, i) => !((i === 0 || i === stops.length - 1) && s === "sorrento") && s !== from);
  const out = [from, ...inner, from];
  return out.filter((s, i) => i === 0 || s !== out[i - 1]);
}

export const tourRoute = (data: RoutesData, slug: string, from: Departure = "sorrento") =>
  buildRoute(data, withDeparture(TOUR_STOPS[slug], from));

/** Custom trip: from the departure port, visit the picked places in the shortest reasonable order and come back. */
export function customStops(data: RoutesData, picked: string[], from: Departure = "sorrento"): string[] {
  const rest = picked.filter((p) => p !== from);
  const order: string[] = [from];
  // nearest neighbour, then 2-opt to remove crossings
  while (rest.length) {
    const last = order[order.length - 1];
    rest.sort((a, b) => legMeters(data, last, a) - legMeters(data, last, b));
    order.push(rest.shift()!);
  }
  order.push(from);
  const len = (o: string[]) => o.slice(1).reduce((m, s, i) => m + legMeters(data, o[i], s), 0);
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 1; i < order.length - 2; i++)
      for (let j = i + 1; j < order.length - 1; j++) {
        const next = [...order.slice(0, i), ...order.slice(i, j + 1).reverse(), ...order.slice(j + 1)];
        if (len(next) < len(order) - 1) { order.splice(0, order.length, ...next); improved = true; }
      }
  }
  return order;
}

/** Hours on the water: cruising + time at each stop (rounded to half hours) */
export function estimateHours(route: BuiltRoute): number {
  const stops = Math.max(0, route.stops.length - 2);
  const h = route.meters / 1000 / CRUISE_KMH + (stops * STOP_MIN) / 60;
  return Math.max(2, Math.round(h * 2) / 2);
}

/** The catalogue tour that covers most of the picked places */
export function suggestTour(picked: string[]): string | null {
  const want = new Set(picked.filter((p) => p !== "sorrento"));
  if (!want.size) return null;
  let best: string | null = null;
  let bestScore = 0;
  for (const [slug, stops] of Object.entries(TOUR_STOPS)) {
    const have = new Set(stops.filter((s) => s !== "sorrento"));
    const inter = [...want].filter((p) => have.has(p)).length;
    const score = inter / (want.size + have.size - inter);
    if (score > bestScore) { bestScore = score; best = slug; }
  }
  return bestScore >= 0.2 ? best : null;
}

/** lng/lat → 0..1 inside the map bbox (x east, y south) */
export function toUnit(data: RoutesData, [lng, lat]: LngLat): [number, number] {
  const { west, east, south, north } = data.bbox;
  return [(lng - west) / (east - west), (north - lat) / (north - south)];
}
