# MELIX ELEC — Vitrine : spécification extraite de Figma

Source de vérité : Figma `mqrcZMrSenBLMdWJlZ4gxD`. Desktop 1440 : nœud `2:14` (5567 px de haut). Mobile 390 : nœud `3:2`.
Captures : `desktop-1440.png` et `mobile-390.png`, dans ce dossier.
Consigne : implémenter fidèlement, sans réinterpréter le design.

## Tokens
| Variable | Valeur | Usage |
|---|---|---|
| fond/page | #FBF6EF | fond principal (dominante claire) |
| fond/section | #F5EBDF | section Prestations |
| fond/carte | #F1DFD0 | cartes, champs de formulaire, fond du visuel |
| pastel/peche | #F6D9C9 | section Projet phare |
| pastel/sauge | #D7DEC9 | section Sous-traitance |
| pastel/abricot | #F3C9A8 | accents 3D |
| pastel/rose | #EFCFC8 | accents 3D |
| pastel/sable | #EADBC3 | accents 3D |
| trait/fin | #E8D8C8 | filets et bordures (1 px) |
| texte/principal | #2B2420 | |
| texte/secondaire | #6E6058 | |
| texte/tertiaire | #9A8B80 | |
| texte/etiquette | #C07A55 | étiquettes en capitales |
| action/principal | #3A2C25 | bouton plein |
| texte/inverse | #FBF6EF | texte des boutons pleins |

### Typographie
- Titres : Instrument Serif Regular, interlettrage -1,5 %, interligne 100 %. Tailles : 90 (héros), 61 (sections), 47 (chiffres).
- Texte : DM Sans. Regular pour le texte courant, Medium pour les étiquettes en 12 px capitales à +12 %, SemiBold pour les intertitres (22 px).

### Boutons
- Pleins : fond action/principal, texte inverse en DM Sans SemiBold 15, padding 15 × 24, rayon 999.
- Secondaires : contour 1 px texte/tertiaire.

### Mise en page
- Sections : padding 120 / 120, sauf la navigation (24 / 120), le héros (96 / 120), les chiffres (40 / 120) et le pied de page (40 / 120). Largeur utile : 1200 px.
- Rayons : cartes photo 18, visuel casse-noisette 24, scène 3D 28, cartes d'étape 20.

## Détail par section (texte, police, taille, couleur)
- **Navigation** (hauteur 99, espacement 40, bordure basse trait/fin) :
  - logo : carré de 28 px action/principal, rayon 6 ;
  - « MELIX ELEC » en SemiBold 20 texte/principal, suivi de « FABRICATION 3D GRAND FORMAT » en Medium 11 texte/tertiaire ;
  - liens Réalisations · Prestations · Sous-traitance · Devis en Medium 15 texte/secondaire ;
  - bouton plein « Obtenir un devis professionnel ».
- **Héros** (hauteur 832, espacement 48). Colonne gauche de 640 :
  - étiquette « Pôle fabrication additive · Savoie » ;
  - titre « Vos créations prennent une autre dimension. » en Instrument Serif 90 ;
  - sous-titre en 19 texte/secondaire ;
  - boutons « Demander une fabrication sur mesure » (plein) et « Devenir partenaire de production » (contour).
  À droite, la scène 3D de 600 × 640, rayon 28 :
  - repère en haut à gauche « PIÈCE 03 / 08 · ASSEMBLAGE À TENONS » ;
  - mention en bas « Illustration 3D interactive · la sculpture s'assemble au défilement » : pastille fond/page à 92 %, Medium 11.
  - Repli sans WebGL : `public/images/hero-illustration.png`.
- **Chiffres** (filets haut et bas) : 4 colonnes égales, valeur en Instrument Serif 47, légende en DM Sans 14 texte/tertiaire.
  - 1,20 m · Casse-noisette en cours de fabrication
  - XXL · Pièces assemblées par éléments
  - 1 → série · Pièce unique ou petite série
  - 0 moule · Fabrication directe depuis le fichier 3D
