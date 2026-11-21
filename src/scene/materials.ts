import * as THREE from 'three';

const std = (color: number, roughness: number, metalness: number, flatShading: boolean) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading });

/** Palette PLA partagée ; flatShading actif pour le procédural, coupé pour les GLB (normales fournies). */
export const palette = (flatShading: boolean) => ({
  white: std(0xece6da, 0.62, 0.02, flatShading),
  black: std(0x1b1c20, 0.55, 0.05, flatShading),
  gold: std(0xc9a24b, 0.45, 0.35, flatShading),
  bronze: std(0x8a5a2b, 0.5, 0.3, flatShading),
});
