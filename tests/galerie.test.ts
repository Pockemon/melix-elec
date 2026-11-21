import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  cameraAzimuth, clamp, damp, fitPhoto, indexToProgress, nicheAzimuth, nicheCount, progressToIndex, renderMode, workNiche,
} from '../src/galerie-core';
import { GAL_TAGLINE, evaluateGalerie, formatGalerie, parseGalerie } from '../scripts/prove-lib.mjs';

const html = readFileSync('index.html', 'utf8');

describe('galerie : géométrie', () => {
  it('6 à 8 niches à intervalle régulier', () => {
    expect(nicheCount(4)).toBe(8);
    expect(nicheCount(3)).toBe(6);
    expect(nicheCount(7)).toBe(7);
    expect(nicheCount(12)).toBe(8);
    const az = Array.from({ length: 8 }, (_, k) => nicheAzimuth(k, 8));
    az.slice(1).forEach((a, i) => expect(a - az[i]).toBeCloseTo(Math.PI / 4));
  });
  it('4 œuvres sur 8 niches : une niche sur deux', () => {
    expect([0, 1, 2, 3].map((w) => workNiche(w, 4, 8))).toEqual([0, 2, 4, 6]);
  });
  it("la caméra est sur l'œuvre aux indices entiers et à mi-chemin entre deux", () => {
    expect(cameraAzimuth(2, 4, 8)).toBeCloseTo(nicheAzimuth(4, 8));
    expect(cameraAzimuth(1.5, 4, 8)).toBeCloseTo(nicheAzimuth(3, 8));
  });
  it('le défilement garde une pause sur chaque œuvre', () => {
    expect(progressToIndex(0, 4)).toBe(0);
    expect(progressToIndex(1, 4)).toBe(3);
    expect(progressToIndex(indexToProgress(2, 4), 4)).toBeCloseTo(2);
    expect(Math.abs(progressToIndex(indexToProgress(1, 4) + 0.01, 4) - 1)).toBeLessThan(0.05);
  });
  it('amortissement et cadrage', () => {
    expect(damp(0, 1, 7, 0.016)).toBeGreaterThan(0);
    expect(damp(0, 1, 7, 10)).toBeCloseTo(1);
    expect(clamp(5)).toBe(1);
    expect(fitPhoto(16 / 9, 2, 2.1).w).toBe(2);
    expect(fitPhoto(4 / 5, 2, 2.1).h).toBeCloseTo(2.1);
  });
});

describe('galerie : détection WebGL forçable', () => {
  it('?webgl=off force le repli liste même avec WebGL', () => {
    expect(renderMode('?webgl=off', true)).toBe('liste');
  });
  it('sans WebGL : repli liste ; avec : webgl', () => {
    expect(renderMode('', false)).toBe('liste');
    expect(renderMode('', true)).toBe('webgl');
  });
});

describe('galerie : page', () => {
  const gal = parseGalerie(html)!;
  it("porte l'accroche et la section [data-section=galerie] avec ≥ 4 œuvres cartel + image réelle", () => {
    expect(html).toContain(GAL_TAGLINE);
    expect(gal.oeuvres.length).toBeGreaterThanOrEqual(4);
    for (const o of gal.oeuvres) {
      expect(o.src).toMatch(/^\/images\/.+\.jpg$/);
      expect([o.alt, o.titre, o.matiere, o.annee].every(Boolean)).toBe(true);
    }
  });
  it("n'embarque plus la figurine ni l'ancienne identité", () => {
    expect(html).not.toMatch(/hero-illustration|hero-canvas|low-poly/);
    expect(readFileSync('src/styles.css', 'utf8')).not.toMatch(/instrument-serif|dm-sans|fontsource/);
  });
});

describe('prove-mx-gal-01', () => {
  const images = parseGalerie(html)!.oeuvres.map((o) => ({ src: o.src, status: 200, type: 'image/jpeg' }));
  const ok = {
    expectedSha: 'abc',
    health: { status: 200, body: JSON.stringify({ status: 'ok', sha: 'abc' }) },
    page: { status: 200, body: html },
    runtime: {
      liste: { mode: 'liste', gl: false, statique: false, reducedMotion: 'false', index: '0' },
      normal: { mode: '3d', gl: true, statique: false, reducedMotion: 'false', index: '0' },
      reduit: { mode: '3d-statique', gl: true, statique: true, reducedMotion: 'true', index: '0' },
    },
    images,
  };
  it('SATISFIED sur la page du dépôt quand health.sha = delivery_sha', () => {
    const line = formatGalerie(evaluateGalerie(ok));
    expect(line).toMatch(/^capability=MX-GAL-01 verdict=SATISFIED proof_nature=runtime-observation/);
  });
  it("NOT_PROVEN si le SHA diffère, si une œuvre manque ou si le code publié n'a pas le mouvement réduit", () => {
    expect(evaluateGalerie({ ...ok, health: { status: 200, body: JSON.stringify({ status: 'ok', sha: 'old' }) } }).verdict).toBe('NOT_PROVEN');
    expect(evaluateGalerie({ ...ok, page: { status: 200, body: html.replace(/<li data-oeuvre>/g, '<li>') } }).verdict).toBe('NOT_PROVEN');
    expect(evaluateGalerie({ ...ok, runtime: {} }).verdict).toBe('NOT_PROVEN');
    expect(evaluateGalerie({ ...ok, runtime: { ...ok.runtime, liste: { ...ok.runtime.liste, mode: '3d', gl: true } } }).verdict).toBe('NOT_PROVEN');
    expect(evaluateGalerie({ ...ok, runtime: { ...ok.runtime, reduit: { ...ok.runtime.reduit, mode: '3d', statique: false } } }).verdict).toBe('NOT_PROVEN');
    expect(evaluateGalerie({ ...ok, images: [] }).verdict).toBe('NOT_PROVEN');
  });
  it('NOT_PROVEN si le site est injoignable', () => {
    expect(evaluateGalerie({ ...ok, health: null, page: null }).verdict).toBe('NOT_PROVEN');
  });
});

describe('polices auto-hébergées', () => {
  const fichiers = [
    'cormorant-garamond-normal-latin', 'cormorant-garamond-normal-latin-ext',
    'cormorant-garamond-italic-latin', 'cormorant-garamond-italic-latin-ext',
    'inter-normal-latin', 'inter-normal-latin-ext',
  ].map((n) => `${n}.woff2`);
  const fontsCss = readFileSync('public/fonts/fonts.css', 'utf8');

  it('les 6 fichiers woff2 existent et fonts.css les référence', () => {
    for (const f of fichiers) {
      expect(existsSync(`public/fonts/${f}`), f).toBe(true);
      expect(fontsCss).toContain(`/fonts/${f}`);
    }
  });
  it('index.html charge fonts.css, sans service tiers ni fontsource', () => {
    expect(html).toContain('href="/fonts/fonts.css"');
    expect(html + readFileSync('package.json', 'utf8')).not.toMatch(/fontsource|googleapis|gstatic/);
    expect(fontsCss).not.toMatch(/https?:\/\//);
  });
});
