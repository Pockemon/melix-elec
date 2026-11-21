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
  /** t = 0 assemblé, t = 1 décomposé. */
  explode(t: number): void;
}

/** Un objet = groupe de parts + explode(t). Même API pour le procédural et pour un GLB. */
export function makeObjet(parts: Part[], cfg: ObjetConfig['explode']): Objet {
  const group = new THREE.Group();
  const state = parts.map((p) => {
    p.mesh.position.copy(p.home);
    group.add(p.mesh);
    return { mesh: p.mesh, home: p.home.clone(), dir: p.dir.clone().normalize(), axis: p.spinAxis ?? new THREE.Vector3(0, 1, 0), mag: p.mag ?? 1, base: p.mesh.quaternion.clone() };
  });
  return {
    group,
    explode(t) {
      for (const s of state) {
        s.mesh.position.copy(s.home).addScaledVector(s.dir, t * cfg.distance * s.mag);
        s.mesh.quaternion.copy(s.base);
        s.mesh.rotateOnAxis(s.axis, t * cfg.twist);
      }
    },
  };
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
    return { dir: new THREE.Vector3(0, 0, d), mag: Math.abs(d), material: name === 'ring' ? mats.black : mats.white };
  }
  if (id === 'etagere') {
    const n = Number(/(\d+)/.exec(name)?.[1] ?? 1);
    return { dir: new THREE.Vector3(c.x, c.y, 0.3), spinAxis: new THREE.Vector3(0, 0, 1), material: [mats.white, mats.gold, mats.black][(n - 1) % 3] };
  }
  const tranche = Number(/_s(\d+)/.exec(name)?.[1] ?? 2);
  return { dir: new THREE.Vector3(c.x, (tranche - 2.5) * 0.25, c.z), material: mats.white };
}

/** Charge un GLB : recentré (boîte englobante), mis à l'échelle OBJET_HEIGHT ; chaque nœud devient une part pivotant sur son centre. */
export async function loadGlb(url: string, id: ObjetConfig['id'], cfg: ObjetConfig['explode']): Promise<Objet> {
  const { scene } = await (await loader()).loadAsync(url);
  scene.updateMatrixWorld(true);
  let root: THREE.Object3D = scene;
  while (root.children.length === 1 && !(root.children[0] as THREE.Mesh).isMesh) root = root.children[0];
  [...root.children].forEach((n) => scene.attach(n));
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
  // Éclatement proportionnel à la hauteur de l'objet (unités locales : hauteur = size.y).
  const obj = makeObjet(parts, { distance: cfg.distance * size.y, twist: cfg.twist });
  obj.group.scale.setScalar(OBJET_HEIGHT / size.y);
  return obj;
}
