import { describe, expect, it } from 'vitest';
import { REQUIRED_MARKERS, REQUIRED_SECTIONS, REQUIRED_TEXTS, checkPage, evaluate, formatResult, judge } from '../scripts/prove-lib.mjs';

const page = { status: 200, body: REQUIRED_MARKERS.join(' ') };
const health = (sha: string) => ({ status: 200, body: JSON.stringify({ status: 'ok', sha }) });

describe('prove-mx-site-01', () => {
  it('SATISFIED quand health.sha = delivery_sha et la page est complète', () => {
    const r = evaluate({ expectedSha: 'abc', health: health('abc'), page });
    expect(formatResult(r)).toMatch(/^capability=MX-SITE-01 verdict=SATISFIED proof_nature=runtime-observation/);
  });
  it('NOT_PROVEN si le SHA diffère', () => {
    expect(evaluate({ expectedSha: 'abc', health: health('old'), page }).verdict).toBe('NOT_PROVEN');
  });
  it('NOT_PROVEN si une section manque ou si le site est injoignable', () => {
    expect(evaluate({ expectedSha: 'abc', health: health('abc'), page: { status: 200, body: 'x' } }).verdict).toBe('NOT_PROVEN');
    expect(evaluate({ expectedSha: 'abc', health: null, page: null }).verdict).toBe('NOT_PROVEN');
  });
});

const html = `<main>${REQUIRED_SECTIONS.map((s) => `<section id="${s}"></section>`).join('')}<h1>${REQUIRED_TEXTS.join(' ')}</h1></main><footer></footer>`;

describe('preuve MX-SITE-01 (checkPage / judge)', () => {
  it('accepte une page complète dont le SHA publié = delivery_sha', () => {
    expect(judge({ health: { status: 'ok', sha: 'a1' }, deliverySha: 'a1', missing: checkPage(html) }).verdict).toBe('SATISFIED');
  });
  it('refuse un SHA différent', () => {
    expect(judge({ health: { status: 'ok', sha: 'old' }, deliverySha: 'a1', missing: [] }).verdict).toBe('NOT_PROVEN');
  });
  it('signale les sections manquantes', () => {
    expect(checkPage('<main></main>')).toContain('#devis');
  });
});
