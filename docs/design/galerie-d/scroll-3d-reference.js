import * as THREE from 'three';

// ---------- scène ----------
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
camera.position.set(0, 0.6, 7.5);

// lumière : key chaude (tungstène), rim or, fill froid discret — cohérent avec la DA anthracite / bronze / or
scene.add(new THREE.HemisphereLight(0x4a4b55, 0x15161a, 1.6));
const key = new THREE.DirectionalLight(0xffe2b8, 2.2); key.position.set(3, 4, 4); key.intensity = 3.0; scene.add(key);
const rim = new THREE.DirectionalLight(0xc9a24b, 2.6); rim.position.set(-4, 2, -3); scene.add(rim);
const fill = new THREE.DirectionalLight(0x6f86a8, 0.5); fill.position.set(-2, -1, 4); scene.add(fill);

const PLA_WHITE = new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.62, metalness: 0.02, flatShading: true });
const PLA_BLACK = new THREE.MeshStandardMaterial({ color: 0x1b1c20, roughness: 0.55, metalness: 0.05, flatShading: true });
const PLA_GOLD = new THREE.MeshStandardMaterial({ color: 0xc9a24b, roughness: 0.45, metalness: 0.35, flatShading: true });
const PLA_BRONZE = new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.5, metalness: 0.3, flatShading: true });

/**
 * Un « objet » = groupe de parts. Chaque part mémorise sa position assemblée et une direction d'éclatement.
 * explode(t) : t=0 assemblé, t=1 décomposé. spin(a) : rotation d'ensemble.
 * Remplacement prévu : les GLB réels des pièces (export GPS, une part = un mesh) via GLTFLoader — même API.
 */
function makeObject(parts) {
  const g = new THREE.Group();
  for (const p of parts) {
    p.mesh.position.copy(p.home);
    p.mesh.userData.baseRot = p.mesh.rotation.clone();
    p.mesh.userData.home = p.home.clone();
    p.mesh.userData.dir = p.dir.clone().normalize();
    p.mesh.userData.spinAxis = p.spinAxis || new THREE.Vector3(0, 1, 0);
    g.add(p.mesh);
  }
  g.userData.explode = (t) => {
    for (const m of g.children) {
      const d = m.userData.dir, h = m.userData.home;
      m.position.set(h.x + d.x * t * 1.1, h.y + d.y * t * 1.1, h.z + d.z * t * 1.1);
      m.rotation.copy(m.userData.baseRot);
      m.rotateOnAxis(m.userData.spinAxis, t * 0.7);
    }
  };
  return g;
}

// 1 — Étagères hexagonales : 3 alvéoles en nid d'abeille, 3 teintes
function hexShelves() {
  const parts = [];
  const r = 0.95, depth = 0.7;
  const centers = [new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(-r * 1.5 * 0.577 * 1.73, -0.3, 0), new THREE.Vector3(r * 1.5 * 0.577 * 1.73, -0.3, 0)];
  const mats = [PLA_WHITE, PLA_GOLD, PLA_BLACK];
  centers.forEach((c, i) => {
    const outer = new THREE.CylinderGeometry(r, r, depth, 6, 1, false);
    const inner = new THREE.CylinderGeometry(r * 0.82, r * 0.82, depth + 0.02, 6, 1, false);
    const shape = new THREE.Shape();
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + Math.PI / 6; k ? shape.lineTo(Math.cos(a) * r, Math.sin(a) * r) : shape.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const hole = new THREE.Path();
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + Math.PI / 6; k ? hole.lineTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82) : hole.moveTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82); }
    shape.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    geo.translate(0, 0, -depth / 2);
    const mesh = new THREE.Mesh(geo, mats[i]);
    parts.push({ mesh, home: c, dir: c.clone().add(new THREE.Vector3(0, 0, 0.3)), spinAxis: new THREE.Vector3(0, 0, 1) });
  });
  return makeObject(parts);
}

// 2 — Lampe Vague : corps noir + 7 strates ondulées blanches (diffuseur)
function waveLamp() {
  const parts = [];
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.35, 10), PLA_BLACK);
  parts.push({ mesh: base, home: new THREE.Vector3(0, -1.3, 0), dir: new THREE.Vector3(0, -1, 0) });
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const rad = 0.75 + Math.sin(t * Math.PI * 1.6) * 0.3;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(rad, 0.13, 6, 24), i % 2 ? PLA_WHITE : PLA_WHITE);
    ring.rotation.x = Math.PI / 2;
    const y = -0.95 + i * 0.33;
    parts.push({ mesh: ring, home: new THREE.Vector3(0, y, 0), dir: new THREE.Vector3(Math.sin(i * 2.1) * 0.35, (i - 3) * 0.45, Math.cos(i * 2.1) * 0.35), spinAxis: new THREE.Vector3(0, 0, 1) });
  }
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.2, 10), PLA_BRONZE);
  parts.push({ mesh: cap, home: new THREE.Vector3(0, 1.3, 0), dir: new THREE.Vector3(0, 1, 0) });
  return makeObject(parts);
}

