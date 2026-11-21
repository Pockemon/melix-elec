export const REQUIRED_MARKERS = [
  'GRAND FORMAT',
  'id="top"',
  'data-section="galerie"',
  'id="grille"',
  'id="devis"',
  '<footer',
];

// Évalue les observations (health + page d'accueil) et rend le verdict.
export function evaluate({ expectedSha, health, page }) {
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
    const missing = REQUIRED_MARKERS.filter((m) => !page.body.includes(m));
    if (missing.length) failures.push(`marqueurs absents: ${missing.join(', ')}`);
    else facts.push(`accueil=200 sections=${REQUIRED_MARKERS.length}`);
  }
  return { verdict: failures.length ? 'NOT_PROVEN' : 'SATISFIED', facts, failures };
}

export function formatResult(r) {
  const detail = [...r.facts, ...r.failures.map((f) => `echec=${f}`)].join(' ');
  return `capability=MX-SITE-01 verdict=${r.verdict} proof_nature=runtime-observation${detail ? ' ' + detail : ''}`;
}

export const REQUIRED_SECTIONS = ['top', 'pin', 'grille', 'devis'];
export const REQUIRED_TEXTS = ['GRAND FORMAT', 'Obtenir un devis professionnel'];

export function checkPage(html) {
  const missing = [];
  for (const id of REQUIRED_SECTIONS) if (!new RegExp(`id=["']${id}["']`).test(html)) missing.push(`#${id}`);
  for (const t of REQUIRED_TEXTS) if (!html.includes(t)) missing.push(`texte:${t}`);
  if (!/<footer[\s>]/.test(html)) missing.push('footer');
  return missing;
}

export function judge({ health, deliverySha, missing }) {
  const facts = [];
  if (!health || health.status !== 'ok') facts.push('health=KO');
  else if (!deliverySha) facts.push('delivery_sha=inconnu');
  else if (health.sha !== deliverySha) facts.push(`sha_publie=${health.sha}!=delivery_sha=${deliverySha}`);
  if (missing.length) facts.push(`manquants=${missing.join(',')}`);
  return { verdict: facts.length ? 'NOT_PROVEN' : 'SATISFIED', facts };
}

// ---- MX-GAL-01 : galerie D, section épinglée 3D (repli liste, mouvement réduit) ----
export const GAL_TAGLINE = 'GRAND FORMAT';
export const GAL_MIN_OEUVRES = 3;

// Découpe la section [data-section="galerie"] et ses œuvres (li[data-oeuvre]).
export function parseGalerie(html) {
  const m = /<section\b[^>]*data-section=["']galerie["'][^>]*>([\s\S]*?)<\/section>/.exec(html);
  if (!m) return null;
  const body = m[1];
  const oeuvres = [...body.matchAll(/<li\b[^>]*data-oeuvre[^>]*>([\s\S]*?)<\/li>/g)].map((x) => {
    const li = x[1];
    const img = /<img\b[^>]*>/.exec(li)?.[0] ?? '';
    const cartel = (attr) => (new RegExp(String.raw`<[a-z]+\b[^>]*data-cartel-${attr}[^>]*>\s*([^<\s][^<]*?)\s*<`).exec(li) || [])[1] || '';
    return {
      src: (/\bsrc=["']([^"']+)["']/.exec(img) || [])[1] || '',
      alt: (/\balt=["']([^"']+)["']/.exec(img) || [])[1] || '',
      titre: cartel('titre'),
      matiere: cartel('matiere'),
      annee: cartel('annee'),
    };
  });
  return { body, oeuvres };
}

// Lit l'état de la section galerie dans le DOM RENDU (dump après exécution du JS publié).
export function observeGalerie(dom) {
  const tag = /<section\b[^>]*data-section=["']galerie["'][^>]*>/.exec(dom || '')?.[0];
  if (!tag) return null;
  const attr = (n) => (new RegExp(String.raw`\bdata-${n}=["']([^"']*)["']`).exec(tag) || [])[1];
  const cls = (/\bclass=["']([^"']*)["']/.exec(tag) || [])[1] || '';
  return { mode: attr('galerie-mode'), index: attr('galerie-index'), reducedMotion: attr('reduced-motion'), gl: /\bgalerie--gl\b/.test(cls), statique: /\bgalerie--statique\b/.test(cls) };
}

// Observations : health, page servie, réponses des images, et trois rendus réels du navigateur
// runtime = { liste: observeGalerie(DOM avec ?webgl=off), normal: observeGalerie(DOM par défaut), reduit: observeGalerie(DOM avec prefers-reduced-motion forcé) }.
export function evaluateGalerie({ expectedSha, health, page, images, runtime }) {
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
  if (!page || page.status !== 200) {
    failures.push(`accueil HTTP ${page ? page.status : 'injoignable'}`);
    return { verdict: 'NOT_PROVEN', facts, failures };
  }
  const html = page.body;
  if (html.includes(GAL_TAGLINE)) facts.push('accroche=ok'); else failures.push('accroche absente');

  const gal = parseGalerie(html);
  if (!gal) failures.push('section [data-section=galerie] absente');
  else {
    const realImage = /^\/images\/[^"']+\.(jpe?g|png|webp)$/i;
    const bad = gal.oeuvres.filter((o) => !realImage.test(o.src) || !o.alt || !o.titre || !o.matiere || !o.annee);
    if (gal.oeuvres.length < GAL_MIN_OEUVRES) failures.push(`oeuvres=${gal.oeuvres.length}<${GAL_MIN_OEUVRES}`);
    else if (bad.length) failures.push(`oeuvres incompletes: ${bad.map((o) => o.titre || o.src || '?').join(',')}`);
    else facts.push(`oeuvres=${gal.oeuvres.length} cartels=ok`);
    for (const o of gal.oeuvres) {
      const r = (images || []).find((i) => i.src === o.src);
      if (!r || r.status !== 200 || !/^image\//.test(r.type || '')) failures.push(`image ${o.src} HTTP ${r ? r.status : 'non observée'}`);
    }
  }
  const rt = runtime || {};
  // Repli liste : rendu réel avec WebGL désactivé, liste dans le DOM et scène 3D non activée.
  const liste = rt.liste;
  if (liste && liste.mode === 'liste' && !liste.gl && gal && gal.oeuvres.length >= GAL_MIN_OEUVRES) facts.push('repli_liste=rendu(?webgl=off)');
  else failures.push(`repli liste non observé sans WebGL (mode=${liste ? liste.mode : 'non observé'})`);
  // Mouvement réduit : rendu réel avec prefers-reduced-motion forcé, scène statique pilotée par les boutons.
  const red = rt.reduit;
  if (red && red.reducedMotion === 'true' && red.mode === '3d-statique' && red.statique) facts.push('mouvement_reduit=camera_immobile+boutons');
  else failures.push(`mouvement réduit non observé (mode=${red ? red.mode : 'non observé'}, reduced=${red ? red.reducedMotion : '?'})`);
  // Rendu 3D nominal observé (nécessite WebGL dans le navigateur de preuve).
  const nor = rt.normal;
  if (nor && nor.mode === '3d' && nor.gl) facts.push('galerie_3d=rendue');
  else failures.push(`galerie 3D non rendue (mode=${nor ? nor.mode : 'non observé'})`);
  return { verdict: failures.length ? 'NOT_PROVEN' : 'SATISFIED', facts, failures };
}

export function formatGalerie(r) {
  return formatResult(r).replace('capability=MX-SITE-01', 'capability=MX-GAL-01');
}
