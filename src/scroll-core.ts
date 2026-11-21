// Logique pure de la section épinglée (sans three ni DOM) : testable sous vitest.

/** Fraction du segment après laquelle la piste glisse vers le panneau suivant (dernier tiers). */
export const SLIDE_START = 2 / 3;
/** Fraction du segment sur laquelle la pièce se décompose puis se recompose. */
export const EXPLODE_SPAN = 0.72;

export const clamp = (v: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, v));
export const smoothstep = (x: number): number => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};

/** Progression lissée indépendante de la cadence : amortissement exponentiel. */
export const damp = (current: number, target: number, lambda: number, dt: number): number =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

/** Progression de la section (0..1) → panneau courant et avancement local (0..1) dans son segment. Un segment par panneau. */
export function segment(progress: number, count: number): { i: number; local: number } {
  const seg = clamp(progress) * count;
  const i = Math.min(count - 1, Math.floor(seg));
  return { i, local: seg - i };
}

/** Éclatement 0 → 1 → 0 sur les deux premiers tiers du segment. */
export const explode = (local: number): number => Math.sin(Math.min(1, local / EXPLODE_SPAN) * Math.PI);

/** Avancement du glissement horizontal (0 avant le dernier tiers, 1 à la fin du segment). */
export const slide = (local: number): number => smoothstep((local - SLIDE_START) / (1 - SLIDE_START));

/** Position de la piste (0..1 de sa course) : panneau i plus glissement ; le dernier panneau ne glisse pas. */
export const stepped = (i: number, local: number, count: number): number =>
  count < 2 ? 0 : clamp((i + (i < count - 1 ? slide(local) : 0)) / (count - 1));

/** `?webgl=off` force le repli liste ; sinon on suit la détection réelle. */
export function renderMode(search: string, webglSupported: boolean): 'webgl' | 'liste' {
  if (new URLSearchParams(search).get('webgl') === 'off') return 'liste';
  return webglSupported ? 'webgl' : 'liste';
}
