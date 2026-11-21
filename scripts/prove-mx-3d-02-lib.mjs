// Évalue les observations du site publié pour MX-3D-02 (visionneuse 3D du casse-noisette).
export const MODEL_PATH = 'models/casse-noisette.glb';

// Lit l'en-tête GLB (magic « glTF », version 2, longueur) et le JSON : au moins un maillage.
export function checkGlb(buf) {
  if (!buf || buf.length < 20) return 'glb trop court';
  if (buf.toString('latin1', 0, 4) !== 'glTF') return 'magic glTF absent';
  if (buf.readUInt32LE(4) !== 2) return 'version glTF != 2';
  if (buf.readUInt32LE(8) !== buf.length) return 'longueur GLB incohérente';
  try {
    const jl = buf.readUInt32LE(12);
    const json = JSON.parse(buf.toString('utf8', 20, 20 + jl));
    if (!json.meshes || !json.meshes.length) return 'aucun maillage';
  } catch { return 'JSON GLB invalide'; }
  return null;
}

// Les scripts du bundle (JS de la page) doivent référencer le modèle : la visionneuse est active au build.
export function evaluate({ expectedSha, health, page, glb, scripts }) {
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
  const markers = ['id="viewer-canvas"', 'id="viewer-fallback"'];
  if (!page || page.status !== 200) failures.push(`accueil HTTP ${page ? page.status : 'injoignable'}`);
  else {
    const missing = markers.filter((m) => !page.body.includes(m));
    if (missing.length) failures.push(`marqueurs absents: ${missing.join(', ')}`);
    else facts.push('canvas=present repli=present');
  }
  if (!glb || glb.status !== 200) failures.push(`glb HTTP ${glb ? glb.status : 'injoignable'}`);
  else {
    const err = checkGlb(glb.buffer);
    if (err) failures.push(`glb invalide: ${err}`);
    else facts.push(`glb=200 octets=${glb.buffer.length}`);
  }
  if (!scripts || !scripts.some((s) => s.includes(MODEL_PATH))) failures.push('bundle sans référence au modèle (visionneuse inactive)');
  else facts.push('bundle=reference-modele');
  return { verdict: failures.length ? 'NOT_PROVEN' : 'SATISFIED', facts, failures };
}

export function formatResult(r) {
  const detail = [...r.facts, ...r.failures.map((f) => `echec=${f}`)].join(' ');
  return `capability=MX-3D-02 verdict=${r.verdict} proof_nature=runtime-observation${detail ? ' ' + detail : ''}`;
}
