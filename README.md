# melix-elec
MELIX ELEC - vitrine B2B fabrication 3D grand format

## Développement
- `npm run dev` · `npm run build` (typecheck + build, écrit `public/health.json` avec `GITHUB_SHA`) · `npm test` (vitest).
- Déploiement : GitHub Pages via `.github/workflows/pages.yml`, base `/` (domaine personnalisé, `public/CNAME`). Adresse publique : https://melix-elec.com
- Design : `docs/design/SPEC.md`. 
- Preuve MX-SITE-01 (lancée par Foreman après livraison) : `npm run prove-mx-site-01 -- --sha <delivery_sha>` ; compare `health.json` au delivery_sha et vérifie les sections de la page publiée. Sortie : `capability=MX-SITE-01 verdict=SATISFIED|NOT_PROVEN proof_nature=runtime-observation`. La QA visuelle contre Figma reste une porte distincte.
- Preuve MX-GAL-01 (lancée par Foreman après livraison) : `npm run prove-mx-gal-01 -- --sha <delivery_sha>` ; vérifie health.sha, l'accroche, la section galerie (≥ 4 œuvres image + cartel), le repli liste dans le DOM et le code de mouvement réduit / détection WebGL forçable. Sortie : `capability=MX-GAL-01 verdict=SATISFIED|NOT_PROVEN proof_nature=runtime-observation`. `?webgl=off` force le repli liste.
