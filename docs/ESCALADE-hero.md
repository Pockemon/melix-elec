# Escalade : constat de revue contraire au plan (héros 3D)

Observé :
- La revue (src/hero3d.ts l.98, index.html l.46) affirme que « Cowork a décidé » que le héros affiche le PNG hero-illustration.png et que le canvas three.js ne s'active qu'avec un vrai casse-noisette.glb (sans modèle, aucun bloc primitif).
- La consigne de l'issue #1 exige au contraire, pour le héros, une scène Three.js temps réel avec figurine low-poly construite en pièces (vue éclatée, assemblage au défilement), le PNG n'étant que le repli sans WebGL.
- docs/design/SPEC.md (l.49-52) va dans le même sens : scène 3D 600×640, mention « Illustration 3D interactive », repli PNG sans WebGL uniquement. Aucune trace écrite de la décision invoquée par la revue dans le dépôt.

Pourquoi le plan ne tient pas : appliquer le constat inverse l'exigence centrale de l'issue et la SPEC ; c'est un changement d'architecture. Je ne le fais pas en silence.

Arbitrage demandé (rôle de décision) : (a) conserver la figurine Three.js du héros (issue + SPEC) et contester le constat, ou (b) rendre le canvas du héros conditionnel à casse-noisette.glb (PNG sinon) et retirer/adapter la mention « Illustration 3D interactive » ; la SPEC serait alors à amender.
Le constat sur le cadrage (l.118) dépend de cet arbitrage. Les journaux CI n'étant pas lisibles, aucune cause de test n'est établie.
