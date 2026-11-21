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
