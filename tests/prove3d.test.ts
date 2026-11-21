import { describe, expect, it } from 'vitest';
import { CODE_MARKERS, PAGE_MARKERS, chunkNames, evaluate, formatResult, scriptUrls } from '../scripts/prove-3d-lib.mjs';

const page = { status: 200, body: PAGE_MARKERS.join(' ') };
const health = (sha: string) => ({ status: 200, body: JSON.stringify({ status: 'ok', sha }) });
const code = CODE_MARKERS.join(' ');

describe('prove-mx-3d-01', () => {
  it('SATISFIED quand sha, page et code du héros concordent', () => {
    const r = evaluate({ expectedSha: 'abc', health: health('abc'), page, code });
    expect(formatResult(r)).toMatch(/^capability=MX-3D-01 verdict=SATISFIED proof_nature=runtime-observation/);
  });
  it('NOT_PROVEN si SHA différent, code absent ou site injoignable', () => {
    expect(evaluate({ expectedSha: 'abc', health: health('old'), page, code }).verdict).toBe('NOT_PROVEN');
    expect(evaluate({ expectedSha: 'abc', health: health('abc'), page, code: '' }).verdict).toBe('NOT_PROVEN');
    expect(evaluate({ expectedSha: 'abc', health: null, page: null, code }).verdict).toBe('NOT_PROVEN');
  });
  it('extrait scripts et chunks', () => {
    expect(scriptUrls('<script type="module" src="/assets/index-a.js"></script>')).toEqual(['/assets/index-a.js']);
    expect(chunkNames('import("./hero3d-b.js")')).toContain('hero3d-b.js');
  });
});
