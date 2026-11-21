#!/usr/bin/env node
// Preuve RUNTIME MX-GAL-01 : observe la galerie 3D du site publié (GitHub Pages).
// Usage : prove-mx-gal-01 [--url https://melix-elec.com] [--sha <delivery_sha>]
// delivery_sha : --sha, sinon DELIVERY_SHA / GITHUB_SHA, sinon git HEAD.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluateGalerie, formatGalerie, observeGalerie, parseGalerie } from './prove-lib.mjs';

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

// Rendu réel : Edge/Chrome headless exécute le JS publié, on lit le DOM obtenu.
function browser() {
  const cands = [process.env.PROVE_BROWSER, 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  return cands.find((p) => p && existsSync(p));
}
function dump(exe, url, extra = []) {
  const dir = mkdtempSync(join(tmpdir(), 'prove-gal-'));
  try {
    return execFileSync(exe, ['--headless=new', '--no-first-run', '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--window-size=1440,900', '--virtual-time-budget=15000', `--user-data-dir=${dir}`, ...extra, '--dump-dom', url], { encoding: 'utf8', timeout: 90000, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch { return ''; } finally { rmSync(dir, { recursive: true, force: true }); }
}
const exe = browser();
const runtime = {};
if (exe) {
  runtime.liste = observeGalerie(dump(exe, `${base}/?webgl=off`));
  runtime.normal = observeGalerie(dump(exe, `${base}/`));
  runtime.reduit = observeGalerie(dump(exe, `${base}/`, ['--force-prefers-reduced-motion']));
}

const gal = page && page.status === 200 ? parseGalerie(page.body) : null;
const images = [];
for (const o of gal ? gal.oeuvres : []) images.push({ src: o.src, ...(await head(new URL(o.src, `${base}/`).href)) });

const result = evaluateGalerie({ expectedSha: sha, health, page, images, runtime });
console.log(formatGalerie(result));
process.exit(result.verdict === 'SATISFIED' ? 0 : 1);
