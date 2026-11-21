#!/usr/bin/env node
// Preuve RUNTIME MX-SITE-01 : observe le site publié (GitHub Pages).
// Usage : prove-mx-site-01 [--url https://melix-elec.com] [--sha <delivery_sha>]
// delivery_sha : --sha, sinon DELIVERY_SHA / GITHUB_SHA, sinon git HEAD.
import { execFileSync } from 'node:child_process';
import { evaluate, formatResult } from './prove-lib.mjs';

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const base = (arg('--url') || process.env.SITE_URL || 'https://melix-elec.com').replace(/\/+$/, '');
let sha = arg('--sha') || process.env.DELIVERY_SHA || process.env.GITHUB_SHA;
if (!sha) { try { sha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { sha = ''; } }

async function get(url) {
  try {
    const res = await fetch(url, { headers: { 'cache-control': 'no-cache' }, signal: AbortSignal.timeout(20000) });
    return { status: res.status, body: await res.text() };
  } catch { return null; }
}

const result = evaluate({ expectedSha: sha, health: await get(`${base}/health.json`), page: await get(`${base}/`) });
console.log(formatResult(result));
process.exit(result.verdict === 'SATISFIED' ? 0 : 1);
