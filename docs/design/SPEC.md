# MELIX ELEC — Spécification design (frames « Galerie 2026-11 »)

Source de vérité : Figma `mqrcZMrSenBLMdWJlZ4gxD`, page « Galerie 2026-11 », frames 1440 et 390 (nœuds `2:14` et `3:2` de la consigne).
Arbitrage Cowork du 21/11 : les frames sont ajoutées au Figma en parallèle ; **la spécification ci-dessous fait foi** tant qu'elles ne sont pas relues, et le contrôle visuel (candidate-check) se fait contre elles.
La décision de Jean du 18/11 remplace toute la spécification précédente : plus de figurine low-poly, plus de palette pastel, plus d'Instrument Serif / DM Sans, plus de grosse typographie.

## Tokens
| Variable | Valeur | Usage |
|---|---|---|
| os | #F3EFE7 | fond de page |
| graphite | #1E1F1D | texte, boutons pleins, section Sous-traitance, plinthe |
| cuivre | #B4703A | accents, filets de cadres, survol |
| blanc cassé | #FAF8F3 | murs de la galerie, sections Prestations/Devis, cartels |
| pierre | #CFC9BE | sol de la galerie, contours de champs |

Dérivés, ajoutés pour tenir le contraste AA (le cuivre seul est à 3,4:1 sur l'os) : texte secondaire #55564F, tertiaire #62635C, cuivre de texte #8A5428 (étiquettes sur clair), cuivre clair #D08F58 (étiquettes sur graphite), filets #DDD6C8.

## Typographie
- Titres : Cormorant Garamond 300/400, italique autorisé. 64 / 40 / 28 px (1440) ; 40 / 28 / 22 px (390).
- Texte : Inter 400/500, 16 / 14 px. Cartels : Inter 13 px.
- Lettrage fin, jamais de grosse typographie.

## Accueil
- Accroche (h1) : « Des pièces uniques, conçues et fabriquées sur mesure. », suivie d'un court texte et de deux boutons.
- La galerie 3D est la section « réalisations » (`#realisations`, `data-section="galerie"`) et occupe l'accueil. Les sections Projet phare, Prestations, En option, Sous-traitance et Devis suivent dans la même identité.

## Galerie Three.js
- Salle circulaire claire : murs #FAF8F3, sol #CFC9BE avec filet cuivre, plafond avec halo lumineux FIXE et discret (jamais lié à la caméra).
- 8 niches en arche à intervalle régulier (45°). Les 4 œuvres occupent une niche sur deux ; la caméra les parcourt.
- Chaque œuvre : photo réelle dans un cadre blanc fin avec filet cuivre, cartel dessous (titre, matière, année, Inter).
- Œuvres : Lampe Vague, Étagères hexagonales, Citrouille lumineuse, Masque crâne (photos de `public/images/`). Aucune photo mise en scène, aucune image générée.
- Caméra : le défilement de la page fait avancer la caméra d'une niche à la suivante, avec amortissement ; le glissé horizontal est converti en défilement ; boutons précédent/suivant toujours présents.
- Sans WebGL (ou `?webgl=off`) : liste verticale des mêmes œuvres (image + cartel), présente dans le DOM.
- `prefers-reduced-motion` : aucun mouvement automatique, caméra immobile entre deux clics, navigation par les boutons.
- Performance : textures ≤ 1600 px, chargement progressif (œuvre courante d'abord), rendu à la demande, aucune bibliothèque hors `three`.

## Critères
Page publiée conforme à 1440 et 390, aucun débordement, 0 erreur console, Lighthouse accessibilité ≥ 90.

## Écarts à valider
- Les cartels portent « Impression 3D, PLA » et « 2026 » : matière et année ne figurent nulle part dans le dépôt, à confirmer par l'atelier.
- Les photos « casse-noisette en atelier » et « imprimantes » citées par la consigne n'existent pas dans `public/images/` : la galerie utilise les quatre photos présentes. À déposer pour les ajouter (une œuvre de plus = un `<li data-oeuvre>`).
- Polices : voir `docs/ESCALADE-polices.md`.
