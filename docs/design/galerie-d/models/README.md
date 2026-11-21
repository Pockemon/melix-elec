# Modèles 3D réels — Galerie D

## casse-noisette.glb (410 Ko, Draco)
- Source : découpe GPS du casse-noisette (24 pièces STL, dossier SELLA/CASSE NOISETTE, 14/11/2026), ~605 k faces → 124 k faces (fast-simplification, 4 500 faces/part).
- Repère : Y vers le haut, origine au centre du socle, hauteur normalisée = 1.0 (le vrai modèle fait 1,20 m ; ×1.2 si l'échelle réelle compte).
- 24 nœuds nommés `part_NN_s{tranche}_q{quadrant}` : tranche 0 (socle/jambes) → 5 (chapeau), quadrant 0..3 = (x−,y−), (x+,y−), (x−,y+), (x+,y+) dans le repère source.
- Normales incluses. Décodage : DRACOLoader (three/examples/jsm/libs/draco/ à servir en local, pas de CDN).
- Éclatement recommandé : dir = normalize(centre de la part − axe vertical) en XZ + (tranche − 2,5) × 0,25 en Y ; distance 0,22 × t ; rotation 0,3 × t autour de Y. Voir models/casse-noisette-preview.jpg (gauche assemblé, droite éclaté).
- Le panneau 03 (« 5 TRANCHES ») devient « 6 TRANCHES · 24 PIÈCES » : Figma 71:149 meta à mettre à jour par Cowork lors du candidate-check.

## lampe-vague.glb (159 Ko, Draco) — 21 nœuds
- Source : The_Wave_Lamp STL (Téléchargements), anneau `ring` (143×197×80 mm) + 20 strates ondulées `strate_01..20` (125×179×3,9 mm) empilées dans la profondeur de l'anneau. Hauteur normalisée = 1.0 (réel 19,7 cm → la fiche Figma « 28 cm » est à corriger : 20 cm).
- Matériaux : ring = noir mat (#1B1C20), strates = PLA blanc (#ECE6DA) ; émissif doux facultatif sur les strates pour « lumière ».
- Éclatement : les strates glissent le long de Z (profondeur) : dz = (k − 10,5) × 0,03 × t ; l'anneau ne bouge pas ; rotation d'ensemble autour de Y.
- Meta panneau 02 : « 21 PARTS · anneau + 20 strates ».

## etageres-hexagonales.glb (5 Ko, Draco) — 3 nœuds
- Source : hexa.stl (MakerWorld « Étagères flottantes hexagonales », module 130×151×42 mm), 3 instances `module_1..3` en nid d'abeille (1 haut, 2 bas). Hauteur d'un module = 1.0.
- Matériaux : module_1 blanc, module_2 or, module_3 noir (3 teintes). Éclatement radial depuis le centre du trio + 0,3 en Z ; rotation autour de Z.
- Meta panneau 01 : « 3 MODULES » (inchangé).

Aperçu : models/lampe-etageres-preview.jpg (assemblé / éclaté).
