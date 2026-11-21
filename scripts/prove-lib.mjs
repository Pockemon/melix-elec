export const REQUIRED_MARKERS = [
  'Vos créations prennent une autre dimension',
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
export const REQUIRED_TEXTS = ['Vos créations prennent une autre dimension', 'Obtenir un devis professionnel'];

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
