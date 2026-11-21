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

const menuBtn = document.getElementById('menu-btn') as HTMLButtonElement;
const menu = document.getElementById('menu')!;
const setMenu = (open: boolean) => {
  menu.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
};
menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
menu.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('a')) setMenu(false);
});
document.addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

document.getElementById('mentions-link')?.addEventListener('click', () => {
  document.getElementById('mentions')!.hidden = false;
});

// Three.js se charge hors du chemin critique ; la liste des œuvres reste le repli sans WebGL.
void import('./galerie').then((m) => m.initGalerie());
