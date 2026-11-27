"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls, Line } from "@react-three/drei";
import * as THREE from "three";
import { PLACES } from "@/data/map-places";
import { toUnit, type LngLat } from "./route";
import { durationOf, sample } from "./useBoat";
import { KIND_COLOR, ROUTE_COLOR, type MapViewProps } from "./types";
import { SEA_Y, UNIT, VEX, type World } from "./world";
import { Scenery } from "./Scenery";

const ROUTE_Y = 0.5;

function useWorld(data: MapViewProps["data"]) {
  const [world, setWorld] = useState<World | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/map/terrain.bin")
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        if (!alive) return;
        const raw = new Int16Array(buf);
        setWorld({ W: data.grid.w, H: data.grid.h, width: data.widthM / UNIT, depth: data.heightM / UNIT, heights: Float32Array.from(raw) });
      });
    return () => { alive = false; };
  }, [data]);
  return world;
}

const toWorld = (data: MapViewProps["data"], w: World, ll: LngLat, y = ROUTE_Y) => {
  const [u, v] = toUnit(data, ll);
  return new THREE.Vector3((u - 0.5) * w.width, y, (v - 0.5) * w.depth);
};

// ─── Terrain ───
const ramp = (stops: [number, string][], x: number, out: THREE.Color) => {
  if (x <= stops[0][0]) return out.set(stops[0][1]);
  for (let i = 1; i < stops.length; i++)
    if (x <= stops[i][0]) {
      const t = (x - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
      return out.set(stops[i - 1][1]).lerp(new THREE.Color(stops[i][1]), t);
    }
  return out.set(stops[stops.length - 1][1]);
};
const SEABED: [number, string][] = [[-120, "#1f5a7e"], [-40, "#2f7ea4"], [-10, "#5fb0c8"], [0, "#c9e6e4"]];
const LAND: [number, string][] = [[0, "#efe2c2"], [8, "#d6deaa"], [120, "#b2cb88"], [350, "#8eaf6e"], [650, "#9a9e7c"], [950, "#c4bca4"], [1200, "#ece6d8"]];

function Terrain({ w }: { w: World }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(w.width, w.depth, w.W - 1, w.H - 1);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let k = 0; k < pos.count; k++) {
      const m = w.heights[k];
      // land starts just above the water, the seabed sits well below it (no z-fighting)
      const y = m >= 0.5 ? 0.22 + (m / UNIT) * VEX : -0.45 + (Math.max(m, -90) / UNIT) * 1.4;
      pos.setY(k, y);
      if (m < 0.5) ramp(SEABED, m, c);
      else ramp(LAND, m, c);
      colors.set([c.r, c.g, c.b], k * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    return g;
  }, [w]);
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.92} metalness={0} flatShading={false} />
    </mesh>
  );
}

const HAZE = "#dcebef";
const FAR = 9000; // sea and sea floor run to the horizon

function Sea() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, SEA_Y, 0]}>
        <planeGeometry args={[FAR, FAR]} />
        <meshStandardMaterial color="#3d9ac0" transparent opacity={0.62} roughness={0.18} metalness={0.1} depthWrite={false} />
      </mesh>
      {/* deep sea floor beyond the relief */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -1.95, 0]}>
        <planeGeometry args={[FAR, FAR]} />
        <meshStandardMaterial color="#6fb4c9" roughness={1} />
      </mesh>
    </group>
  );
}

