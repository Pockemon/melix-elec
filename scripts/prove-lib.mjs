export const REQUIRED_MARKERS = [
  'Des pièces uniques, conçues et fabriquées sur mesure',
  'id="projet"',
  'id="realisations"',
  'id="prestations"',
  'id="sous-traitance"',
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

export const REQUIRED_SECTIONS = ['top', 'projet', 'realisations', 'prestations', 'sous-traitance', 'devis'];
export const REQUIRED_TEXTS = ['Des pièces uniques, conçues et fabriquées sur mesure', 'Obtenir un devis professionnel'];

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

// ---- MX-GAL-01 : galerie 3D immersive (repli liste, mouvement réduit) ----
export const GAL_TAGLINE = 'Des pièces uniques, conçues et fabriquées sur mesure';
export const GAL_MIN_OEUVRES = 4;

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

// Observations : health, page d'accueil, bundles JS (texte concaténé), réponses des images.
export function evaluateGalerie({ expectedSha, health, page, bundle, images }) {
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
    if (/id=["']galerie-liste["']/.test(gal.body) && /<ol\b/.test(gal.body)) facts.push('repli_liste=dom');
    else failures.push('repli liste absent du DOM');
    if (/data-galerie-prev/.test(gal.body) && /data-galerie-next/.test(gal.body)) facts.push('boutons_prec_suiv=ok');
    else failures.push('boutons précédent/suivant absents');
    for (const o of gal.oeuvres) {
      const r = (images || []).find((i) => i.src === o.src);
      if (!r || r.status !== 200 || !/^image\//.test(r.type || '')) failures.push(`image ${o.src} HTTP ${r ? r.status : 'non observée'}`);
    }
  }
  const js = bundle || '';
  if (/prefers-reduced-motion/.test(js)) facts.push('mouvement_reduit=ok'); else failures.push('prefers-reduced-motion absent du code publié');
  if (/webgl2?["']/.test(js) && /["']off["']/.test(js)) facts.push('detection_webgl_forcable=ok');
  else failures.push('détection WebGL forçable (?webgl=off) absente du code publié');
  return { verdict: failures.length ? 'NOT_PROVEN' : 'SATISFIED', facts, failures };
}

export function formatGalerie(r) {
  return formatResult(r).replace('capability=MX-SITE-01', 'capability=MX-GAL-01');
}
