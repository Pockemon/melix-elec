export const CONTACT_EMAIL = 'melix.elec@gmail.com';

export interface QuoteFields {
  entreprise: string;
  contact: string;
  type: string;
  dimensions: string;
  quantite: string;
  modele: string;
  finition: string;
  utilisation: string;
  date: string;
  adresse: string;
  fichiers: string;
}

const LABELS: [keyof QuoteFields, string][] = [
  ['entreprise', 'Entreprise'],
  ['contact', 'Contact'],
  ['type', 'Type de pièce'],
  ['dimensions', 'Dimensions approximatives'],
  ['quantite', 'Quantité'],
  ['modele', 'Modèle 3D'],
  ['finition', 'Couleur et finition'],
  ['utilisation', 'Utilisation'],
  ['date', 'Date de livraison souhaitée'],
  ['adresse', 'Adresse de livraison'],
  ['fichiers', 'Fichiers ou visuels de référence'],
];

export function buildQuoteBody(f: QuoteFields): string {
  const lines = LABELS.map(([key, label]) => `${label} : ${f[key].trim() || '—'}`);
  return [
    'Bonjour,',
    '',
    'Voici ma demande de devis professionnel :',
    '',
    ...lines,
    '',
    'Merci de joindre à cet e-mail vos fichiers (STL, OBJ, images) avant l’envoi : ils ne sont pas transmis automatiquement.',
    '',
    'Cordialement,',
    f.contact.trim(),
  ].join('\r\n');
}

export function buildMailto(f: QuoteFields): string {
  const subject = `Demande de devis professionnel${f.entreprise.trim() ? ' – ' + f.entreprise.trim() : ''}`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildQuoteBody(f))}`;
}
