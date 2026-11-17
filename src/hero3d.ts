import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  DodecahedronGeometry,
  Box3,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  ShadowMaterial,
  Vector3,
} from 'three';
import { createStage } from './stage';

const mat = (color: number) => new MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, flatShading: true });
const C = {
  cream: mat(0xf7ebd9),
  apricot: mat(0xf3c9a8),
  rose: mat(0xefcfc8),
  sage: mat(0xd7dec9),
  sand: mat(0xeadbc3),
  dark: mat(0x6e5a4d),
};

interface Piece {
  group: Group;
  /** Décalage de la vue éclatée (unités monde). */
  explode: Vector3;
  /** Plage de progression [début, fin] sur laquelle la pièce s'assemble. */
  span: [number, number];
}

function part(geo: BufferGeometry, material: MeshStandardMaterial, y: number, x = 0): Mesh {
  const m = new Mesh(geo, material);
  m.position.set(x, y, 0);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Tenon : petit cylindre à facettes, visible entre deux pièces tant qu'elles sont écartées. */
function tenon(y: number, x = 0, z = 0): Mesh {
  const t = part(new CylinderGeometry(0.09, 0.09, 0.5, 6), C.dark, y, x);
  t.position.z = z;
  return t;
}

function buildFigure() {
  const root = new Group();
  const pieces: Piece[] = [];
  const add = (children: Mesh[], explode: [number, number, number], span: [number, number], at: [number, number, number] = [0, 0, 0]) => {
    const group = new Group();
    children.forEach((c) => group.add(c));
    group.position.set(...at);
    root.add(group);
    pieces.push({ group, explode: new Vector3(...explode), span });
    return group;
  };
  const rest = new Map<Group, Vector3>();

  // Socle
  add([part(new CylinderGeometry(1.25, 1.4, 0.3, 8), C.sand, 0.15), tenon(0.4, -0.4), tenon(0.4, 0.4)], [0, -0.4, 0], [0, 0.2]);
  // Jambes
  add([part(new BoxGeometry(0.5, 1.7, 0.55), C.apricot, 1.15, -0.4), tenon(2.05, -0.4)], [-0.5, -0.1, 0.5], [0.1, 0.4]);
  add([part(new BoxGeometry(0.5, 1.7, 0.55), C.apricot, 1.15, 0.4), tenon(2.05, 0.4)], [0.5, -0.1, 0.5], [0.1, 0.4]);
  // Torse
  add(
    [
      part(new CylinderGeometry(0.85, 0.7, 1.7, 6), C.rose, 2.95),
      part(new BoxGeometry(1.5, 0.14, 0.8), C.dark, 2.2),
      part(new BoxGeometry(0.2, 0.2, 0.1), C.cream, 3.1, -0.3),
      part(new BoxGeometry(0.2, 0.2, 0.1), C.cream, 3.1, 0.3),
      part(new BoxGeometry(0.2, 0.2, 0.1), C.cream, 2.65, -0.3),
      part(new BoxGeometry(0.2, 0.2, 0.1), C.cream, 2.65, 0.3),
      tenon(3.9),
    ],
    [0, 0.3, 0.2],
    [0.3, 0.65],
  ).children.slice(2, 6).forEach((b) => (b.position.z = 0.72));
  // Bras
  add([part(new BoxGeometry(0.42, 1.5, 0.45), C.sage, 2.95, -1.35), tenon(3.75, -1.35)], [-1.3, 0.3, 0.2], [0.5, 0.8]);
  add([part(new BoxGeometry(0.42, 1.5, 0.45), C.sage, 2.95, 1.35), tenon(3.75, 1.35)], [1.3, 0.3, 0.2], [0.5, 0.8]);
  // Tête
  add([part(new DodecahedronGeometry(0.62, 0), C.cream, 4.35)], [0, 0.9, 0.3], [0.65, 0.9]);
  // Chapeau : calot + visière
  add(
    [
      part(new CylinderGeometry(0.5, 0.62, 1.1, 6), C.sage, 5.4),
      part(new CylinderGeometry(0.78, 0.78, 0.1, 6), C.apricot, 4.82),
      part(new BoxGeometry(0.6, 0.12, 0.06), C.cream, 5.2),
    ],
    [0, 1.7, 0.2],
    [0.8, 1],
  ).children[2].position.z = 0.5;

  pieces.forEach((p) => rest.set(p.group, p.group.position.clone()));
  return { root, pieces, rest };
}

export function initHero(): void {
  const stage = document.getElementById('hero-stage') as HTMLElement | null;
  const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement | null;
  const fallback = document.getElementById('hero-fallback') as HTMLElement | null;
  if (!stage || !canvas || !fallback) return;

  canvas.hidden = false; // nécessaire pour mesurer le canvas avant de créer le contexte
  const s = createStage(canvas, 28);
  if (!s) {
    canvas.hidden = true; // repli sans WebGL : hero-illustration.png
    return;
  }
  fallback.hidden = true;

  const { root, pieces, rest } = buildFigure();
  const holder = new Group();
  holder.add(root);
  s.scene.add(holder);

  const ground = new Mesh(new PlaneGeometry(14, 14), new ShadowMaterial({ opacity: 0.18 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  s.scene.add(ground);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ease = (t: number) => t * t * (3 - 2 * t);
  const pointer = { x: 0, y: 0 };
  let progress = reduced ? 1 : 0;
  let shown = progress;
  let yaw = 0;

  const scrollProgress = () => Math.min(1, Math.max(0, window.scrollY / Math.max(1, stage.offsetHeight * 0.75)));
  const pose = () => {
    for (const p of pieces) {
      const k = 1 - ease(Math.min(1, Math.max(0, (shown - p.span[0]) / (p.span[1] - p.span[0]))));
      p.group.position.copy(rest.get(p.group)!).addScaledVector(p.explode, k * 1.6);
    }
  };

  // Cadrage sur la boîte englobante de la vue éclatée (marge ~10 % par bord), recalculé au redimensionnement.
  shown = 0;
  pose();
  root.updateMatrixWorld(true);
  const box = new Box3().setFromObject(root);
  shown = progress;
  pose();
  const cy = (box.min.y + box.max.y) / 2;
  const halfH = (box.max.y - box.min.y) / 2;
  const halfW = Math.max(Math.abs(box.min.x), Math.abs(box.max.x), Math.abs(box.min.z), Math.abs(box.max.z));
  const fit = () => {
    const cam = s.camera;
    const t = Math.tan((cam.fov * Math.PI) / 360);
    const usable = 0.8;
    const dist = Math.max(halfH / (t * usable), halfW / (t * cam.aspect * usable)) + halfW;
    cam.position.set(0, cy + 0.4, dist);
    cam.lookAt(0, cy, 0);
    cam.updateMatrixWorld();
  };
  new ResizeObserver(() => {
    fit();
    s.render();
  }).observe(canvas);
  fit();

  if (reduced) {
    pose();
    holder.rotation.y = -0.35;
    s.render();
    s.render();
    return;
  }

  window.addEventListener('scroll', () => (progress = scrollProgress()), { passive: true });
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  stage.addEventListener('pointerleave', () => (pointer.x = pointer.y = 0));
  progress = scrollProgress();

  let t = 0;
  s.start((dt) => {
    t += dt;
    shown += (progress - shown) * Math.min(1, dt * 5);
    pose();
    // Rotation idle douce + parallaxe au pointeur.
    yaw += (pointer.x * 0.7 + Math.sin(t * 0.5) * 0.25 - yaw) * Math.min(1, dt * 3);
    holder.rotation.y = -0.3 + yaw;
    holder.rotation.x += (pointer.y * 0.08 - holder.rotation.x) * Math.min(1, dt * 3);
    root.position.y = Math.sin(t * 1.2) * 0.04 * (1 - shown);
  });
}
