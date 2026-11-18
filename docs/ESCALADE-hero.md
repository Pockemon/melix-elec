# Escalade : constat de revue contraire au plan (héros 3D)

Observé :
- La revue (src/hero3d.ts l.98, index.html l.46) affirme que « Cowork a décidé » que le héros affiche le PNG hero-illustration.png et que le canvas three.js ne s'active qu'avec un vrai casse-noisette.glb (sans modèle, aucun bloc primitif).
- La consigne de l'issue #1 exige au contraire, pour le héros, une scène Three.js temps réel avec figurine low-poly construite en pièces (vue éclatée, assemblage au défilement), le PNG n'étant que le repli sans WebGL.
- docs/design/SPEC.md (l.49-52) va dans le même sens : scène 3D 600×640, mention « Illustration 3D interactive », repli PNG sans WebGL uniquement. Aucune trace écrite de la décision invoquée par la revue dans le dépôt.

Pourquoi le plan ne tient pas : appliquer le constat inverse l'exigence centrale de l'issue et la SPEC ; c'est un changement d'architecture. Je ne le fais pas en silence.

Arbitrage demandé (rôle de décision) : (a) conserver la figurine Three.js du héros (issue + SPEC) et contester le constat, ou (b) rendre le canvas du héros conditionnel à casse-noisette.glb (PNG sinon) et retirer/adapter la mention « Illustration 3D interactive » ; la SPEC serait alors à amender.
Le constat sur le cadrage (l.118) dépend de cet arbitrage. Les journaux CI n'étant pas lisibles, aucune cause de test n'est établie.

## Arbitrage rendu (http) : option 1

Décision applicable : reprendre l'implémentation sur la branche imposée ; l'exécutant code, teste, produit les captures desktop/mobile, commit et pousse le lot ; la preuve RUNTIME et la livraison Pages relèvent ensuite de Foreman. L'absence de la décision citée par la revue dans le dépôt n'est pas bloquante.

Conséquences appliquées :
- Le héros conserve la scène Three.js à figurine en pièces (issue #1 + docs/design/SPEC.md l.44-52) ; le constat de revue inverse (canvas conditionné au GLB) est écarté.
- Le repli image (hero-illustration.png sans WebGL ; image de repli + badge pour le casse-noisette) reste en vigueur tant que public/models/casse-noisette.glb est absent.
- Cadrage traité (src/hero3d.ts, fit()) : la caméra cadre la figurine assemblée (marge 0,86, bande haute 0,10) et s'éloigne progressivement vers la vue éclatée au scroll 0. Le test health s'exécute désormais dans un répertoire temporaire. Non exécuté ici (dépendances absentes sur ce poste) : captures docs/screenshots non régénérées, rendu à revérifier par Foreman.
