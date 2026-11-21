import { describe, expect, it } from 'vitest';
import { REQUIRED_MARKERS, evaluate, formatResult } from '../scripts/prove-lib.mjs';

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
