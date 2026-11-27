import type { MutableRefObject } from "react";
import type { BuiltRoute, RoutesData } from "./route";
import type { Track } from "./useBoat";

export interface MapViewProps {
  data: RoutesData;
  route: BuiltRoute | null;
  track: Track | null;
  /** Live boat distance along the track (metres); mutated every frame */
  boat: MutableRefObject<{ d: number; done: boolean }>;
  /** Index (in route.stops) of the stop the boat last reached */
  stop: number;
  /** Faint background routes (all tours) when nothing is selected */
  ghosts: BuiltRoute[];
  picked: string[];
  selected: string | null;
  departure: string;
  locale: "it" | "en";
  onPlace: (id: string) => void;
  /** Changes when the view should re-frame (new route, departure…) */
  focusKey: string;
  /** Screen area covered by UI (px): framing keeps content inside the rest */
  inset: { left: number; top: number; bottom: number };
}

export const ROUTE_COLOR = "#ff6a3d";
export const KIND_COLOR: Record<string, string> = {
  port: "#12303b",
  grotto: "#2f7fb5",
  rock: "#b86b3c",
  bay: "#2a9d8f",
  cape: "#7a5ea8",
  beach: "#d99a2b",
  village: "#c2547a",
};
