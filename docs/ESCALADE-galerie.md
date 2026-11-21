# Escalade : l'issue #15 (galerie 3D) contredit le design Figma, la SPEC et l'arbitrage de l'issue #1

Observé :
- L'issue #15 demande une identité graphite/os/cuivre, Cormorant Garamond + Inter, une salle circulaire claire à niches en arche, des photos encadrées avec cartels et une caméra qui parcourt la galerie. Elle abandonne la figurine low-poly et la grosse typographie (décision Jean du 18/11).
- `docs/FIGMA.md` et `docs/design/SPEC.md` (source de vérité Figma `mqrcZMrSenBLMdWJlZ4gxD`, nœuds 2:14 et 3:2) décrivent une palette pastel chaude (#FBF6EF, #F5EBDF, …), Instrument Serif 90/61/47 et DM Sans, avec une scène héros à figurine en pièces. La consigne impose de respecter ce Figma sans l'interpréter.
- `docs/ESCALADE-hero.md` (arbitrage option 1) maintient la figurine Three.js du héros.
- `.foreman/delivery-contract.json` fait vérifier sur la page publiée « Vos créations prennent une autre dimension ». `scripts/prove-lib.mjs` (MX-SITE-01) exige ce texte et les sections projet, réalisations, prestations, sous-traitance, devis. Une refonte en galerie les modifie.
- Ce poste n'a ni réseau ni accès Figma (figma=false). Je ne peux pas lire les nœuds 2:14 et 3:2 pour savoir si le Figma a été mis à jour avec la galerie. Le dépôt ne contient que l'ancien design.

Pourquoi le plan ne tient pas : implémenter l'issue revient à remplacer les tokens, les polices, la scène héros et le contenu du contrat de livraison. Cela contredit le Figma documenté et l'arbitrage rendu. Suivre le Figma documenté contredit l'issue. Choisir l'un des deux est une décision d'architecture. Je ne la prends pas en silence, et je n'ai modifié aucun code.

Arbitrage demandé (rôle de décision) :
1. Le Figma `mqrcZMrSenBLMdWJlZ4gxD` a-t-il été mis à jour avec la galerie (ensure-design PASS) ? Si oui, il faut mettre à jour `docs/design/SPEC.md` et `docs/FIGMA.md` depuis ce Figma, avec le texte des nœuds, puisque je n'y ai pas accès.
2. Cette décision annule-t-elle l'arbitrage de `ESCALADE-hero.md` (fin de la figurine) ?
3. Quel contenu remplace « Vos créations prennent une autre dimension » et les sections attendues dans `delivery-contract.json` et `prove-lib.mjs` ?
4. Le nom de la commande de preuve est `prove-mx-gal-01`. Doit-elle vérifier health.sha, les sections de la galerie et le repli liste sans WebGL, comme `prove-mx-site-01` ?

Je reprends l'implémentation quand la décision est rendue. La preuve `prove-mx-gal-01` sera exécutée par Foreman après livraison.

## Arbitrage reçu (Cowork, 21/11) — appliqué
Le Figma est complété en parallèle ; la spécification textuelle est reportée dans `docs/design/SPEC.md` et `docs/FIGMA.md`. La figurine low-poly, la palette pastel et Instrument Serif / DM Sans sont supprimées (`ESCALADE-hero.md` retiré). L'accroche devient « Des pièces uniques, conçues et fabriquées sur mesure. » (`.foreman/delivery-contract.json`, `scripts/prove-lib.mjs`). `prove-mx-gal-01` est livrée (`scripts/prove-mx-gal-01.mjs`). Point resté ouvert : `docs/ESCALADE-polices.md`.
