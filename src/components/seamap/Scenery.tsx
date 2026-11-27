"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { DOMES, PLACES, TOWNS } from "@/data/map-places";
import type { RoutesData } from "./route";
import { SEA_Y, heightAt, lngLatToXZ, rng, slopeAt, yOf, type World } from "./world";

interface Inst { x: number; y: number; z: number; sx: number; sy: number; sz: number; rot: number; color: string }

/** One InstancedMesh fed from a list of transforms + colours */
function Instances({ items, children, castShadow }: { items: Inst[]; children: React.ReactNode; castShadow?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color(), e = new THREE.Euler();
    items.forEach((it, i) => {
      q.setFromEuler(e.set(0, it.rot, 0));
      mesh.setMatrixAt(i, m.compose(p.set(it.x, it.y, it.z), q, s.set(it.sx, it.sy, it.sz)));
      mesh.setColorAt(i, c.set(it.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} castShadow={castShadow}>
      {children}
    </instancedMesh>
  );
}

const WALLS = ["#fff6e2", "#ffe6b0", "#ffd39a", "#ffbf96", "#f7a98f", "#ffe08a", "#fff1dc", "#ffcfc0", "#ffffff"];
const STEEP_WALLS = ["#ffb79c", "#ffd86e", "#ff9f82", "#fff1dc", "#ffe39a", "#f58f74", "#ffffff", "#ffc7b8", "#ffcf7a"]; // Positano & co.: louder pastels

function useHouses(data: RoutesData, w: World) {
  return useMemo(() => {
    const r = rng(11);
    const walls: Inst[] = [], roofs: Inst[] = [];
    for (const town of TOWNS) {
      const [cx, cz] = lngLatToXZ(data, w, town.lng, town.lat);
      const rad = (town.r * 1000) / 100;
      const maxSlope = town.steep ? 1.6 : 0.75;
      const palette = town.steep ? STEEP_WALLS : WALLS;
      let placed = 0, tries = 0;
      while (placed < town.n && tries < town.n * 14) {
        tries++;
        // denser in the centre, thinning out towards the edge
        const a = r() * Math.PI * 2, d = Math.min(1, Math.sqrt(-Math.log(1 - r() * 0.97)) / 1.9) * rad;
        const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
        const m = heightAt(w, x, z);
        if (m < 3 || m > 520 || slopeAt(w, x, z) > maxSlope) continue;
        const sx = 0.38 + r() * 0.34, sz = 0.32 + r() * 0.3, sy = 0.3 + r() * (town.steep ? 0.5 : 0.35);
        const y = yOf(m) - 0.12; // sink a little into the slope
        const rot = Math.round(r() * 4) * (Math.PI / 2) + (r() - 0.5) * 0.3;
        walls.push({ x, y: y + sy / 2, z, sx, sy, sz, rot, color: palette[Math.floor(r() * palette.length)] });
        roofs.push({ x, y: y + sy + 0.02, z, sx: sx * 1.02, sy: 0.05, sz: sz * 1.02, rot, color: r() < 0.25 ? "#c9875f" : "#e9e1d3" });
        placed++;
      }
    }
    return { walls, roofs };
  }, [data, w]);
}

function useTrees(data: RoutesData, w: World) {
  return useMemo(() => {
    const r = rng(5);
    const townsXZ = TOWNS.map((t) => ({ p: lngLatToXZ(data, w, t.lng, t.lat), rad: (t.r * 1000) / 100 }));
    const pines: Inst[] = [], trunks: Inst[] = [], cypress: Inst[] = [], bushes: Inst[] = [];
    // smooth pseudo-noise → groves and clearings instead of uniform dots
    const noise = (x: number, z: number) => Math.sin(x * 0.11) * Math.cos(z * 0.13) + Math.sin(x * 0.037 + z * 0.051) * 0.8 + Math.cos(z * 0.21 - x * 0.07) * 0.4;
    let tries = 0;
    while (pines.length + cypress.length + bushes.length < 5200 && tries < 60000) {
      tries++;
      const x = (r() - 0.5) * w.width, z = (r() - 0.5) * w.depth;
      const m = heightAt(w, x, z);
      if (m < 12 || m > 1050) continue;
      const slope = slopeAt(w, x, z);
      if (slope > 1.1 && r() < 0.75) continue; // a few brave ones on the cliffs
      if (noise(x, z) < -0.2 + r() * 0.6) continue;
      if (townsXZ.some((t) => Math.hypot(t.p[0] - x, t.p[1] - z) < t.rad * 0.75)) continue;
      const y = yOf(m) - 0.05;
      const kind = r();
      const greens = ["#4f7d3a", "#5c8a42", "#3f6b33", "#6b9446", "#55803c"];
      const g = greens[Math.floor(r() * greens.length)];
      if (kind < (m > 450 ? 0.3 : 0.1)) {
        const h = 0.8 + r() * 0.6;
        cypress.push({ x, y: y + h / 2, z, sx: 0.32, sy: h, sz: 0.32, rot: 0, color: "#3e6b35" });
      } else if (kind < 0.6) {
        const s = 0.65 + r() * 0.5;
        trunks.push({ x, y: y + 0.35, z, sx: 0.08, sy: 0.7, sz: 0.08, rot: 0, color: "#7a5a3f" });
        pines.push({ x, y: y + 0.75, z, sx: s, sy: s * 0.38, sz: s, rot: r() * 6, color: g });
      } else {
        const s = 0.35 + r() * 0.3; // olives & lemon groves
        bushes.push({ x, y: y + s * 0.5, z, sx: s, sy: s * 0.8, sz: s, rot: r() * 6, color: r() < 0.3 ? "#8fae5a" : "#7c9d58" });
      }
    }
    return { pines, trunks, cypress, bushes };
  }, [data, w]);
}

function useBoats(data: RoutesData, w: World) {
  return useMemo(() => {
    const r = rng(3);
    const hulls: Inst[] = [], sails: Inst[] = [];
    const harbours = PLACES.filter((p) => p.kind === "port" || p.kind === "bay");
    for (const h of harbours) {
      const [ax, az] = lngLatToXZ(data, w, ...data.anchors[h.id]);
      const n = h.kind === "port" ? 7 : 3;
      for (let i = 0; i < n; i++) {
        const x = ax + (r() - 0.5) * 5, z = az + (r() - 0.5) * 5;
        if (heightAt(w, x, z) > -2) continue;
        hulls.push({ x, y: SEA_Y + 0.08, z, sx: 0.9, sy: 0.18, sz: 0.32, rot: r() * 6, color: r() < 0.7 ? "#ffffff" : "#f3ead8" });
      }
    }
    // a few yachts under sail in open water
    let tries = 0;
    while (sails.length < 18 && tries < 400) {
      tries++;
      const x = (r() - 0.5) * w.width * 0.9, z = (r() - 0.5) * w.depth * 0.9;
      if (heightAt(w, x, z) > -25) continue;
      const rot = r() * 6;
      hulls.push({ x, y: SEA_Y + 0.08, z, sx: 1.1, sy: 0.2, sz: 0.36, rot, color: "#ffffff" });
      sails.push({ x, y: SEA_Y + 0.9, z, sx: 0.06, sy: 1.5, sz: 0.7, rot, color: "#fffaf0" });
    }
    return { hulls, sails };
  }, [data, w]);
}

const sailGeo = (() => {
  const g = new THREE.BufferGeometry();
  // triangular sail in the local y/z plane, centred
  g.setAttribute("position", new THREE.Float32BufferAttribute([0, -0.5, -0.5, 0, 0.5, 0.05, 0, -0.5, 0.45], 3));
  g.computeVertexNormals();
  return g;
})();

export function Scenery({ data, w }: { data: RoutesData; w: World }) {
  const houses = useHouses(data, w);
  const trees = useTrees(data, w);
  const boats = useBoats(data, w);
  const domes = useMemo(
    () => DOMES.map((d) => {
      const [x, z] = lngLatToXZ(data, w, d.lng, d.lat);
      return { x, z, y: yOf(Math.max(4, heightAt(w, x, z))) };
    }),
    [data, w]
  );
  return (
    <group>
      <Instances items={houses.walls}>
        <boxGeometry />
        <meshStandardMaterial roughness={0.85} />
      </Instances>
      <Instances items={houses.roofs}>
        <boxGeometry />
        <meshStandardMaterial roughness={0.9} />
      </Instances>
      <Instances items={trees.trunks}>
        <cylinderGeometry args={[0.5, 0.6, 1, 5]} />
        <meshStandardMaterial roughness={1} />
      </Instances>
      <Instances items={trees.pines}>
        <sphereGeometry args={[0.5, 10, 6]} />
        <meshStandardMaterial roughness={0.95} />
      </Instances>
      <Instances items={trees.cypress}>
        <coneGeometry args={[0.5, 1, 7]} />
        <meshStandardMaterial roughness={0.95} />
      </Instances>
      <Instances items={trees.bushes}>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial roughness={1} flatShading />
      </Instances>
      <Instances items={boats.hulls}>
        <capsuleGeometry args={[0.5, 1, 3, 8]} />
        <meshStandardMaterial roughness={0.4} />
      </Instances>
      <Instances items={boats.sails}>
        <primitive object={sailGeo} attach="geometry" />
        <meshStandardMaterial side={THREE.DoubleSide} roughness={0.7} />
      </Instances>
      {domes.map((d, i) => (
        <group key={i} position={[d.x, d.y, d.z]}>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.55, 0.6, 0.9, 16]} />
            <meshStandardMaterial color="#fbefe0" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <sphereGeometry args={[0.55, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#2f8c6e" roughness={0.35} metalness={0.15} />
          </mesh>
          <mesh position={[0, 1.55, 0]}>
            <coneGeometry args={[0.1, 0.4, 8]} />
            <meshStandardMaterial color="#e7c25a" metalness={0.4} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
