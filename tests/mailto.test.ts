import { describe, expect, it } from 'vitest';
import { buildMailto, buildQuoteBody, type QuoteFields } from '../src/mailto';

const sample: QuoteFields = {
  entreprise: 'Décors Exemple & Cie',
  contact: 'Alex Test, alex@example.test',
  type: 'Mascotte',
  dimensions: '1,5 m de haut',
  quantite: '2',
  modele: 'À concevoir',
  finition: 'Blanc, prêt à peindre',
  utilisation: 'ERP',
  date: '12/01/2027',
  adresse: 'Chambéry 73000',
  fichiers: 'maquette.stl',
};

describe('buildMailto', () => {
  const url = buildMailto(sample);
  const query = new URLSearchParams(url.split('?')[1]);

  it('cible l’adresse de l’atelier', () => {
    expect(url.startsWith('mailto:melix.elec@gmail.com?')).toBe(true);
  });
  it('pré-remplit l’objet avec l’entreprise', () => {
    expect(query.get('subject')).toBe('Demande de devis professionnel – Décors Exemple & Cie');
  });
  it('pré-remplit tous les champs dans le corps', () => {
    const body = query.get('body')!;
    expect(body).toContain('Entreprise : Décors Exemple & Cie');
    expect(body).toContain('Dimensions approximatives : 1,5 m de haut');
    expect(body).toContain('Utilisation : ERP');
    expect(body).toContain('Adresse de livraison : Chambéry 73000');
  });
  it('invite à joindre les fichiers', () => {
    expect(query.get('body')).toContain('joindre');
  });
  it('encode les caractères réservés', () => {
    expect(url).not.toMatch(/ |&body=.*&.*Cie/);
  });
});

describe('buildQuoteBody', () => {
  it('remplace les champs vides par un tiret', () => {
    const empty = Object.fromEntries(Object.keys(sample).map((k) => [k, ''])) as unknown as QuoteFields;
    expect(buildQuoteBody(empty)).toContain('Quantité : —');
  });
});
