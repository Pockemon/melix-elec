import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  RingGeometry,
  Scene,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  TextureLoader,
  WebGLRenderer,
} from 'three';
import {
  cameraAzimuth,
  clamp,
  damp,
  fitPhoto,
  indexToProgress,
  nicheAzimuth,
  nicheCount,
  parseOeuvres,
  progressToIndex,
  renderMode,
  workNiche,
  type Oeuvre,
} from './galerie-core';

const OS = '#F3EFE7';
const GRAPHITE = '#1E1F1D';
const CUIVRE = '#B4703A';
const BLANC_CASSE = '#FAF8F3';
const PIERRE = '#CFC9BE';

const R = 6.4; // rayon de la salle
const H = 4.6; // hauteur sous plafond
const NICHE_W = 2.6;
const NICHE_STRAIGHT = 2.4;
const NICHE_BASE = 0.2;
const BACK = R - 0.3; // distance du fond de niche à l'axe
const FRAME_Y = 1.75;
const DOLLY = 2.4; // la caméra avance vers l'œuvre : elle décrit un cercle en parcourant la salle

function webglSupported(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function archShape(width: number, straight: number): Shape {
  const s = new Shape();
  s.moveTo(-width / 2, 0);
  s.lineTo(-width / 2, straight);
  s.absarc(0, straight, width / 2, Math.PI, 0, true);
  s.lineTo(width / 2, 0);
  s.closePath();
  return s;
}

function cartelTexture(o: Oeuvre): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 768;
  c.height = 160;
  const g = c.getContext('2d')!;
  g.fillStyle = BLANC_CASSE;
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = CUIVRE;
  g.lineWidth = 3;
  g.strokeRect(6, 6, c.width - 12, c.height - 12);
  g.fillStyle = GRAPHITE;
  g.textAlign = 'center';
  g.font = '500 38px Inter, system-ui, sans-serif';
  g.fillText(o.titre, c.width / 2, 74);
  g.fillStyle = '#55564F';
  g.font = '400 30px Inter, system-ui, sans-serif';
  g.fillText(`${o.matiere} · ${o.annee}`, c.width / 2, 124);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function haloTexture(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,244,222,0.9)');
  grad.addColorStop(0.45, 'rgba(255,244,222,0.28)');
  grad.addColorStop(1, 'rgba(255,244,222,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return new CanvasTexture(c);
}

export function initGalerie(): void {
  const section = document.querySelector<HTMLElement>('[data-section="galerie"]');
  const canvas = document.getElementById('galerie-canvas') as HTMLCanvasElement | null;
  const piste = document.getElementById('galerie-piste');
  const scene3d = document.getElementById('galerie-scene');
  const ui = document.getElementById('galerie-ui');
  const compteur = document.getElementById('galerie-compteur');
  if (!section || !canvas || !piste || !scene3d || !ui || !compteur) return;

  const oeuvres = parseOeuvres(section.querySelectorAll('li[data-oeuvre]'));
  const count = oeuvres.length;
  if (count === 0) return;
  if (renderMode(location.search, webglSupported()) === 'liste') return; // repli liste, déjà dans le DOM

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch {
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(new Color(OS));

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  section.classList.add('galerie--gl');
  if (reduced) section.classList.add('galerie--statique');
  section.style.setProperty('--n', String(count));
  canvas.hidden = false;
  ui.hidden = false;

  const niches = nicheCount(count);
  const scene = new Scene();
  scene.background = new Color(OS);
  const camera = new PerspectiveCamera(48, 1, 0.1, 40);

  // Lumière : ciel clair, rebond pierre, une source fixe au plafond (le halo ne suit jamais la caméra).
  scene.add(new HemisphereLight(0xffffff, new Color(PIERRE), 0.95));
  const lustre = new PointLight(0xfff1dc, 14, 0, 2);
  lustre.position.set(0, H - 0.5, 0);
  scene.add(lustre);

  const mat = (color: string, side = 0 as 0 | 2) => new MeshStandardMaterial({ color, roughness: 1, metalness: 0, side });

  const floor = new Mesh(new CircleGeometry(R, 72), mat(PIERRE));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const inlay = new Mesh(new RingGeometry(3.15, 3.19, 96), new MeshBasicMaterial({ color: CUIVRE }));
  inlay.rotation.x = -Math.PI / 2;
  inlay.position.y = 0.004;
  scene.add(inlay);

  const wall = new Mesh(new CylinderGeometry(R, R, H, 96, 1, true), mat(BLANC_CASSE, DoubleSide));
  wall.position.y = H / 2;
  scene.add(wall);
  const skirting = new Mesh(new CylinderGeometry(R - 0.01, R - 0.01, 0.14, 96, 1, true), mat(GRAPHITE, DoubleSide));
  skirting.position.y = 0.07;
  scene.add(skirting);
  const ceiling = new Mesh(new CircleGeometry(R, 72), mat('#ECE7DC'));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = H;
  scene.add(ceiling);
  const halo = new Mesh(
    new PlaneGeometry(5.6, 5.6),
    new MeshBasicMaterial({ map: haloTexture(), transparent: true, depthWrite: false, blending: AdditiveBlending }),
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = H - 0.02;
  scene.add(halo);

  // Niches en arche : fond en retrait, moulure en relief, cadre blanc fin filet cuivre, cartel dessous.
  const archBack = new ShapeGeometry(archShape(NICHE_W, NICHE_STRAIGHT));
  const outer = archShape(NICHE_W + 0.5, NICHE_STRAIGHT + 0.25);
  outer.holes.push(archShape(NICHE_W, NICHE_STRAIGHT));
  const molding = new ExtrudeGeometry(outer, { depth: 0.3, bevelEnabled: false });
  const backMat = mat('#DDD7CB');
  const moldMat = mat('#F6F2EA');
  const frameMat = mat('#FFFFFF');
  const filetMat = new MeshBasicMaterial({ color: CUIVRE });
  const loader = new TextureLoader();
  const photos: Mesh[] = [];

  for (let k = 0; k < niches; k++) {
    const g = new Group();
    g.rotation.y = -nicheAzimuth(k, niches);
    const back = new Mesh(archBack, backMat);
    back.position.set(0, NICHE_BASE, -BACK);
    const mold = new Mesh(molding, moldMat);
    mold.position.set(0, NICHE_BASE, -BACK);
    g.add(back, mold);

    const w = Array.from({ length: count }, (_, i) => i).find((i) => workNiche(i, count, niches) === k);
    if (w !== undefined) {
      const o = oeuvres[w];
      const { w: pw, h: ph } = fitPhoto(o.ratio, 2.0, 2.1);
      const zf = -(BACK - 0.12);
      const frame = new Mesh(new BoxGeometry(pw + 0.12, ph + 0.12, 0.05), frameMat);
      frame.position.set(0, FRAME_Y, zf);
      const filet = new Mesh(new PlaneGeometry(pw + 0.03, ph + 0.03), filetMat);
      filet.position.set(0, FRAME_Y, zf + 0.0255);
      const photo = new Mesh(new PlaneGeometry(pw, ph), new MeshBasicMaterial({ color: '#E9E4D9' }));
      photo.position.set(0, FRAME_Y, zf + 0.0265);
      photos[w] = photo;
      const cartel = new Mesh(new PlaneGeometry(1.5, 0.3125), new MeshBasicMaterial({ map: cartelTexture(o) }));
      cartel.position.set(0, FRAME_Y - ph / 2 - 0.06 - 0.22, zf + 0.01);
      g.add(frame, filet, photo, cartel);
    }
    scene.add(g);
  }

  // Chargement progressif : l'œuvre courante d'abord, puis les autres une à une.
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const queue = oeuvres.map((_, i) => i);
  let current = 0;
  const loadNext = () => {
    queue.sort((a, b) => Math.abs(a - current) - Math.abs(b - current));
    const i = queue.shift();
    if (i === undefined) return;
    loader.load(
      oeuvres[i].src,
      (tex) => {
        tex.colorSpace = SRGBColorSpace;
        tex.anisotropy = maxAniso;
        const m = photos[i].material as MeshBasicMaterial;
        m.map = tex;
        m.color.set('#FFFFFF');
        m.needsUpdate = true;
        invalidate();
        loadNext();
      },
      undefined,
      loadNext,
    );
  };

  // Navigation : le défilement de la page pilote la caméra ; en mouvement réduit, seuls les boutons.
  const metrics = () => {
    const top = parseFloat(getComputedStyle(scene3d).top) || 0;
    const r = piste.getBoundingClientRect();
    const total = Math.max(1, r.height - scene3d.offsetHeight);
    return { top, r, total };
  };
  let stateIndex = 0;
  let cur = 0;
  const targetIndex = (): number => {
    if (reduced) return stateIndex;
    const { top, r, total } = metrics();
    return progressToIndex(clamp((top - r.top) / total), count);
  };
  const goTo = (w: number) => {
    const i = clamp(Math.round(w), 0, count - 1);
    if (reduced) {
      stateIndex = i;
      invalidate();
      return;
    }
    const { top, r, total } = metrics();
    const absTop = r.top + window.scrollY;
    window.scrollTo({ top: absTop - top + indexToProgress(i, count) * total, behavior: 'smooth' });
  };
  ui.querySelector('[data-galerie-prev]')!.addEventListener('click', () => goTo(Math.round(reduced ? stateIndex : cur) - 1));
  ui.querySelector('[data-galerie-next]')!.addEventListener('click', () => goTo(Math.round(reduced ? stateIndex : cur) + 1));

  // Glissé horizontal : traduit en défilement, la caméra reste liée à la page.
  if (!reduced) {
    let lastX: number | null = null;
    canvas.addEventListener('pointerdown', (e) => {
      lastX = e.clientX;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (lastX === null) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      const { total } = metrics();
      window.scrollBy(0, (-dx * (total / Math.max(1, count - 1))) / (canvas.clientWidth * 0.6));
    });
    const end = () => {
      lastX = null;
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
  }

  let label = -1;
  const updateLabel = (i: number) => {
    if (i === label) return;
    label = i;
    compteur.textContent = `${String(i + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')} · ${oeuvres[i].titre}`;
  };

  // Rendu à la demande : aucune image tant que rien ne bouge.
  let raf = 0;
  let last = 0;
  function invalidate() {
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function frame(now: number) {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 0.05) || 0.016;
    last = now;
    const target = targetIndex();
    cur = reduced ? target : damp(cur, target, 7, dt);
    const settled = Math.abs(cur - target) < 0.0005;
    if (settled) cur = target;
    const az = cameraAzimuth(cur, count, niches);
    camera.position.set(Math.sin(az) * DOLLY, 1.6, -Math.cos(az) * DOLLY);
    camera.rotation.set(0, -az, 0);
    current = clamp(Math.round(cur), 0, count - 1);
    updateLabel(current);
    renderer.render(scene, camera);
    if (!settled) invalidate();
  }

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Portrait : champ vertical élargi pour garder la même largeur visible.
    const half = Math.atan(Math.tan((24 * Math.PI) / 180) / Math.min(1, camera.aspect));
    camera.fov = Math.min(70, (2 * half * 180) / Math.PI);
    camera.updateProjectionMatrix();
    invalidate();
  };
  new ResizeObserver(resize).observe(canvas);
  if (!reduced) window.addEventListener('scroll', invalidate, { passive: true });
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    section.classList.remove('galerie--gl', 'galerie--statique');
    canvas.hidden = true;
    ui.hidden = true;
  });
  void (document.fonts?.ready ?? Promise.resolve()).then(() => {
    invalidate();
  });
  resize();
  loadNext();
}
