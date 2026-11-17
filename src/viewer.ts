import { Box3, Group, Mesh, PlaneGeometry, ShadowMaterial, Vector3 } from 'three';
import { createStage } from './stage';

declare const __HAS_MODEL__: boolean;

const MODEL_URL = `${import.meta.env.BASE_URL}models/casse-noisette.glb`;

/**
 * Visionneuse du casse-noisette. Tant que public/models/casse-noisette.glb n'existe
 * pas au build, rien n'est requêté : l'image de repli et le badge restent affichés.
 */
export async function initViewer(): Promise<void> {
  if (!__HAS_MODEL__) return;
  const canvas = document.getElementById('viewer-canvas') as HTMLCanvasElement | null;
  const fallback = document.getElementById('viewer-fallback') as HTMLElement | null;
  const caption = document.querySelector<HTMLElement>('#viewer figcaption');
  if (!canvas || !fallback) return;

  canvas.hidden = false;
  const s = createStage(canvas, 30);
  if (!s) {
    canvas.hidden = true;
    return;
  }

  let model: Group;
  try {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    model = (await new GLTFLoader().loadAsync(MODEL_URL)).scene;
  } catch {
    canvas.hidden = true;
    return;
  }
  fallback.hidden = true;
  if (caption) caption.textContent = 'Modèle 3D interactif · glissez pour tourner';

  const box = new Box3().setFromObject(model);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const scale = 5 / Math.max(size.x, size.y, size.z);
  model.scale.setScalar(scale);
  model.position.sub(center.multiplyScalar(scale));
  model.position.y += (size.y * scale) / 2;
  model.traverse((o) => {
    if ((o as Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  const holder = new Group();
  holder.add(model);
  s.scene.add(holder);

  const ground = new Mesh(new PlaneGeometry(14, 14), new ShadowMaterial({ opacity: 0.18 }));
  ground.rotation.x = -Math.PI / 2;
  s.scene.add(ground);
  ground.receiveShadow = true;

  s.camera.position.set(0, 3.2, 11);
  s.camera.lookAt(0, 2.5, 0);

  // Orbite au pointeur / tactile (le défilement vertical reste possible : touch-action pan-y).
  let target = 0.4;
  let yaw = target;
  let drag: number | null = null;
  canvas.addEventListener('pointerdown', (e) => {
    drag = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (drag === null) return;
    target += (e.clientX - drag) * 0.01;
    drag = e.clientX;
  });
  const end = () => (drag = null);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  s.start((dt) => {
    if (!reduced && drag === null) target += dt * 0.25;
    yaw += (target - yaw) * Math.min(1, dt * 8);
    holder.rotation.y = yaw;
  });
}
