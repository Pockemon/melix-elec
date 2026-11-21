import { existsSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { EXPLODE_SPAN, SLIDE_START, clamp, damp, explode, renderMode, segment, slide, smoothstep, stepped } from '../src/scroll-core';
import { OBJETS, modelUrl } from '../src/scene/config';
import { GAL_TAGLINE, evaluateGalerie, formatGalerie, parseGalerie } from '../scripts/prove-lib.mjs';

const html = readFileSync('index.html', 'utf8');

describe('section épinglée : fonctions pures', () => {
  it('segment : un segment par panneau, borné', () => {
    expect(segment(0, 3)).toEqual({ i: 0, local: 0 });
    expect(segment(0.5, 3).i).toBe(1);
    expect(segment(0.5, 3).local).toBeCloseTo(0.5);
    expect(segment(1, 3)).toEqual({ i: 2, local: 1 });
    expect(segment(-1, 3).i).toBe(0);
    expect(segment(9, 3).i).toBe(2);
  });
  it('explode : sin(min(1, local/0.72)·π), 0 → 1 → 0 sur les deux premiers tiers', () => {
    expect(explode(0)).toBeCloseTo(0);
    expect(explode(EXPLODE_SPAN / 2)).toBeCloseTo(1);
    expect(explode(EXPLODE_SPAN)).toBeCloseTo(0);
    expect(explode(1)).toBeCloseTo(0);
    expect(explode(0.2)).toBeCloseTo(Math.sin((0.2 / 0.72) * Math.PI));
  });
  it('slide / stepped : la piste ne bouge que sur le dernier tiers (smoothstep)', () => {
    expect(slide(SLIDE_START)).toBe(0);
    expect(slide(1)).toBe(1);
    expect(slide(SLIDE_START + (1 - SLIDE_START) / 2)).toBeCloseTo(0.5);
    expect(stepped(0, 0.5, 3)).toBe(0);
    expect(stepped(0, 1, 3)).toBeCloseTo(0.5);
    expect(stepped(1, 0, 3)).toBeCloseTo(0.5);
    expect(stepped(1, 1, 3)).toBeCloseTo(1);
    expect(stepped(2, 1, 3)).toBe(1);
    expect(stepped(0, 1, 1)).toBe(0);
  });
  it('damp : progression lissée indépendante de la cadence', () => {
    const at60 = Array.from({ length: 60 }).reduce<number>((c) => damp(c, 1, 6, 1 / 60), 0);
    const at30 = Array.from({ length: 30 }).reduce<number>((c) => damp(c, 1, 6, 1 / 30), 0);
    expect(at60).toBeCloseTo(at30, 6);
    expect(damp(0, 1, 6, 0)).toBe(0);
    expect(clamp(5)).toBe(1);
    expect(smoothstep(0.5)).toBe(0.5);
  });
  it('?webgl=off force le repli liste ; sans WebGL aussi', () => {
    expect(renderMode('?webgl=off', true)).toBe('liste');
    expect(renderMode('', false)).toBe('liste');
    expect(renderMode('', true)).toBe('webgl');
  });
});

describe('objets 3D : configuration unique', () => {
  it('3 objets, repli procédural par défaut, GLB résolu dans /models/', () => {
    expect(OBJETS.map((o) => o.id)).toEqual(['etagere', 'lampe', 'casse-noisette']);
    expect(modelUrl(OBJETS[0])).toBeNull();
    expect(modelUrl({ ...OBJETS[0], source: 'etagere.glb' })).toBe('/models/etagere.glb');
  });
});

describe('page Galerie D', () => {
  const gal = parseGalerie(html)!;
  it('porte le titre, la section épinglée à 3 panneaux et la grille de 4 cartes', () => {
    expect(html).toContain(GAL_TAGLINE);
    expect(gal.oeuvres).toHaveLength(3);
    expect(html.match(/class="card"/g)).toHaveLength(4);
    for (const o of gal.oeuvres) expect([o.src, o.alt, o.titre, o.matiere, o.annee].every(Boolean)).toBe(true);
  });
  it('hero en <img> responsive (srcset 390 et 1440), images ≤ 350 Ko, rien de scotché ni de tiers', () => {
    expect(html).toMatch(/<img class="bg"[^>]*srcset="[^"]*780w[^"]*1440w/);
    for (const m of html.matchAll(/\/images\/[\w.-]+\.jpg/g)) {
      expect(existsSync(`public${m[0]}`), m[0]).toBe(true);
      expect(statSync(`public${m[0]}`).size, m[0]).toBeLessThan(350_000);
    }
    expect(html + readFileSync('src/styles.css', 'utf8')).not.toMatch(/polaroid|scotch|washi|googleapis|gstatic/i);
  });
  it('polices auto-hébergées : fonts.css sans requête externe, trois familles', () => {
    const css = readFileSync('public/fonts/fonts.css', 'utf8');
    for (const f of ['Bebas Neue', 'Space Grotesk', 'JetBrains Mono']) expect(css).toContain(`'${f}'`);
    expect(css).not.toMatch(/https?:\/\//);
  });
});

describe('prove-mx-gal-01', () => {
  const images = parseGalerie(html)!.oeuvres.map((o) => ({ src: o.src, status: 200, type: 'image/jpeg' }));
  const ok = {
    expectedSha: 'abc',
    health: { status: 200, body: JSON.stringify({ status: 'ok', sha: 'abc' }) },
    page: { status: 200, body: html },
    runtime: {
      liste: { mode: 'liste', gl: false, statique: false, reducedMotion: 'false', index: undefined },
      normal: { mode: '3d', gl: true, statique: false, reducedMotion: 'false', index: '0' },
      reduit: { mode: '3d-statique', gl: true, statique: true, reducedMotion: 'true', index: '0' },
    },
    images,
  };
  it('SATISFIED sur la page du dépôt quand health.sha = delivery_sha', () => {
    expect(formatGalerie(evaluateGalerie(ok))).toMatch(/^capability=MX-GAL-01 verdict=SATISFIED proof_nature=runtime-observation/);
  });
  it('NOT_PROVEN si le SHA diffère, si le repli liste ou le mouvement réduit manquent', () => {
    expect(evaluateGalerie({ ...ok, health: { status: 200, body: JSON.stringify({ status: 'ok', sha: 'old' }) } }).verdict).toBe('NOT_PROVEN');
    expect(evaluateGalerie({ ...ok, runtime: {} }).verdict).toBe('NOT_PROVEN');
    expect(evaluateGalerie({ ...ok, runtime: { ...ok.runtime, liste: { ...ok.runtime.liste, mode: '3d', gl: true } } }).verdict).toBe('NOT_PROVEN');
    expect(evaluateGalerie({ ...ok, health: null, page: null }).verdict).toBe('NOT_PROVEN');
  });
});