/** Low-res relief around the map (Gulf of Naples, Vesuvius, Ischia, Salerno): no edge in sight */
function OuterTerrain({ data, w }: { data: MapViewProps["data"]; w: World }) {
  const [geo, setGeo] = useState<THREE.BufferGeometry | null>(null);
  useEffect(() => {
    let alive = true;
    Promise.all([fetch("/map/terrain-outer.json").then((r) => r.json()), fetch("/map/terrain-outer.bin").then((r) => r.arrayBuffer())]).then(
      ([meta, buf]: [{ bbox: { west: number; east: number; south: number; north: number }; w: number; h: number }, ArrayBuffer]) => {
        if (!alive) return;
        const hts = new Int16Array(buf);
        const ib = data.bbox, ob = meta.bbox;
        const sx = w.width / (ib.east - ib.west), sz = w.depth / (ib.north - ib.south);
        const toX = (lng: number) => (lng - ib.west) * sx - w.width / 2;
        const toZ = (lat: number) => (ib.north - lat) * sz - w.depth / 2;
        const g = new THREE.PlaneGeometry((ob.east - ob.west) * sx, (ob.north - ob.south) * sz, meta.w - 1, meta.h - 1);
        g.rotateX(-Math.PI / 2);
        g.translate((toX(ob.west) + toX(ob.east)) / 2, 0, (toZ(ob.north) + toZ(ob.south)) / 2);
        const pos = g.attributes.position as THREE.BufferAttribute;
        const colors = new Float32Array(pos.count * 3);
        const c = new THREE.Color(), haze = new THREE.Color(HAZE);
        const cellX = ((ob.east - ob.west) * sx) / (meta.w - 1), cellZ = ((ob.north - ob.south) * sz) / (meta.h - 1);
        for (let k = 0; k < pos.count; k++) {
          const i = k % meta.w, j = Math.floor(k / meta.w);
          let m = hts[k];
          const land = m >= 0.5;
          // towards the outer rim the land sinks into the haze and the sea turns to deep water
          const edge = Math.min(i, j, meta.w - 1 - i, meta.h - 1 - j) / (meta.w * 0.12);
          const fade = Math.min(1, edge);
          if (fade < 1 && land) m = m * fade + -40 * (1 - fade);
          const x = pos.getX(k), z = pos.getZ(k);
          // hidden under the detailed relief (keep a 1.5-cell overlap so there is no seam)
          const inside = Math.abs(x) < w.width / 2 - cellX * 1.5 && Math.abs(z) < w.depth / 2 - cellZ * 1.5;
          pos.setY(k, inside ? -6 : (m >= 0.5 ? 0.22 + (m / UNIT) * VEX : -0.45 + (Math.max(m, -90) / UNIT) * 1.4) - 0.1);
          if (m < 0.5) ramp(SEABED, m, c);
          else ramp(LAND, m, c);
          if (land) c.lerp(haze, (1 - fade) * 0.6);
          colors.set([c.r, c.g, c.b], k * 3);
        }
        g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        g.computeVertexNormals();
        setGeo(g);
      }
    );
    return () => { alive = false; };
  }, [data, w]);
  if (!geo) return null;
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial vertexColors roughness={0.95} />
    </mesh>
  );
}

/** Haze follows the camera: what you look at stays crisp, the far edges melt away */
function Haze() {
  const scene = useThree((st) => st.scene);
  const controls = useThree((st) => st.controls) as unknown as { distance?: number } | null;
  useFrame(({ camera }) => {
    const f = scene.fog as THREE.Fog | null;
    if (!f) return;
    const d = controls?.distance ?? camera.position.length();
    f.near = d * 0.85;
    f.far = d * 2.4 + 120;
  });
  return null;
}

