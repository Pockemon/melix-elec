import * as THREE from 'three';
import { OBJETS, modelUrl } from './config';
import { OBJET_HEIGHT, type Objet, loadGlb } from './objet';
import { buildProcedural } from './procedural';

export interface Frame {
  /** Panneau courant, progression globale, éclatement 0..1 et glissement 0..1 du segment. */
  i: number;
  progress: number;
  explode: number;
  slide: number;
  mobile: boolean;
}

export interface SceneHandle {
  resize(): void;
  render(f: Frame): void;
}

const SCALE = 0.78;
// Mobile : objet borné à la moitié haute de l'écran, au-dessus du bloc texte (Figma 72:24).
const MOBILE_SCALE = 0.6;

export function createScene(canvas: HTMLCanvasElement): SceneHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.6, 7.5);

  // Lumières : key chaude (tungstène), rim or, fill froid discret.
  scene.add(new THREE.HemisphereLight(0x4a4b55, 0x15161a, 1.6));
  const key = new THREE.DirectionalLight(0xffe2b8, 3.0);
  key.position.set(3, 4, 4);
  const rim = new THREE.DirectionalLight(0xc9a24b, 2.6);
  rim.position.set(-4, 2, -3);
  const fill = new THREE.DirectionalLight(0x6f86a8, 0.5);
  fill.position.set(-2, -1, 4);
  scene.add(key, rim, fill);

  const place = (obj: Objet) => {
    obj.group.visible = false;
    obj.group.scale.multiplyScalar(SCALE);
    obj.group.userData.base = obj.group.scale.x;
    scene.add(obj.group);
    return obj;
  };
  const objets: Objet[] = OBJETS.map((o) => place(buildProcedural(o.id, { distance: o.explode.distance * OBJET_HEIGHT, twist: o.explode.twist })));
  // GLB réels : remplacent le repli procédural dès qu'ils sont chargés (même API explode).
  OBJETS.forEach((o, k) => {
    const url = modelUrl(o);
    if (!url) return;
    loadGlb(url, o.id, o.explode).then(
      (glb) => {
        scene.remove(objets[k].group);
        objets[k] = place(glb);
      },
      () => { /* repli procédural conservé */ },
    );
  });

  const resize = () => {
    const w = innerWidth;
    const h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    camera.position.z = w < 700 ? 9.5 : 7.5;
  };
  resize();

  return {
    resize,
    render(f) {
      objets.forEach((x, k) => { x.group.visible = k === f.i || (k === f.i + 1 && f.slide > 0); });
      objets.forEach((x) => x.group.scale.setScalar(x.group.userData.base * (f.mobile ? MOBILE_SCALE : 1)));
      const o = objets[f.i];
      const next = objets[f.i + 1];
      // à droite du texte sur desktop, centré au-dessus du texte sur mobile
      const baseX = f.mobile ? 0 : 1.1;
      const baseY = f.mobile ? 0.9 : -0.1;
      o.group.rotation.set(Math.sin(f.progress * Math.PI * 2) * 0.18, f.progress * Math.PI * 4 + f.i * 0.6, 0);
      o.explode(f.explode);
      o.group.position.set(baseX - f.slide * 12, baseY, 0);
      if (next && f.slide > 0) {
        next.explode(0);
        next.group.rotation.set(0, f.progress * Math.PI * 4, 0);
        next.group.position.set(baseX + (1 - f.slide) * 12, baseY, 0);
      }
      renderer.render(scene, camera);
    },
  };
}
