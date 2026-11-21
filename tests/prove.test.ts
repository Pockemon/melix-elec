import { describe, expect, it } from 'vitest';
import { checkPage, judge, REQUIRED_SECTIONS, REQUIRED_TEXTS } from '../scripts/prove-lib.mjs';

const page = `<main>${REQUIRED_SECTIONS.map((s) => `<section id="${s}"></section>`).join('')}<h1>${REQUIRED_TEXTS.join(' ')}</h1></main><footer></footer>`;

describe('preuve MX-SITE-01', () => {
  it('accepte une page complète dont le SHA publié = delivery_sha', () => {
    expect(judge({ health: { status: 'ok', sha: 'a1' }, deliverySha: 'a1', missing: checkPage(page) }).verdict).toBe('SATISFIED');
  });
  it('refuse un SHA différent', () => {
    expect(judge({ health: { status: 'ok', sha: 'old' }, deliverySha: 'a1', missing: [] }).verdict).toBe('NOT_PROVEN');
  });
  it('signale les sections manquantes', () => {
    expect(checkPage('<main></main>')).toContain('#devis');
  });
});
