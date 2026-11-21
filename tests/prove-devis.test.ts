import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { FIELD_NAMES, bundleBuildsMailto, evaluateDevis, formatDevis, missingFields, scriptSrc } from '../scripts/prove-devis-lib.mjs';

const html = readFileSync('index.html', 'utf8');
const js = 'x="mailto:melix.elec@gmail.com?subject="+encodeURIComponent("Demande de devis professionnel")+"&body="';
// Forme minifiée réelle du bundle Vite : l'adresse est une variable dans le gabarit.
const minified = 'const t="melix.elec@gmail.com";function f(e,r,n){return`mailto:${e}?subject=${encodeURIComponent(r)}&body=${encodeURIComponent(n)}`}f(t,"Demande de devis professionnel","")';
const health =(sha: string) => ({ status: 200, body: JSON.stringify({ status: 'ok', sha }) });
const page = { status: 200, body: html };

describe('prove-mx-devis-01', () => {
  it('le formulaire source porte les 11 champs', () => {
    expect(missingFields(html)).toEqual([]);
    expect(FIELD_NAMES).toHaveLength(11);
  });
  it('trouve le script module', () => {
    expect(scriptSrc(html)).toMatch(/main/);
  });
  it('SATISFIED quand tout concorde', () => {
    const r = evaluateDevis({ expectedSha: 'a', health: health('a'), page, bundle: { status: 200, body: js } });
    expect(formatDevis(r)).toMatch(/^capability=MX-DEVIS-01 verdict=SATISFIED proof_nature=runtime-observation/);
  });
  it('accepte la forme minifiée du bundle Vite', () => {
    expect(bundleBuildsMailto(minified)).toBe(true);
    expect(bundleBuildsMailto(minified.replace('&body=', ''))).toBe(false);
    expect(evaluateDevis({ expectedSha: 'a', health: health('a'), page, bundle: { status: 200, body: minified } }).verdict).toBe('SATISFIED');
  });
  it('NOT_PROVEN si SHA, champ ou script manquent', () => {
    expect(evaluateDevis({ expectedSha: 'a', health: health('b'), page, bundle: { status: 200, body: js } }).verdict).toBe('NOT_PROVEN');
    expect(evaluateDevis({ expectedSha: 'a', health: health('a'), page: { status: 200, body: html.replace('name="adresse"', '') }, bundle: { status: 200, body: js } }).verdict).toBe('NOT_PROVEN');
    expect(bundleBuildsMailto('rien')).toBe(false);
    expect(evaluateDevis({ expectedSha: 'a', health: null, page: null, bundle: null }).verdict).toBe('NOT_PROVEN');
  });
});
