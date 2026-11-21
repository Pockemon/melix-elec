#!/usr/bin/env node
// Preuve RUNTIME MX-3D-01 : observe le héros 3D du site publié (page + code livré).
// Usage : prove-mx-3d-01 [--url https://melix-elec.com] [--sha <delivery_sha>]
import { execFileSync } from 'node:child_process';
import { chunkNames, evaluate, formatResult, scriptUrls } from './prove-3d-lib.mjs';

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

const health = await get(`${base}/health.json`);
const page = await get(`${base}/`);
let code = '';
if (page && page.status === 200) {
  const abs = (u) => new URL(u, `${base}/`).href;
  for (const u of scriptUrls(page.body)) {
    const main = await get(abs(u));
    if (!main || main.status !== 200) continue;
    code += main.body;
    for (const c of chunkNames(main.body)) {
      const chunk = await get(abs(c.startsWith('assets/') ? `/${c}` : new URL(c, abs(u)).href));
      if (chunk && chunk.status === 200) code += chunk.body;
    }
  }
}

const result = evaluate({ expectedSha: sha, health, page, code });
console.log(formatResult(result));
process.exit(result.verdict === 'SATISFIED' ? 0 : 1);