// ─── Boat ───
function Boat({ p, w }: { p: MapViewProps; w: World }) {
  const ref = useRef<THREE.Group>(null);
  const wake = useRef<THREE.Mesh>(null);
  useFrame(({ clock, camera }) => {
    if (!ref.current || !p.track) return;
    const s = sample(p.track, p.boat.current.d);
    ref.current.position.set(s.x / UNIT - w.width / 2, ROUTE_Y + 0.15 + Math.sin(clock.elapsedTime * 2.4) * 0.05, s.y / UNIT - w.depth / 2);
    const target = -s.heading;
    const cur = ref.current.rotation.y;
    const diff = Math.atan2(Math.sin(target - cur), Math.cos(target - cur));
    ref.current.rotation.y = cur + diff * 0.15;
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.7) * 0.04;
    // stays readable from afar, but doesn't turn into a ferry when the camera comes close
    ref.current.scale.setScalar(Math.min(1.8, Math.max(0.6, ref.current.position.distanceTo(camera.position) * 0.0135)));
    if (wake.current) (wake.current.material as THREE.MeshBasicMaterial).opacity = p.boat.current.done ? 0 : 0.55;
  });
  const hull = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.4, -0.55);
    s.lineTo(0.7, -0.55);
    s.quadraticCurveTo(1.7, -0.5, 2, 0);
    s.quadraticCurveTo(1.7, 0.5, 0.7, 0.55);
    s.lineTo(-1.4, 0.55);
    s.quadraticCurveTo(-1.6, 0, -1.4, -0.55);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.45, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 });
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  return (
    <group ref={ref} scale={1.8}>
      <mesh geometry={hull} castShadow>
        <meshStandardMaterial color="#12303b" roughness={0.5} />
      </mesh>
      <mesh position={[0.2, 0.5, 0]} scale={[1, 0.08, 0.95]}>
        <boxGeometry args={[2.6, 1, 1]} />
        <meshStandardMaterial color="#b5743f" roughness={0.7} />
      </mesh>
      <mesh position={[-0.25, 0.75, 0]}>
        <boxGeometry args={[0.9, 0.42, 0.78]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh ref={wake} position={[-2.6, -0.02, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[2.6, 0.9]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─── Route line ───
function RouteLine({ p, w }: { p: MapViewProps; w: World }) {
  const [pts, dashPts, donePts] = useMemo(() => {
    const at = (y: number) => (p.route ? p.route.points.map((ll) => toWorld(p.data, w, ll, y)) : []);
    return [at(ROUTE_Y), at(ROUTE_Y + 0.04), at(ROUTE_Y + 0.09)];
  }, [p.route, p.data, w]);
  const done = useRef<{ geometry: { instanceCount: number } } | null>(null);
  useFrame(() => {
    const g = done.current?.geometry;
    if (!g || !p.track) return;
    const { cum } = p.track;
    const d = p.boat.current.d;
    let lo = 0, hi = cum.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= d) lo = m; else hi = m; }
    g.instanceCount = d >= p.track.total ? cum.length - 1 : lo;
  });
  if (pts.length < 2) return null;
  return (
    <group>
      <Line points={pts} color="#ffffff" lineWidth={6} transparent opacity={0.85} />
      <Line points={dashPts} color={ROUTE_COLOR} lineWidth={2.2} dashed dashSize={0.8} gapSize={0.6} transparent opacity={0.5} />
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Line ref={done as any} points={donePts} color={ROUTE_COLOR} lineWidth={4.5} />
    </group>
  );
}

function Ghosts({ p, w }: { p: MapViewProps; w: World }) {
  if (p.route) return null;
  return (
    <group>
      {p.ghosts.map((g, i) => (
        <Line key={i} points={g.points.map((ll) => toWorld(p.data, w, ll, ROUTE_Y - 0.1))} color="#ffffff" lineWidth={1.4} dashed dashSize={0.9} gapSize={0.7} transparent opacity={0.7} />
      ))}
    </group>
  );
}

// ─── Places ───
function Places({ p, w, onNear }: { p: MapViewProps; w: World; onNear: (near: boolean) => void }) {
  const inRoute = useMemo(() => new Set(p.route?.stops ?? []), [p.route]);
  const camera = useThree((s) => s.camera);
  const near = useRef(false);
  useFrame(() => {
    const d = camera.position.length();
    if (!near.current && d < 150) { near.current = true; onNear(true); }
    else if (near.current && d > 170) { near.current = false; onNear(false); }
  });
  return (
    <group>
      {PLACES.map((pl) => {
        const pos = toWorld(p.data, w, p.data.anchors[pl.id], SEA_Y);
        const isPort = pl.kind === "port";
        const isPicked = p.picked.includes(pl.id);
        const active = p.selected === pl.id || isPicked || inRoute.has(pl.id);
        const color = isPicked ? ROUTE_COLOR : KIND_COLOR[pl.kind];
        return (
          <group key={pl.id} position={pos}>
            {/* the photo bubble (HTML overlay) sits on top of this little pole */}
            <mesh position={[0, 0.8, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 1.6, 6]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]} onClick={(e) => { e.stopPropagation(); p.onPlace(pl.id); }}>
              <ringGeometry args={[isPort ? 0.55 : 0.4, isPort ? 0.95 : 0.7, 28]} />
              <meshBasicMaterial color={p.departure === pl.id && isPort ? ROUTE_COLOR : color} transparent opacity={active ? 0.95 : 0.7} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Projects every place onto the screen each frame and moves its HTML label there. */
function LabelProjector({ p, w, els }: { p: MapViewProps; w: World; els: React.MutableRefObject<Record<string, HTMLButtonElement | null>> }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const v = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => Object.fromEntries(PLACES.map((pl) => [pl.id, toWorld(p.data, w, p.data.anchors[pl.id], SEA_Y + 1.6)])), [p.data, w]);
  useFrame(() => {
    for (const pl of PLACES) {
      const el = els.current[pl.id];
      if (!el) continue;
      v.copy(pos[pl.id]).project(camera);
      const behind = v.z > 1 || v.z < -1;
      const x = ((v.x + 1) / 2) * size.width;
      const y = ((1 - v.y) / 2) * size.height;
      // bubbles shrink a little when far away, grow when the camera comes close
      const k = Math.max(0.78, Math.min(1.3, 150 / camera.position.distanceTo(pos[pl.id]))) * (size.width < 640 ? 0.72 : 1);
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%) scale(${k.toFixed(3)})`;
      el.style.visibility = behind ? "hidden" : "";
    }
  });
  return null;
}

// ─── Camera framing ───
function Framing({ p, w }: { p: MapViewProps; w: World }) {
  const ref = useRef<CameraControls>(null);
  const screen = useThree((s) => s.size);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const { left, top, bottom } = p.inset;
  // shift the projection centre so the content sits in the area not covered by panels
  useEffect(() => {
    camera.setViewOffset(screen.width, screen.height, -left / 2, (bottom - top) / 2, screen.width, screen.height);
    camera.updateProjectionMatrix();
  }, [camera, screen, left, top, bottom]);
  const scene = useThree((s) => s.scene);
  const visW = Math.max(80, screen.width - left), visH = Math.max(80, screen.height - top - bottom);
  // dev-only helper for visual checks: window.__mapFocus("positano", 40)
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as Record<string, unknown>).__mapFocus = (id: string, d = 40) => {
      const t = toWorld(p.data, w, p.data.anchors[id], 0);
      ref.current?.setLookAt(t.x, d * 0.7, t.z + d * 0.75, t.x, 0, t.z - d * 0.1, false);
    };
    (window as unknown as Record<string, unknown>).__mapScene = scene;
  }, [p.data, w, scene]);
  // the look-at point can't leave the coast, so the camera never wanders off into nothing
  useEffect(() => {
    ref.current?.setBoundary(new THREE.Box3(new THREE.Vector3(-w.width / 2, -2, -w.depth / 2), new THREE.Vector3(w.width / 2, 10, w.depth / 2)));
  }, [w]);
  const fit = useRef<() => void>(() => {});
  fit.current = () => {
    const c = ref.current;
    if (!c) return;
    c.smoothTime = 0.6;
    const lls: LngLat[] = p.route ? p.route.points : PLACES.map((pl) => p.data.anchors[pl.id]);
    const box = new THREE.Box3();
    lls.forEach((ll) => box.expandByPoint(toWorld(p.data, w, ll, 0)));
    box.expandByScalar(p.route ? 6 : 2);
    box.max.y = 8;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    // fit the box inside the free screen area, using the real field of view
    const tanV = Math.tan((camera.fov * Math.PI) / 360);
    const tanVisV = tanV * (visH / screen.height);
    const tanVisH = tanV * (visW / screen.height);
    const dist = Math.max(size.x / 2 / tanVisH, (size.z * 0.62) / tanVisV, 30) * (p.route ? 1.08 : 1.02);
    c.setLookAt(center.x, dist * 0.78, center.z + dist * 0.72, center.x, 0, center.z, true);
  };
  useEffect(() => {
    fit.current();
  }, [p.focusKey, p.route, p.data, w, visW, visH]);

  // ─── Follow cam: rides along with the boat, leans in at the departure and at every stop ───
  const follow = useRef({ on: false, lastD: -1, user: false });
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const mark = () => { follow.current.user = true; };
    c.addEventListener("controlstart", mark);
    return () => c.removeEventListener("controlstart", mark);
  }, []);
  useFrame(() => {
    const c = ref.current, f = follow.current;
    if (!c || !p.route || !p.track) { f.on = false; f.lastD = -1; return; }
    const { d, done } = p.boat.current;
    // a new run (new tour, new departure, "replay"): start following again
    if (d < f.lastD - 1 || (f.lastD < 0 && !done)) { f.on = true; f.user = false; }
    f.lastD = d;
    if (!f.on) return;
    if (f.user) { f.on = false; c.smoothTime = 0.6; return; }
    if (done) { f.on = false; fit.current(); return; }
    const atStop = p.track.stopAt.some((m) => Math.abs(m - d) < 1);
    // aim a little ahead of the boat while sailing: the camera's easing then lands right on it
    const lead = atStop ? 0 : (p.track.total / durationOf(p.track.total)) * 0.8;
    const s = sample(p.track, Math.min(p.track.total, d + lead));
    const bx = s.x / UNIT - w.width / 2, bz = s.y / UNIT - w.depth / 2;
    const dist = Math.min(c.maxDistance, (atStop ? 58 : 95) * (screen.width < 640 ? 1.35 : 1));
    c.smoothTime = atStop ? 1.1 : 0.85;
    c.moveTo(bx, 0, bz, true);
    c.dollyTo(dist, true);
    c.rotatePolarTo(atStop ? 0.92 : 0.78, true);
  });
  return (
    <CameraControls
      ref={ref}
      makeDefault
      minDistance={18}
      maxDistance={430}
      minPolarAngle={0.12}
      maxPolarAngle={Math.PI * 0.42}
      smoothTime={0.6}
      dollyToCursor
    />
  );
}

export default function Map3D(p: MapViewProps & { onReady?: () => void }) {
  const world = useWorld(p.data);
  const labels = useRef<Record<string, HTMLButtonElement | null>>({});
  const [near, setNear] = useState(false);
  const inRoute = new Set(p.route?.stops ?? []);
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#dcebef]">
      {world && (
        <Canvas
          dpr={[1, 1.75]}
          camera={{ position: [0, 260, 240], fov: 38, near: 4, far: 6000 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={() => p.onReady?.()}
        >
          <color attach="background" args={[HAZE]} />
          <fog attach="fog" args={[HAZE, 400, 1200]} />
          <Haze />
          <hemisphereLight args={["#ffffff", "#7aa9b8", 0.85]} />
          <directionalLight position={[-120, 220, -80]} intensity={1.7} color="#fff6e8" />
          <ambientLight intensity={0.25} />
          <Terrain w={world} />
          <Sea />
          <OuterTerrain data={p.data} w={world} />
          <Scenery data={p.data} w={world} />
          <Ghosts p={p} w={world} />
          <RouteLine p={p} w={world} />
          <Places p={p} w={world} onNear={setNear} />
          <LabelProjector p={p} w={world} els={labels} />
          {p.route && p.track && <Boat p={p} w={world} />}
          <Framing p={p} w={world} />
        </Canvas>
      )}
      {world && (
        <div className="pointer-events-none absolute inset-0 z-10">
          {PLACES.map((pl) => {
            const isPort = pl.kind === "port";
            const current = p.route?.stops[p.stop] === pl.id;
            const show = isPort || near || current || p.selected === pl.id || p.picked.includes(pl.id) || (inRoute.has(pl.id) && !!p.route && p.stop >= p.route.stops.length - 1);
            const sel = p.selected === pl.id;
            const color = sel ? ROUTE_COLOR : p.picked.includes(pl.id) ? ROUTE_COLOR : isPort ? "#12303b" : KIND_COLOR[pl.kind];
            const size = isPort ? 46 : 38;
            return (
              <button
                key={pl.id}
                ref={(el) => { labels.current[pl.id] = el; }}
                type="button"
                onClick={() => p.onPlace(pl.id)}
                aria-label={pl.name[p.locale]}
                className="group pointer-events-auto absolute left-0 top-0 flex origin-bottom flex-col items-center"
                style={{ zIndex: sel ? 30 : current ? 20 : isPort ? 10 : 1 }}
              >
                <span
                  className={`mb-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  style={{ background: sel ? ROUTE_COLOR : isPort ? "#12303b" : "rgba(255,255,255,0.96)", color: sel || isPort ? "#fff" : "#12303b" }}
                >
                  {pl.name[p.locale].split(" · ")[0]}
                </span>
                <span
                  className="block overflow-hidden rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-110"
                  style={{ width: size, height: size, border: `3px solid ${color}`, transform: sel || current ? "scale(1.18)" : undefined }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/map/places/${pl.id}-sm.jpg`} alt="" loading="lazy" draggable={false} className="size-full object-cover" />
                </span>
                <span className="-mt-[3px] h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent" style={{ borderTopColor: color }} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
