import * as THREE from 'three';
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACO_PATH, type ObjetConfig } from './config';
import { palette } from './materials';

/** Hauteur de scène d'un objet (celle des objets procéduraux) : tout GLB est ramené à cette hauteur. */
export const OBJET_HEIGHT = 3.2;

/** Une part : maillage, position assemblée (home), direction d'éclatement (dir), axe de rotation propre (spinAxis). */
export interface Part {
  mesh: THREE.Object3D;
  home: THREE.Vector3;
  dir: THREE.Vector3;
  spinAxis?: THREE.Vector3;
  /** Fraction (0..1) de la distance d'éclatement appliquée à cette part (défaut 1). */
  mag?: number;
}

export interface Objet {
  group: THREE.Group;
  /** Échelle propre (ex. mise à la taille de scène d'un GLB), appliquée avant l'ajustement à l'écran. */
  unit: number;
  /** Axe de la rotation continue : vertical par défaut, horizontal pour la lampe (strates étalées gauche-droite). */
  spin: THREE.Vector3;
  /** t = 0 assemblé, t = 1 décomposé. */
  explode(t: number): void;
}

/** Un objet = groupe de parts + explode(t). Même API pour le procédural et pour un GLB. */
export function makeObjet(parts: Part[], cfg: ObjetConfig['explode'], spin = new THREE.Vector3(0, 1, 0)): Objet {
  const group = new THREE.Group();
  const state = parts.map((p) => {
    p.mesh.position.copy(p.home);
    group.add(p.mesh);
    return { mesh: p.mesh, home: p.home.clone(), dir: p.dir.clone().normalize(), axis: p.spinAxis ?? new THREE.Vector3(0, 1, 0), mag: p.mag ?? 1, base: p.mesh.quaternion.clone() };
  });
  return {
    group,
    unit: 1,
    spin: spin.clone().normalize(),
    explode(t) {
      for (const s of state) {
        s.mesh.position.copy(s.home).addScaledVector(s.dir, t * cfg.distance * s.mag);
        s.mesh.quaternion.copy(s.base);
        s.mesh.rotateOnAxis(s.axis, t * cfg.twist);
      }
    },
  };
}

/** Zone centrale droite en unités de scène (desktop) : largeur et hauteur max de l'objet éclaté, quel que soit l'angle de rotation. */
export const SCREEN_LIMIT = { w: 3.2, h: 2.8 };

/** Emprise à l'écran (w, h) de l'objet à l'échelle courante : max sur t = 0 et t = 1, centrée sur l'origine de rotation, rotation continue incluse. */
export function screenExtent(obj: Objet): { w: number; h: number } {
  const g = obj.group;
  const saved = { p: g.position.clone(), q: g.quaternion.clone() };
  g.position.set(0, 0, 0);
  g.quaternion.identity();
  let along = 0;
  let radial = 0;
  const box = new THREE.Box3();
  const c = new THREE.Vector3();
  for (const t of [0, 1]) {
    obj.explode(t);
    g.updateMatrixWorld(true);
    box.setFromObject(g);
    for (let k = 0; k < 8; k++) {
      c.set(k & 1 ? box.max.x : box.min.x, k & 2 ? box.max.y : box.min.y, k & 4 ? box.max.z : box.min.z);
      const a = c.dot(obj.spin);
      along = Math.max(along, Math.abs(a));
      radial = Math.max(radial, c.addScaledVector(obj.spin, -a).length());
    }
  }
  obj.explode(0);
  g.position.copy(saved.p);
  g.quaternion.copy(saved.q);
  g.updateMatrixWorld(true);
  return obj.spin.x > 0.5 ? { w: 2 * along, h: 2 * radial } : { w: 2 * radial, h: 2 * along };
}

/** Échelle `base` (× unit), réduite si l'objet éclaté sortirait de SCREEN_LIMIT. Retourne l'échelle finale. */
export function fitObjet(obj: Objet, base: number): number {
  obj.group.scale.setScalar(base * obj.unit);
  const { w, h } = screenExtent(obj);
  const k = Math.min(1, SCREEN_LIMIT.w / w, SCREEN_LIMIT.h / h);
  obj.group.scale.setScalar(base * obj.unit * k);
  return obj.group.scale.x;
}

