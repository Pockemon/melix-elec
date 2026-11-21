export const FIELD_NAMES = ['entreprise', 'contact', 'type', 'dimensions', 'quantite', 'modele', 'finition', 'utilisation', 'date', 'adresse', 'fichiers'];
export const MAILTO_PREFIX = 'mailto:melix.elec@gmail.com?subject=';

// Champs du formulaire #quote-form présents dans la page publiée.
export function missingFields(html) {
  const form = /<form[^>]*id=["']quote-form["'][\s\S]*?<\/form>/.exec(html);
  if (!form) return ['form#quote-form'];
  return FIELD_NAMES.filter((n) => !new RegExp(`name=["']${n}["']`).test(form[0])).map((n) => `champ:${n}`);
}

// URL du script principal référencé par la page.
export function scriptSrc(html) {
  const m = /<script[^>]*type=["']module["'][^>]*src=["']([^"']+)["']/.exec(html) || /<script[^>]*src=["']([^"']+)["'][^>]*type=["']module["']/.exec(html);
  return m ? m[1] : null;
}

// Le bundle publié construit bien le lien mailto (adresse, objet, corps encodés).
export function bundleBuildsMailto(js) {
  return js.includes('mailto:melix.elec@gmail.com?subject=') && js.includes('&body=') && js.includes('encodeURIComponent') && js.includes('Demande de devis professionnel');
}

export function evaluateDevis({ health, expectedSha, page, bundle }) {
  const facts = [];
  const failures = [];
  let hb = null;
  if (health && health.status === 200) { try { hb = JSON.parse(health.body); } catch { hb = null; } }
  if (!hb || hb.status !== 'ok') failures.push('health.json invalide ou injoignable');
  else if (!expectedSha) failures.push('delivery_sha inconnu');
  else if (hb.sha !== expectedSha) failures.push(`health.sha=${hb.sha} != delivery_sha=${expectedSha}`);
  else facts.push(`health.sha=${hb.sha}`);
  if (!page || page.status !== 200) failures.push('accueil injoignable');
  else {
    const missing = missingFields(page.body);
    if (missing.length) failures.push(`absents: ${missing.join(', ')}`);
    else facts.push(`champs=${FIELD_NAMES.length}`);
    if (!page.body.includes('href="mailto:melix.elec@gmail.com"')) failures.push('lien mailto statique absent');
  }
  if (!bundle || bundle.status !== 200) failures.push('script publié injoignable');
  else if (!bundleBuildsMailto(bundle.body)) failures.push('le script publié ne génère pas le lien mailto attendu');
  else facts.push(`mailto=${MAILTO_PREFIX}…&body=…`);
  return { verdict: failures.length ? 'NOT_PROVEN' : 'SATISFIED', facts, failures };
}

export function formatDevis(r) {
  const detail = [...r.facts, ...r.failures.map((f) => `echec=${f}`)].join(' ');
  return `capability=MX-DEVIS-01 verdict=${r.verdict} proof_nature=runtime-observation${detail ? ' ' + detail : ''}`;
}
