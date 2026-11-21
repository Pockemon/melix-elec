#!/usr/bin/env node
// Preuve RUNTIME MX-GAL-01 : observe la galerie 3D du site publié (GitHub Pages).
// Usage : prove-mx-gal-01 [--url https://melix-elec.com] [--sha <delivery_sha>]
// delivery_sha : --sha, sinon DELIVERY_SHA / GITHUB_SHA, sinon git HEAD.
import { execFileSync } from 'node:child_process';
import { evaluateGalerie, formatGalerie, parseGalerie } from './prove-lib.mjs';

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const base = (arg('--url') || process.env.SITE_URL || process.env.PROVE_URL || 'https://melix-elec.com').replace(/\/+$/, '');
let sha = arg('--sha') || process.env.DELIVERY_SHA || process.env.GITHUB_SHA;
if (!sha) { try { sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { sha = ''; } }

async function get(url) {
  try {
    const res = await fetch(url, { headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(20000) });
    return { status: res.status, body: await res.text() };
  } catch { return null; }
}
async function head(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(20000) });
    return { status: res.status, type: res.headers.get('content-type') || '' };
  } catch { return { status: 0, type: '' }; }
}

const health = await get(`${base}/health.json`);
const page = await get(`${base}/`);

// Code publié : script d'entrée et chunks qu'il référence (la galerie est chargée à la demande).
let bundle = '';
if (page && page.status === 200) {
  const queue = [...page.body.matchAll(/<script\b[^>]*\bsrc=["']([^"']+\.js)["']/g)].map((m) => m[1]);
  const seen = new Set();
  while (queue.length && seen.size < 12) {
    const src = queue.shift();
    if (seen.has(src)) continue;
    seen.add(src);
    const js = await get(new URL(src, `${base}/`).href);
    if (!js || js.status !== 200) continue;
    bundle += js.body + '\n';
    for (const m of js.body.matchAll(/["'](?:\.\/|\/assets\/)([\w.-]+\.js)["']/g)) queue.push(`/assets/${m[1]}`);
  }
}

const gal = page && page.status === 200 ? parseGalerie(page.body) : null;
const images = [];
for (const o of gal ? gal.oeuvres : []) images.push({ src: o.src, ...(await head(new URL(o.src, `${base}/`).href)) });

const result = evaluateGalerie({ expectedSha: sha, health, page, bundle, images });
console.log(formatGalerie(result));
process.exit(result.verdict === 'SATISFIED' ? 0 : 1);
