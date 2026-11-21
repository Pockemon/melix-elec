# Design — source de vérité

- Fichier Figma : `mqrcZMrSenBLMdWJlZ4gxD`, page « Galerie D · 2026-11-21 (validée) » (69:5). Desktop 1440 : 71:2 (hero), 71:47 / 71:98 / 71:149 (panneaux), 71:200 (bandeau), 71:221 (grille), 71:266 (CTA + pied). Mobile 390 : 72:2, 72:24, 72:45. Handoff : 72:96.
- Handoff Cowork : `docs/design/galerie-d/` (README, page-reference.html, scroll-3d-reference.js, img/, captures/).
- Direction D (Jean, 21/11) : photos plein écran, Bebas Neue / Space Grotesk / JetBrains Mono, or/bronze sur anthracite, ombres dures, section épinglée 3D (défilement vertical puis horizontal, pièces qui tournent et se décomposent). Variables de couleur : `src/styles.css` (`:root`).
- Interdits : photo « scotchée »/polaroïd, blanc brûlé, image IA de la machine autre que celles fournies.
- Code : `src/scroll-core.ts` (fonctions pures), `src/scene/` (config unique `config.ts`, objets, repli procédural, GLB Draco), `src/galerie-d.ts` (liaison au défilement).
