# Polices Galerie D : woff2 à fournir (bloquant externe, pas de changement d'architecture)

Observé : la consigne (#17) demande Bebas Neue, Space Grotesk et JetBrains Mono auto-hébergées en woff2. Le dépôt ne contient plus que Cormorant Garamond / Inter (retirés, identité remplacée) et l'exécutant n'a pas de réseau : les fichiers n'ont pas pu être récupérés. Le prototype de référence charge Google Fonts, interdit ici (« aucun traceur »).

Fait : `public/fonts/fonts.css` déclare les trois familles avec `src: local(...)` uniquement (aucune requête externe, aucun 404). Sur un poste sans ces polices, la pile de repli du CSS s'applique (Oswald / Inter / monospace) : le rendu n'est donc PAS pixel-fidèle à Figma tant que les fichiers manquent.

À faire (lot suivant, avec accès réseau) : déposer dans `public/fonts/` les woff2 latin (+ latin-ext) de Bebas Neue 400, Space Grotesk 400–700 et JetBrains Mono 400–500 (licence OFL), ajouter `url('/fonts/….woff2') format('woff2')` aux `@font-face`, précharger Bebas Neue dans `index.html`.

Autres écarts à connaître :
- Figma (mqrcZMrSenBLMdWJlZ4gxD) inaccessible depuis ce poste : la mise en page suit `docs/design/galerie-d/page-reference.html` (valeurs CSS du prototype), à contrôler par le candidate-check.
- Le formulaire de devis (MX-DEVIS-01) est conservé dans une `<dialog>` ouverte par le CTA, pour ne pas régresser ; son habillage n'est pas dans Figma.
- Décodeur Draco : `DRACO_PATH` `/draco/` est à alimenter (copie de `three/examples/jsm/libs/draco/gltf/`) avec les GLB réels ; non chargé tant que `source` = `procedural`.
