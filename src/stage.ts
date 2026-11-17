import {
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  PCFSoftShadowMap,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';

export interface Stage {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  /** Boucle : `tick(dt)` appelé à chaque image tant que le canvas est visible. */
  start(tick: (dt: number) => void): void;
  render(): void;
}

export function createStage(canvas: HTMLCanvasElement, fov: number): Stage | null {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new PerspectiveCamera(fov, 1, 0.1, 100);

  // Lumière studio douce : ciel chaud, rebond sable, clé latérale qui projette l'ombre de contact.
  scene.add(new HemisphereLight(0xfff3e6, 0xe9d3bd, 1.3));
  scene.add(new AmbientLight(0xffffff, 0.35));
  const key = new DirectionalLight(0xfff0e0, 2.1);
  key.position.set(3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 6, bottom: -2, near: 1, far: 20 });
  scene.add(key);

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  const render = () => renderer.render(scene, camera);

  const start = (tick: (dt: number) => void) => {
    let inView = true;
    let raf = 0;
    let last = performance.now();
    const active = () => inView && !document.hidden;
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      tick(dt);
      render();
      raf = active() ? requestAnimationFrame(loop) : 0;
    };
    const wake = () => {
      if (active() && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    // Rendu en pause hors écran et onglet masqué.
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      wake();
    }).observe(canvas);
    document.addEventListener('visibilitychange', wake);
    raf = requestAnimationFrame(loop);
  };

  return { scene, camera, renderer, start, render };
}
