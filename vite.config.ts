import { existsSync } from 'node:fs';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/melix-elec/',
  define: {
    // Le modèle n'est requêté que s'il est présent au build : aucune 404 en console.
    __HAS_MODEL__: JSON.stringify(existsSync('public/models/casse-noisette.glb')),
  },
  build: { target: 'es2022', chunkSizeWarningLimit: 600 },
  test: { include: ['tests/**/*.test.ts'] },
});
