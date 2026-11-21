// Logique pure de la galerie (sans three ni DOM) : testable sous vitest.

export interface Oeuvre {
  src: string;
  alt: string;
  titre: string;
  matiere: string;
  annee: string;
  /** Rapport largeur / hauteur de la photo, lu sur les attributs width/height. */
  ratio: number;
}

/** Nombre de niches de la salle : 6 à 8, à intervalle régulier. */
export function nicheCount(oeuvres: number): number {
  if (oeuvres >= 6) return Math.min(oeuvres, 8);
  return 8 % oeuvres === 0 ? 8 : 6;
}

/** Azimut (rad) de la niche k : intervalle régulier sur le cercle. */
export const nicheAzimuth = (k: number, niches: number): number => (k * 2 * Math.PI) / niches;

/** Niche qui reçoit l'œuvre w : œuvres réparties régulièrement parmi les niches. */
export const workNiche = (w: number, oeuvres: number, niches: number): number => Math.round((w * niches) / oeuvres);

/** Azimut de la caméra pour un indice d'œuvre fractionnaire (interpolation entre deux œuvres). */
export function cameraAzimuth(index: number, oeuvres: number, niches: number): number {
  const lo = Math.floor(index);
  const t = index - lo;
  const a = nicheAzimuth(workNiche(lo, oeuvres, niches), niches);
  const b = nicheAzimuth(workNiche(lo + 1, oeuvres, niches), niches);
  return a + (b - a) * t;
}

export const clamp = (v: number, lo = 0, hi = 1): number => Math.min(hi, Math.max(lo, v));
export const smootherstep = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);

/** Progression du défilement (0..1) → indice d'œuvre fractionnaire, avec temps de pause sur chaque œuvre. */
export function progressToIndex(progress: number, oeuvres: number): number {
  if (oeuvres < 2) return 0;
  const x = clamp(progress) * (oeuvres - 1);
  const f = Math.min(Math.floor(x), oeuvres - 2);
  return f + smootherstep(x - f);
}

/** Position de défilement (0..1) qui place la caméra exactement sur l'œuvre w. */
export const indexToProgress = (w: number, oeuvres: number): number => (oeuvres < 2 ? 0 : clamp(w / (oeuvres - 1)));

/** Amortissement exponentiel indépendant de la cadence. */
export const damp = (current: number, target: number, lambda: number, dt: number): number =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

/** Dimensions de la photo dans le cadre, bornées à la niche. */
export function fitPhoto(ratio: number, maxW: number, maxH: number): { w: number; h: number } {
  const w = Math.min(maxW, maxH * ratio);
  return { w, h: w / ratio };
}

/** `?webgl=off` force le repli liste (test de la détection) ; sinon on suit la détection réelle. */
export function renderMode(search: string, webglSupported: boolean): 'webgl' | 'liste' {
  if (new URLSearchParams(search).get('webgl') === 'off') return 'liste';
  return webglSupported ? 'webgl' : 'liste';
}

export function parseOeuvres(items: ArrayLike<Element>): Oeuvre[] {
  return Array.from(items).map((li) => {
    const img = li.querySelector('img')!;
    const txt = (sel: string) => li.querySelector(sel)?.textContent?.trim() ?? '';
    const w = Number(img.getAttribute('width')) || 4;
    const h = Number(img.getAttribute('height')) || 5;
    return {
      src: img.getAttribute('src') ?? '',
      alt: img.getAttribute('alt') ?? '',
      titre: txt('[data-cartel-titre]'),
      matiere: txt('[data-cartel-matiere]'),
      annee: txt('[data-cartel-annee]'),
      ratio: w / h,
    };
  });
}
