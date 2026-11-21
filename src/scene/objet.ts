import * as THREE from 'three';
import type { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACO_PATH, type ObjetConfig } from './config';

/** Une part : maillage, position assemblée (home), direction d'éclatement (dir), axe de rotation propre (spinAxis). */
export interface Part {
  mesh: THREE.Object3D;
  home: THREE.Vector3;
  dir: THREE.Vector3;
  spinAxis?: THREE.Vector3;
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
    return { mesh: p.mesh, home: p.home.clone(), dir: p.dir.clone().normalize(), axis: p.spinAxis ?? new THREE.Vector3(0, 1, 0), base: p.mesh.quaternion.clone() };
  });
  return {
    group,
    explode(t) {
      for (const s of state) {
        s.mesh.position.copy(s.home).addScaledVector(s.dir, t * cfg.distance);
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

/** Charge un GLB : chaque enfant direct de la scène devient une part, poussée depuis le centre de l'objet. */
export async function loadGlb(url: string, cfg: ObjetConfig['explode']): Promise<Objet> {
  const { scene } = await (await loader()).loadAsync(url);
  const box = new THREE.Box3().setFromObject(scene);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const k = 3.2 / Math.max(size.x, size.y, size.z);
  const parts: Part[] = [...scene.children].map((mesh) => {
    const c = new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3());
    const dir = c.clone().sub(center).add(new THREE.Vector3(0, 0, 0.3));
    mesh.position.sub(center);
    return { mesh, home: mesh.position.clone(), dir };
  });
  const obj = makeObjet(parts, cfg);
  obj.group.scale.setScalar(k);
  return obj;
}
