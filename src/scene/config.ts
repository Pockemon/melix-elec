// Point d'entrée unique de configuration des objets 3D de la section épinglée.
// `source` : chemin d'un GLB (une part = un mesh, Draco accepté) ou 'procedural' tant que les GLB réels
// ne sont pas dans public/models/. Si le GLB échoue à charger, le modèle procédural reste affiché.

export interface ObjetConfig {
  id: 'etagere' | 'lampe' | 'casse-noisette';
  label: string;
  source: string;
  /** Amplitude de l'éclatement (unités de scène) et rotation propre des parts (rad) à t = 1. */
  explode: { distance: number; twist: number };
}

export const OBJETS: readonly ObjetConfig[] = [
  { id: 'etagere', label: 'Étagères hexagonales', source: 'etageres-hexagonales.glb', explode: { distance: 1.1, twist: 0.7 } },
  { id: 'lampe', label: 'Lampe Vague', source: 'lampe-vague.glb', explode: { distance: 1.1, twist: 0.7 } },
  { id: 'casse-noisette', label: 'Casse-noisette', source: 'casse-noisette.glb', explode: { distance: 1.1, twist: 0.7 } },
];

export const DRACO_PATH = '/draco/';

/** URL du GLB, ou null pour le repli procédural. */
export const modelUrl = (o: ObjetConfig): string | null =>
  o.source === 'procedural' ? null : o.source.startsWith('/') ? o.source : `/models/${o.source}`;
