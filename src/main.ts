import './styles.css';
import { buildMailto, type QuoteFields } from './mailto';

// Formulaire de devis : ouvre un e-mail pré-rempli (aucune donnée enregistrée). Le CTA garde son lien mailto sans JS.
const dialog = document.getElementById('quote-dialog') as HTMLDialogElement;
document.getElementById('devis-open')?.addEventListener('click', (e) => {
  if (typeof dialog.showModal !== 'function') return;
  e.preventDefault();
  dialog.showModal();
});
document.getElementById('quote-close')?.addEventListener('click', () => dialog.close());

const form = document.getElementById('quote-form') as HTMLFormElement;
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const fields = Object.fromEntries(
    ['entreprise', 'contact', 'type', 'dimensions', 'quantite', 'modele', 'finition', 'utilisation', 'date', 'adresse', 'fichiers'].map(
      (k) => [k, String(data.get(k) ?? '')],
    ),
  ) as unknown as QuoteFields;
  window.location.href = buildMailto(fields);
});

// Three.js se charge hors du chemin critique (chunk séparé) ; le repli liste fonctionne sans lui.
void import('./galerie-d').then((m) => m.initGalerie());
