# Polices : Cormorant Garamond et Inter

**Tranché : fichiers committés** (décision Cowork, commit fc67bcc). Ni fontsource, ni requête externe (Google Fonts exclu : « aucun traceur »).

- `public/fonts/` : 6 fichiers woff2 variables (Cormorant Garamond normal/italique 300–400, Inter 400–500 ; sous-ensembles latin et latin-ext, licence OFL) et `fonts.css` (`@font-face`, `font-display: swap`).
- `index.html` charge `/fonts/fonts.css` et précharge les deux fichiers latin principaux.
- `src/styles.css` : `'Cormorant Garamond', Georgia, serif` pour titres et cartels ; `'Inter', system-ui, sans-serif` pour le texte. Les cartels du canvas sont redessinés une fois Inter chargée (`document.fonts`).
- `package.json` ne contient aucune dépendance `@fontsource/*`.
- `tests/galerie.test.ts` vérifie la présence des fichiers et leur référence dans `fonts.css`.
