import { damp, explode, renderMode, segment, slide, stepped } from './scroll-core';

const hasWebgl = (): boolean => {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
};

/** Section épinglée : défilement vertical → piste horizontale, pièces 3D qui tournent et se décomposent. */
export async function initGalerie(): Promise<void> {
  const pin = document.getElementById('pin') as HTMLElement;
  const gal = pin; // [data-section="galerie"]
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  gal.dataset.reducedMotion = String(reduced);
  const mode = renderMode(location.search, hasWebgl());
  if (mode === 'liste') {
    gal.dataset.galerieMode = 'liste';
    gal.classList.add('galerie--liste');
    return;
  }

  const canvas = document.getElementById('gl') as HTMLCanvasElement;
  const track = document.getElementById('track') as HTMLElement;
  const hud = document.getElementById('hud-progress') as HTMLElement;
  const panels = [...track.querySelectorAll('.panel')];
  const marks = [...document.querySelectorAll('.idx span')];
  const count = panels.length;

  const { createScene } = await import('./scene/scene');
  const scene = createScene(canvas);
  gal.classList.add('galerie--gl');
  gal.dataset.galerieMode = reduced ? '3d-statique' : '3d';
  if (reduced) gal.classList.add('galerie--statique');
  gal.dataset.galerieIndex = '0';

  let target = 0;
  let current = 0;
  let last = performance.now();
  let raf = 0;
  let visible = false;

  const readScroll = () => {
    const total = pin.offsetHeight - innerHeight;
    target = Math.min(1, Math.max(0, -pin.getBoundingClientRect().top / total));
  };

  const frame = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    current = damp(current, target, 6, dt);
    const { i, local } = segment(current, count);
    const s = slide(local);
    const maxX = track.scrollWidth - innerWidth;
    track.style.transform = `translate3d(${-stepped(i, local, count) * maxX}px,0,0)`;
    scene.render({ i, progress: current, explode: reduced ? 0 : explode(local), slide: s, mobile: innerWidth < 700 });
    hud.style.width = `${current * 100}%`;
    panels.forEach((el, k) => el.classList.toggle('on', k === i));
    marks.forEach((el, k) => el.classList.toggle('on', k === i));
    gal.dataset.galerieIndex = String(i);
    raf = visible ? requestAnimationFrame(frame) : 0;
  };
  const start = () => {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };

  // pas d'animation hors viewport : la boucle ne tourne que pendant la section épinglée, le canvas n'est visible que là
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    canvas.style.opacity = visible ? '1' : '0';
    if (visible) {
      readScroll();
      start();
    }
  }).observe(pin);
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', () => {
    scene.resize();
    readScroll();
  });
  readScroll();
}
