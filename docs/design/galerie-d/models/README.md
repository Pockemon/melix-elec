# Modèles 3D réels — Galerie D

## casse-noisette.glb (410 Ko, Draco)
- Source : découpe GPS du casse-noisette (24 pièces STL, dossier SELLA/CASSE NOISETTE, 14/11/2026), ~605 k faces → 124 k faces (fast-simplification, 4 500 faces/part).
- Repère : Y vers le haut, origine au centre du socle, hauteur normalisée = 1.0 (le vrai modèle fait 1,20 m ; ×1.2 si l'échelle réelle compte).
- 24 nœuds nommés `part_NN_s{tranche}_q{quadrant}` : tranche 0 (socle/jambes) → 5 (chapeau), quadrant 0..3 = (x−,y−), (x+,y−), (x−,y+), (x+,y+) dans le repère source.
- Normales incluses. Décodage : DRACOLoader (three/examples/jsm/libs/draco/ à servir en local, pas de CDN).
- Éclatement recommandé : dir = normalize(centre de la part − axe vertical) en XZ + (tranche − 2,5) × 0,25 en Y ; distance 0,22 × t ; rotation 0,3 × t autour de Y. Voir models/casse-noisette-preview.jpg (gauche assemblé, droite éclaté).
- Le panneau 03 (« 5 TRANCHES ») devient « 6 TRANCHES · 24 PIÈCES » : Figma 71:149 meta à mettre à jour par Cowork lors du candidate-check.

## étagères hexagonales / lampe Vague
- Fichiers sources non trouvés sur le poste (21/11) : repli procédural du prototype conservé jusqu'à réception.