// 3 — Casse-noisette 60 cm : corps low-poly découpé en 5 tranches par GPS (le découpage est le sujet)
function nutcrackerSplit() {
  const parts = [];
  const slices = [
    { h: 0.5, r1: 0.9, r2: 1.0, mat: PLA_BLACK },   // socle
    { h: 0.8, r1: 0.7, r2: 0.9, mat: PLA_WHITE },   // jambes
    { h: 0.9, r1: 0.8, r2: 0.7, mat: PLA_GOLD },    // buste
    { h: 0.6, r1: 0.55, r2: 0.8, mat: PLA_WHITE },  // tête
    { h: 0.5, r1: 0.5, r2: 0.55, mat: PLA_BRONZE }, // chapeau
  ];
  let y = -1.6;
  slices.forEach((s, i) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(s.r1, s.r2, s.h, 7), s.mat);
    const home = new THREE.Vector3(0, y + s.h / 2, 0);
    parts.push({ mesh, home, dir: new THREE.Vector3((i % 2 ? 1 : -1) * 0.25, (i - 2) * 0.55, 0.15), spinAxis: new THREE.Vector3(0, 1, 0) });
    y += s.h;
  });
  return makeObject(parts);
}

const objects = [hexShelves(), waveLamp(), nutcrackerSplit()];
objects.forEach((o) => { o.visible = false; o.scale.setScalar(0.78); scene.add(o); });

// ---------- liaison au scroll ----------
const track = document.getElementById('track');   // piste horizontale
const pin = document.getElementById('pin');       // section épinglée (hauteur = N écrans)
const panels = [...document.querySelectorAll('.panel')];
const N = panels.length;
const hud = document.getElementById('hud-progress');
const chapNums = [...document.querySelectorAll('.idx span')];

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  camera.position.z = w < 700 ? 9.5 : 7.5;
}
addEventListener('resize', resize); resize();

let target = 0, current = 0, lastT = performance.now();
const smooth = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
function readScroll() {
  const rect = pin.getBoundingClientRect();
  const total = pin.offsetHeight - innerHeight;
  target = Math.min(1, Math.max(0, -rect.top / total));
}
addEventListener('scroll', readScroll, { passive: true }); readScroll();

function frame(now = performance.now()) {
  const dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
  current += (target - current) * Math.min(1, dt * 6);
  const p = current;                                // 0..1 sur toute la piste
  const seg = p * (N - 1);                          // position continue en panneaux
  const i = Math.min(N - 1, Math.floor(seg));
  const local = seg - i;                            // 0..1 à l'intérieur du panneau courant

  // piste horizontale (sweet-tape : vertical → horizontal)
  // la piste ne glisse que sur le dernier tiers de chaque segment : la pièce se décompose d'abord, puis on passe à la suivante
  const maxX = track.scrollWidth - innerWidth;
  const stepped = (i + smooth((local - 0.66) / 0.34)) / (N - 1);
  track.style.transform = `translate3d(${-Math.min(1, stepped) * maxX}px,0,0)`;

  // objet 3D courant : tourne en continu, se décompose sur la première moitié, se recompose sur la seconde
  objects.forEach((o, k) => { o.visible = k === i || (k === i + 1 && local > 0.66); });
  const o = objects[i];
  o.rotation.y = p * Math.PI * 4 + i * 0.6;
  o.rotation.x = Math.sin(p * Math.PI * 2) * 0.18;
  const explode = Math.sin(Math.min(1, local / 0.72) * Math.PI); // 0 → 1 → 0 sur les deux premiers tiers
  o.userData.explode(explode);
  o.position.x = innerWidth < 700 ? 0 : 1.1;        // à droite du texte sur desktop
  o.position.y = innerWidth < 700 ? 0.9 : -0.1;
  if (objects[i + 1] && objects[i + 1].visible) { objects[i + 1].userData.explode(0); objects[i + 1].rotation.y = p * Math.PI * 4; objects[i + 1].position.copy(o.position); objects[i + 1].position.x += (1 - smooth((local - 0.66) / 0.34)) * 12; o.position.x -= smooth((local - 0.66) / 0.34) * 12; }
  // le canvas n'est visible que pendant la section épinglée
  const r = pin.getBoundingClientRect();
  canvas.style.opacity = r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.4 ? '1' : '0';

  if (hud) hud.style.width = `${p * 100}%`;
  panels.forEach((el, k) => el.classList.toggle('on', k === i));
  chapNums.forEach((el, k) => el.classList.toggle('on', k === i));
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
frame();
