import * as THREE from 'three';
import type { ObjetConfig } from './config';
import { type Objet, type Part, makeObjet } from './objet';
import { palette } from './materials';
const { white: PLA_WHITE, black: PLA_BLACK, gold: PLA_GOLD, bronze: PLA_BRONZE } = palette(true);
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
type Cfg = ObjetConfig['explode'];

// 1 — Étagères hexagonales : 3 alvéoles en nid d'abeille, 3 teintes
function hexShelves(cfg: Cfg): Objet {
  const r = 0.95;
  const depth = 0.7;
  const dx = r * 1.5 * 0.577 * 1.73;
  const centers = [V(0, 0.55, 0), V(-dx, -0.3, 0), V(dx, -0.3, 0)];
  const mats = [PLA_WHITE, PLA_GOLD, PLA_BLACK];
  const hex = <T extends THREE.Path>(radius: number, path: T): T => {
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
      if (k) path.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
      else path.moveTo(Math.cos(a) * radius, Math.sin(a) * radius);
    }
    return path;
  };
  const parts: Part[] = centers.map((c, i) => {
    const shape = hex(r, new THREE.Shape());
    shape.holes.push(hex(r * 0.82, new THREE.Path()));
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    geo.translate(0, 0, -depth / 2);
    return { mesh: new THREE.Mesh(geo, mats[i]), home: c, dir: c.clone().add(V(0, 0, 0.3)), spinAxis: V(0, 0, 1) };
  });
  return makeObjet(parts, cfg);
}

// 2 — Lampe Vague : socle noir, 7 strates ondulées blanches (diffuseur), bague bronze
function waveLamp(cfg: Cfg): Objet {
  const parts: Part[] = [{ mesh: new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.35, 10), PLA_BLACK), home: V(0, -1.3, 0), dir: V(0, -1, 0) }];
  for (let i = 0; i < 7; i++) {
    const rad = 0.75 + Math.sin((i / 6) * Math.PI * 1.6) * 0.3;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.13, 6, 24), PLA_WHITE);
    ring.rotation.x = Math.PI / 2;
    parts.push({ mesh: ring, home: V(0, -0.95 + i * 0.33, 0), dir: V(Math.sin(i * 2.1) * 0.35, (i - 3) * 0.45, Math.cos(i * 2.1) * 0.35), spinAxis: V(0, 0, 1) });
  }
  parts.push({ mesh: new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.2, 10), PLA_BRONZE), home: V(0, 1.3, 0), dir: V(0, 1, 0) });
  return makeObjet(parts, cfg);
}

// 3 — Casse-noisette : corps low-poly découpé en 5 tranches (le découpage est le sujet)
function nutcracker(cfg: Cfg): Objet {
  const slices = [
    { h: 0.5, r1: 0.9, r2: 1.0, mat: PLA_BLACK },
    { h: 0.8, r1: 0.7, r2: 0.9, mat: PLA_WHITE },
    { h: 0.9, r1: 0.8, r2: 0.7, mat: PLA_GOLD },
    { h: 0.6, r1: 0.55, r2: 0.8, mat: PLA_WHITE },
    { h: 0.5, r1: 0.5, r2: 0.55, mat: PLA_BRONZE },
  ];
  let y = -1.6;
  const parts: Part[] = slices.map((s, i) => {
    const part = { mesh: new THREE.Mesh(new THREE.CylinderGeometry(s.r1, s.r2, s.h, 7), s.mat), home: V(0, y + s.h / 2, 0), dir: V((i % 2 ? 1 : -1) * 0.25, (i - 2) * 0.55, 0.15) };
    y += s.h;
    return part;
  });
  return makeObjet(parts, cfg);
}

export function buildProcedural(id: ObjetConfig['id'], cfg: Cfg): Objet {
  return id === 'etagere' ? hexShelves(cfg) : id === 'lampe' ? waveLamp(cfg) : nutcracker(cfg);
}