- **Projet phare** (fond pastel/peche) :
  - visuel de 600 × 720, rayon 24, fond fond/carte, badge « FABRICATION EN COURS » (fond action/principal, texte inverse). C'est ici que se placent la visionneuse 3D (`public/models/casse-noisette.glb`) et les photos réelles.
  - à droite :
    - étiquette « Projet phare » ;
    - titre « Un casse-noisette de 1,20 m, imprimé pièce par pièce. » en 61 ;
    - paragraphe en 18 : « Notre premier projet monumental est en cours d'impression dans l'atelier. Chaque élément est découpé pour tenir sur nos plateaux, puis assemblé par tenons invisibles. Un exemple concret de ce que nous fabriquons pour vous. » ;
    - tableau de 4 lignes avec filets trait/fin : Hauteur 1,20 m / Construction Éléments assemblés / Finition Monochrome, prêt à peindre / Statut Impression en cours.
- **Réalisations** (fond/page, espacement 48) :
  - étiquette, puis le titre « Des pièces finies, pensées pour être vues. » ;
  - 4 cartes de largeur égale, espacement 24, photo de 282 × 352 rayon 18, titre en SemiBold 22, sous-titre en 15 texte/tertiaire :
    - Lampe Vague · Lampe design · lumière LED
    - Étagères hexagonales · Mobilier mural modulaire
    - Citrouille lumineuse · Décor saisonnier 36 cm
    - Masque crâne · Pièce décorative sculptée
  - mention « Photos réelles de pièces produites à l'atelier. »
- **Prestations** (fond/section) :
  - étiquette « PRESTATIONS », puis le titre « Du fichier à la pièce monumentale. » ;
  - 2 colonnes, 4 rangées, filet haut sur chaque élément ;
  - chaque élément : numéro 01 à 08 en Medium 12 action/principal, titre en SemiBold 22, description en 16 texte/tertiaire.
    - Conception et adaptation de modèles 3D — Nous préparons ou adaptons votre modèle pour la fabrication grand format.
    - Sculptures et figurines grand format — Pièces monumentales découpées et assemblées sans colle hasardeuse.
    - Mascottes et personnages — Personnages de marque, festifs ou décoratifs, à l'échelle voulue.
    - Objets surdimensionnés — Reproduction d'objets à une échelle spectaculaire.
    - Prototypes et pièces spécifiques — Éléments non standard à intégrer dans vos décors.
    - Petites et moyennes séries — Pièce unique ou série personnalisée, sans moule.
    - Production en marque blanche — Pour les scénographes et fabricants de décors.
    - Peinture et finition en option — Finition polychrome réalisée par un partenaire spécialisé.
- **Sous-traitance** (fond pastel/sauge) :
  - étiquette « Partenaire de production », titre « Votre renfort de fabrication, discret et fiable. » ;
  - à droite, en 18 : « Nous produisons en marque blanche pour les agences de scénographie, les fabricants de décors et les organisateurs d'événements. Production monochrome, prête à intégrer ou à peindre par vos équipes ; finition peinte sur demande via un partenaire. » ;
  - 4 cartes d'étape (fond/carte, padding 28, rayon 20) :
    - 01 Brief et fichiers — Vos dimensions, quantités, échéance et modèle 3D ou références.
    - 02 Étude et découpe — Découpage en éléments imprimables et assemblables.
    - 03 Fabrication — Impression monochrome dans la teinte choisie.
    - 04 Livraison — Pièces prêtes à assembler, intégrer ou peindre.
- **Devis** (fond/page) :
  - colonne gauche :
    - étiquette « Devis professionnel » ;
    - titre « Parlons de votre projet. » ;
    - texte « Décrivez votre pièce : nous revenons vers vous par e-mail et convenons d'un échange téléphonique pour l'étudier. » ;
    - adresse « melix.elec@gmail.com ».
  - à droite, un formulaire (fond fond/section, padding 40, rayon 24) :
    - champs par paires : Entreprise et Contact ; Type de pièce et Dimensions approximatives ; Quantité et Modèle 3D ; Couleur et finition et Utilisation ; Date de livraison souhaitée et Adresse de livraison ;
    - champ « Fichiers ou visuels de référence » de 88 px ;
    - bouton plein « Obtenir un devis professionnel » ;
    - champs : fond fond/carte, contour trait/fin, rayon 12, padding 14 × 16.
- **Pied de page** : « MELIX ELEC · SASU · Pôle fabrication 3D grand format · Électricité et VMC », puis « melix.elec@gmail.com · Mentions légales », en 13 texte/tertiaire.

## Mobile 390
Même ordre de sections, colonnes empilées, padding 24, titres en Instrument Serif 40 à 36. Scène 3D de 342 × 380. Réalisations en grille 2 × 2. Formulaire sur une colonne.
