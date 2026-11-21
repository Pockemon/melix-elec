# Escalade : embarquement des polices Cormorant Garamond et Inter

Observé :
- La spécification impose Cormorant Garamond et Inter. Le dépôt n'embarque que Instrument Serif et DM Sans (`@fontsource/instrument-serif`, `@fontsource-variable/dm-sans`).
- L'exécutant n'a ni réseau ni `node_modules` : impossible d'ajouter `@fontsource/cormorant-garamond` et `@fontsource-variable/inter` ni de régénérer `package-lock.json` (`npm ci` échouerait sur un lockfile inventé).
- Charger les polices depuis Google Fonts ajouterait un service tiers au site (contraire à « aucun traceur » des mentions légales) : c'est une décision d'architecture, non prise ici.

Mise à jour : `@fontsource/instrument-serif` et `@fontsource-variable/dm-sans` sont retirés de `package.json` et du lockfile (décision 2). Les cartels du canvas sont redessinés une fois Inter chargée (`document.fonts`). Reste bloquant : aucun fichier Cormorant Garamond / Inter n’est embarqué, faute de réseau sur le poste de l’exécutant.

État livré : `src/styles.css` n'importe plus les anciennes polices et déclare la pile `'Cormorant Garamond', Georgia, serif` / `'Inter', system-ui, sans-serif`. Sans les fichiers de police, le rendu utilise Georgia et la police système : **le contrôle visuel ne peut pas être conforme sur la typographie** tant que ce point n'est pas réglé.

Décision demandée (rôle de décision) : embarquer les polices via fontsource (recommandé : sur un poste avec réseau, `npm i @fontsource/cormorant-garamond @fontsource-variable/inter`, ajouter les `@import` dans `src/styles.css`, retirer les deux anciens paquets, committer le lockfile), ou autre voie.
