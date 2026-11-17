import './styles.css';
import { buildMailto, type QuoteFields } from './mailto';

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

document.getElementById('mentions-link')?.addEventListener('click', () => {
  document.getElementById('mentions')!.hidden = false;
});

// Le chargement de Three.js n'est pas bloquant pour le premier rendu.
void import('./hero3d').then((m) => m.initHero());
void import('./viewer').then((m) => m.initViewer());
