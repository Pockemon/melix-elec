export const PAGE_MARKERS = ['id="hero-canvas"', 'id="hero-fallback"', 'hero-illustration.png', 'Illustration 3D interactive'];
export const CODE_MARKERS = ['hero-canvas', 'prefers-reduced-motion', 'pointermove', 'scroll', 'webgl'];

// URLs de scripts référencés par la page (modules) et chunks importés dynamiquement.
export function scriptUrls(html) {
  return [...html.matchAll(/<script[^>]+src=["']([^"']+\.js)["']/g)].map((m) => m[1]);
}
export function chunkNames(js) {
  return [...new Set([...js.matchAll(/["'`]\.?\/?((?:assets\/)?[\w.-]+\.js)["'`]/g)].map((m) => m[1]))];
}

// Évalue : health.sha = delivery_sha, markup du héros, code du héros (3D, pointeur, défilement, reduced-motion, repli).
export function evaluate({ expectedSha, health, page, code }) {
  const facts = [];
  const failures = [];
  if (!health || health.status !== 200) failures.push(`health.json HTTP ${health ? health.status : 'injoignable'}`);
  else {
    let body;
    try { body = JSON.parse(health.body); } catch { body = null; }
    if (!body || body.status !== 'ok') failures.push('health.json invalide');
    else if (!expectedSha) failures.push('delivery_sha inconnu');
    else if (body.sha !== expectedSha) failures.push(`health.sha=${body.sha} != delivery_sha=${expectedSha}`);
    else facts.push(`health.sha=${body.sha}`);
  }
  if (!page || page.status !== 200) failures.push(`accueil HTTP ${page ? page.status : 'injoignable'}`);
  else {
    const missing = PAGE_MARKERS.filter((m) => !page.body.includes(m));
    if (missing.length) failures.push(`marqueurs page absents: ${missing.join(', ')}`);
    else facts.push('hero_markup=ok repli_image=ok mention=ok');
  }
  const missingCode = CODE_MARKERS.filter((m) => !(code || '').toLowerCase().includes(m));
  if (missingCode.length) failures.push(`code hero absent: ${missingCode.join(', ')}`);
  else facts.push('hero_code=ok(three,pointeur,scroll,reduced-motion)');
  return { verdict: failures.length ? 'NOT_PROVEN' : 'SATISFIED', facts, failures };
}

export function formatResult(r) {
  const detail = [...r.facts, ...r.failures.map((f) => `echec=${f}`)].join(' ');
  return `capability=MX-3D-01 verdict=${r.verdict} proof_nature=runtime-observation${detail ? ' ' + detail : ''}`;
}