let gltf: Promise<GLTFLoader> | null = null;
// Chargé à la demande : sans GLB réel, ni GLTFLoader ni le décodeur Draco ne sont téléchargés.
function loader(): Promise<GLTFLoader> {
  gltf ??= Promise.all([import('three/examples/jsm/loaders/GLTFLoader.js'), import('three/examples/jsm/loaders/DRACOLoader.js')]).then(
    ([g, d]) => new g.GLTFLoader().setDRACOLoader(new d.DRACOLoader().setDecoderPath(DRACO_PATH)),
  );
  return gltf;
}

type Place = { dir: THREE.Vector3; mag?: number; spinAxis?: THREE.Vector3; material: THREE.Material };

/** Direction d'éclatement et matériau d'une part, selon l'objet (docs/design/galerie-d/models/README.md). */
function placement(id: ObjetConfig['id'], name: string, c: THREE.Vector3, mats: ReturnType<typeof palette>): Place {
  if (id === 'lampe') {
    const k = Number(/(\d+)/.exec(name)?.[1] ?? 0);
    const d = name === 'ring' ? 0 : (k - 10.5) / 10.5;
    return { dir: new THREE.Vector3(d, 0, 0), mag: Math.abs(d), material: name === 'ring' ? mats.black : mats.white };
  }
  if (id === 'etagere') {
    const n = Number(/(\d+)/.exec(name)?.[1] ?? 1);
    return { dir: new THREE.Vector3(c.x, c.y, 0.3), spinAxis: new THREE.Vector3(0, 0, 1), material: [mats.white, mats.gold, mats.black][(n - 1) % 3] };
  }
  const tranche = Number(/_s(\d+)/.exec(name)?.[1] ?? 2);
  // Éclatement vertical borné : amplitude totale ≈ 1,5 × hauteur assemblée (extrêmes ±0,27 h).
  return { dir: new THREE.Vector3(0, tranche - 2.5, 0), mag: (Math.abs(tranche - 2.5) / 2.5) * 0.6, material: mats.white };
}

/** Charge un GLB : recentré (boîte englobante), mis à l'échelle OBJET_HEIGHT ; chaque nœud devient une part pivotant sur son centre. */
export async function loadGlb(url: string, id: ObjetConfig['id'], cfg: ObjetConfig['explode']): Promise<Objet> {
  const { scene } = await (await loader()).loadAsync(url);
  let root: THREE.Object3D = scene;
  while (root.children.length === 1 && !(root.children[0] as THREE.Mesh).isMesh) root = root.children[0];
  [...root.children].forEach((n) => scene.attach(n));
  // Lampe : strates (axe z du GLB) ramenées sur l'axe x de l'écran.
  if (id === 'lampe') scene.children.forEach((n) => n.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI / 2)));
  scene.updateMatrixWorld(true);
  const nodes = [...scene.children];
  const box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const mats = palette(false);
  const parts: Part[] = nodes.map((node) => {
    const c = new THREE.Box3().setFromObject(node).getCenter(new THREE.Vector3());
    const rel = c.clone().sub(center);
    const pl = placement(id, node.name, rel, mats);
    node.traverse((o) => { if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).material = pl.material; });
    node.position.sub(c);
    const pivot = new THREE.Group();
    pivot.add(node);
    return { mesh: pivot, home: rel, dir: pl.dir, spinAxis: pl.spinAxis, mag: pl.mag };
  });
  // Mise à l'échelle sur la plus grande dimension ; éclatement proportionnel à celle-ci (unités locales).
  const big = Math.max(size.x, size.y, size.z);
  const obj = makeObjet(parts, { distance: cfg.distance * big, twist: cfg.twist }, id === 'lampe' ? new THREE.Vector3(1, 0, 0) : undefined);
  obj.unit = OBJET_HEIGHT / big;
  obj.group.scale.setScalar(obj.unit);
  return obj;
}
