# melix-elec
MELIX ELEC - vitrine B2B fabrication 3D grand format

## Développement
- `npm run dev` · `npm run build` (typecheck + build, écrit `public/health.json` avec `GITHUB_SHA`) · `npm test` (vitest).
- Déploiement : GitHub Pages via `.github/workflows/pages.yml`, base `/` (domaine personnalisé, `public/CNAME`). Adresse publique : https://melix-elec.com
- Casse-noisette 3D : déposer `public/models/casse-noisette.glb` ; la visionneuse s'active au build suivant. Sans fichier, l'image de repli et le badge « Fabrication en cours » restent affichés.
- Design : `docs/design/SPEC.md`. Captures de contrôle : `docs/screenshots/`.
- Preuve MX-SITE-01 (lancée par Foreman après livraison) : `npm run prove-mx-site-01 -- --sha <delivery_sha>` ; compare `health.json` au delivery_sha et vérifie les sections de la page publiée. Sortie : `capability=MX-SITE-01 verdict=SATISFIED|NOT_PROVEN proof_nature=runtime-observation`. La QA visuelle contre Figma reste une porte distincte.
