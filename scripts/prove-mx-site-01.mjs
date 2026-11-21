#!/usr/bin/env node
// Preuve d'exécution MX-SITE-01 : observe la page publiée (GitHub Pages) et compare health.json au delivery_sha.
// Usage : prove-mx-site-01 [--url https://melix-elec.com] [--sha <delivery_sha>]  (sha par défaut : DELIVERY_SHA, GITHUB_SHA, puis git HEAD)
// La QA visuelle contre Figma n'est pas jugée ici : elle relève du contrôle visuel de Foreman.
import { execFileSync } from 'node:child_process';
import { checkPage, judge } from './prove-lib.mjs';

const arg = (name) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : undefined; };
const base = (arg('url') || process.env.PROVE_URL || 'https://melix-elec.com').replace(/\/$/, '');

function headSha() {
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { return undefined; }
}
const deliverySha = arg('sha') || process.env.DELIVERY_SHA || process.env.GITHUB_SHA || headSha();

async function get(path) {
  const res = await fetch(`${base}${path}?t=${Date.now()}`, { headers: { 'cache-control': 'no-cache' } });
  if (!res.ok) throw new Error(`${path} HTTP ${res.status}`);
  return res;
}

let verdict = 'NOT_PROVEN';
let facts = [];
try {
  const health = await (await get('/health.json')).json();
  const html = await (await get('/')).text();
  ({ verdict, facts } = judge({ health, deliverySha, missing: checkPage(html) }));
  if (!facts.length) facts = [`sha=${health.sha}`, `url=${base}`];
} catch (e) {
  facts = [`erreur=${e instanceof Error ? e.message : String(e)}`];
}
console.log(`capability=MX-SITE-01 verdict=${verdict} proof_nature=runtime-observation ${facts.join(' ')}`.trim());
process.exit(verdict === 'SATISFIED' ? 0 : 1);
