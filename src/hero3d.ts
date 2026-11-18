import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  Box3,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  ShadowMaterial,
  Vector3,
} from 'three';
import { createStage } from './stage';

const mat = (color: number, roughness = 0.9) => new MeshStandardMaterial({ color, roughness, metalness: 0, flatShading: true });
const C = {
  ivory: mat(0xf4f1ea), // casse-noisette entièrement blanc ivoire, mat
  base: mat(0x1b1916), // socle noir
  bronze: mat(0xa8743f), // tenons
};

interface Piece {
  group: Group;
  /** Décalage de la vue éclatée (unités monde). */
  explode: Vector3;
  /** Plage de progression [début, fin] sur laquelle la pièce s'assemble. */
  span: [number, number];
}

function part(geo: BufferGeometry, material: MeshStandardMaterial, y: number, x = 0, z = 0, rotZ = 0): Mesh {
  const m = new Mesh(geo, material);
  m.position.set(x, y, z);
  m.rotation.z = rotZ;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Tenon : petit cylindre à facettes, visible entre deux pièces tant qu'elles sont écartées. */
function tenon(y: number, x = 0, z = 0): Mesh {
  return part(new CylinderGeometry(0.09, 0.09, 0.5, 6), C.bronze, y, x, z);
}

const box = (w: number, h: number, d: number) => new BoxGeometry(w, h, d);
const gem = (r: number, detail = 0) => new IcosahedronGeometry(r, detail);
/** Cylindre à facettes, une face plane vers l'avant (+z), aplati en profondeur. */
function prism(rTop: number, rBottom: number, h: number, sides: number, depth = 1): BufferGeometry {
  const g = new CylinderGeometry(rTop, rBottom, h, sides);
  g.rotateY(Math.PI / sides);
  g.scale(1, 1, depth);
  return g;
}
const ivory = (geo: BufferGeometry, y: number, x = 0, z = 0, rotZ = 0) => part(geo, C.ivory, y, x, z, rotZ);

function buildFigure() {
  const root = new Group();
  const pieces: Piece[] = [];
  const add = (children: Mesh[], explode: [number, number, number], span: [number, number]) => {
    const group = new Group();
    children.forEach((c) => group.add(c));
    root.add(group);
    pieces.push({ group, explode: new Vector3(...explode), span });
  };
  const rest = new Map<Group, Vector3>();

  // Socle noir
  add([part(new CylinderGeometry(1.5, 1.65, 0.3, 8), C.base, 0.15), tenon(0.4, -0.4), tenon(0.4, 0.4)], [0, -0.4, 0], [0, 0.2]);
  // Jambes droites : botte, jambe, tenon
  for (const x of [-0.4, 0.4]) {
    add(
      [ivory(box(0.6, 0.5, 0.95), 0.55, x, 0.12), ivory(box(0.5, 1.3, 0.55), 1.45, x), tenon(2.1, x)],
      [x * 1.25, -0.1, 0.5],
      [0.1, 0.4],
    );
  }
  // Torse : veste, ceinture + boucle, brandebourgs (3 barrettes + brandebourgs latéraux), boutons
  const torso = [
    ivory(prism(0.98, 0.82, 1.7, 8, 0.72), 2.95),
    ivory(box(1.6, 0.18, 0.74), 2.25),
    ivory(box(0.3, 0.24, 0.08), 2.25, 0, 0.4),
    tenon(3.9),
  ];
  for (const [y, w] of [[3.55, 0.95], [3.2, 0.9], [2.85, 0.85]] as const) {
    torso.push(ivory(box(w, 0.09, 0.07), y, 0, 0.6));
    torso.push(ivory(box(0.12, 0.12, 0.1), y, -w / 2, 0.58), ivory(box(0.12, 0.12, 0.1), y, w / 2, 0.58));
  }
  torso.push(ivory(box(0.09, 0.9, 0.06), 3.2, 0, 0.62));
  add(torso, [0, 0.3, 0.2], [0.3, 0.65]);
  // Bras le long du corps : épaulette, épaule, manche, poignet, main ; le bras droit tient le sabre
  for (const s of [-1, 1]) {
    const x = s * 1.25;
    const arm = [
      ivory(box(0.72, 0.12, 0.6), 3.9, x),
      ivory(box(0.18, 0.3, 0.5), 3.74, x + s * 0.34),
      ivory(gem(0.38, 1), 3.62, x),
      ivory(box(0.44, 1.05, 0.46), 3.05, x),
      ivory(box(0.5, 0.12, 0.52), 2.45, x),
      ivory(box(0.38, 0.45, 0.4), 2.17, x),
      ivory(gem(0.24, 1), 1.85, x, 0.04),
      tenon(3.7, x),
    ];
    for (let i = 0; i < 4; i++) arm.push(ivory(box(0.07, 0.22, 0.07), 3.82, x + (i - 1.5) * 0.17, 0.3));
    if (s === 1) {
      // Sabre : lame, garde, pommeau, tenue le long de la jambe
      arm.push(
        ivory(box(0.09, 1.5, 0.2), 1.1, x, 0.3),
        ivory(box(0.1, 0.6, 0.14), 2.15, x, 0.3),
        ivory(box(0.5, 0.1, 0.16), 1.88, x, 0.3),
        ivory(gem(0.12, 0), 2.5, x, 0.3),
      );
    }
    add(arm, [s * 1.3, 0.3, 0.2], [0.5, 0.8]);
  }
  // Tête : crâne facetté, sourcils, nez, moustache, barbe sculptée, favoris, oreilles
  add(
    [
      ivory(gem(0.64, 1), 4.38),
      ivory(box(0.22, 0.07, 0.1), 4.52, -0.22, 0.56),
      ivory(box(0.22, 0.07, 0.1), 4.52, 0.22, 0.56),
      ivory(gem(0.07, 0), 4.43, -0.21, 0.6),
      ivory(gem(0.07, 0), 4.43, 0.21, 0.6),
      ivory(box(0.13, 0.26, 0.2), 4.33, 0, 0.62),
      ivory(box(0.36, 0.1, 0.14), 4.18, -0.17, 0.6, 0.28),
      ivory(box(0.36, 0.1, 0.14), 4.18, 0.17, 0.6, -0.28),
      ivory(gem(0.42, 1), 3.98, 0, 0.3),
      ivory(box(0.12, 0.45, 0.14), 4.15, -0.5, 0.35),
      ivory(box(0.12, 0.45, 0.14), 4.15, 0.5, 0.35),
      ivory(gem(0.15, 0), 4.38, -0.64),
      ivory(gem(0.15, 0), 4.38, 0.64),
    ],
    [0, 0.9, 0.3],
    [0.65, 0.9],
  );
  // Chapeau : grand shako cylindrique (bandeau, plaque, visière, cordon, pompon)
  add(
    [
      ivory(prism(0.6, 0.66, 1.7, 8), 5.6),
      ivory(prism(0.72, 0.72, 0.12, 8), 6.5),
      ivory(prism(0.7, 0.7, 0.14, 8), 4.84),
      ivory(box(0.8, 0.07, 0.42), 4.8, 0, 0.78),
      ivory(box(0.34, 0.42, 0.06), 5.4, 0, 0.64),
      ivory(box(0.16, 0.16, 0.07), 5.4, 0, 0.68),
      ivory(box(0.5, 0.06, 0.06), 5.95, 0, 0.64),
      ivory(new CylinderGeometry(0.05, 0.05, 0.25, 6), 6.7),
      ivory(gem(0.22, 1), 6.9),
    ],
    [0, 1.7, 0.2],
    [0.8, 1],
  );

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

  const ground = new Mesh(new PlaneGeometry(14, 14), new ShadowMaterial({ opacity: 0.22 }));
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

  // Cadrage : boîte de la figurine assemblée (plein cadre) et de la vue éclatée ; la caméra passe de l'une à l'autre selon l'assemblage.
  const measure = (at: number) => {
    shown = at;
    pose();
    root.updateMatrixWorld(true);
    const b = new Box3().setFromObject(root);
    return {
      cy: (b.min.y + b.max.y) / 2,
      halfH: (b.max.y - b.min.y) / 2,
      halfW: Math.max(Math.abs(b.min.x), Math.abs(b.max.x), Math.abs(b.min.z), Math.abs(b.max.z)),
    };
  };
  const exploded = measure(0);
  const built = measure(1);
  shown = progress;
  pose();
  const fit = () => {
    const cam = s.camera;
    const t = Math.tan((cam.fov * Math.PI) / 360);
    const k = ease(Math.min(1, Math.max(0, shown)));
    const lerp = (a: number, b: number) => a + (b - a) * k;
    const cy = lerp(exploded.cy, built.cy);
    const halfH = lerp(exploded.halfH, built.halfH);
    const halfW = lerp(exploded.halfW, built.halfW);
    const usable = 0.86; // marge : inclinaison au pointeur, flottement, perspective
    const top = 0.1; // bande haute libre (fraction du cadre) réservée au repère « PIÈCE 03 / 08 »
    const dist = Math.max(halfH / (t * usable), halfW / (t * cam.aspect * usable)) + halfW;
    const half = t * (dist - halfW); // demi-hauteur visible au plan avant de la figurine
    const look = cy + halfH - half + 2 * half * top; // sommet du chapeau sous la bande haute
    cam.position.set(0, look + 0.4, dist);
    cam.lookAt(0, look, 0);
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
    fit();
    // Rotation idle douce + parallaxe au pointeur.
    yaw += (pointer.x * 0.7 + Math.sin(t * 0.5) * 0.25 - yaw) * Math.min(1, dt * 3);
    holder.rotation.y = -0.3 + yaw;
    holder.rotation.x += (pointer.y * 0.08 - holder.rotation.x) * Math.min(1, dt * 3);
    root.position.y = Math.sin(t * 1.2) * 0.04 * (1 - shown);
  });
}
