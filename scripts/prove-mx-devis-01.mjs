#!/usr/bin/env node
// Preuve RUNTIME MX-DEVIS-01 : observe sur le site publié le formulaire de devis
// et le script qui génère le lien mailto vers melix.elec@gmail.com.
// Usage : prove-mx-devis-01 [--url https://melix-elec.com] [--sha <delivery_sha>]
import { execFileSync } from 'node:child_process';
import { evaluateDevis, formatDevis, scriptSrc } from './prove-devis-lib.mjs';

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
const src = page && page.status === 200 ? scriptSrc(page.body) : null;
const bundle = src ? await get(new URL(src, `${base}/`).href) : null;
const result = evaluateDevis({ expectedSha: sha, health, page, bundle });
console.log(formatDevis(result));
process.exit(result.verdict === 'SATISFIED' ? 0 : 1);
