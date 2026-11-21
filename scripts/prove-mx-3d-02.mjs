#!/usr/bin/env node
// Preuve RUNTIME MX-3D-02 : observe le site publié (GitHub Pages) — modèle servi, valide, référencé par le bundle.
// Usage : prove-mx-3d-02 [--url https://melix-elec.com] [--sha <delivery_sha>]
import { execFileSync } from 'node:child_process';
import { evaluate, formatResult } from './prove-mx-3d-02-lib.mjs';

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const base = (arg('--url') || process.env.SITE_URL || process.env.PROVE_URL || 'https://melix-elec.com').replace(/\/+$/, '');
let sha = arg('--sha') || process.env.DELIVERY_SHA || process.env.GITHUB_SHA;
if (!sha) { try { sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { sha = ''; } }

async function get(url, binary = false) {
  try {
    const res = await fetch(url, { headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(20000) });
    return binary ? { status: res.status, buffer: Buffer.from(await res.arrayBuffer()) } : { status: res.status, body: await res.text() };
  } catch { return null; }
}

const page = await get(`${base}/`);
const srcs = page ? [...page.body.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]) : [];
const scripts = [];
const seen = new Set();
// Bundle principal puis chunks importés dynamiquement (visionneuse chargée à la demande).
async function crawl(path) {
  const url = new URL(path, `${base}/`).href;
  if (seen.has(url) || seen.size > 20) return;
  seen.add(url);
  const r = await get(url);
  if (!r || r.status !== 200) return;
  scripts.push(r.body);
  for (const m of r.body.matchAll(/["'`]([\w./-]*[\w-]+\.js)["'`]/g)) {
    const next = new URL(m[1], url).href;
    if (next.startsWith(`${base}/`)) await crawl(next);
  }
}
for (const s of srcs) await crawl(s);

const result = evaluate({
  expectedSha: sha,
  health: await get(`${base}/health.json`),
  page,
  glb: await get(`${base}/models/casse-noisette.glb`, true),
  scripts,
});
console.log(formatResult(result));
process.exit(result.verdict === 'SATISFIED' ? 0 : 1);
