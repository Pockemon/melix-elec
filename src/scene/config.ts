// Point d'entrÃ©e unique de configuration des objets 3D de la section Ã©pinglÃ©e.
// `source` : chemin d'un GLB (une part = un mesh, Draco acceptÃ©) ou 'procedural' tant que les GLB rÃ©els
// ne sont pas dans public/models/. Si le GLB Ã©choue Ã  charger, le modÃ¨le procÃ©dural reste affichÃ©.

export interface ObjetConfig {
  id: 'etagere' | 'lampe' | 'casse-noisette';
  label: string;
  source: string;
  /** Amplitude de l'Ã©clatement (unitÃ©s de scÃ¨ne) et rotation propre des parts (rad) Ã  t = 1. */
  explode: { distance: number; twist: number };
}

export const OBJETS: readonly ObjetConfig[] = [
  { id: 'etagere', label: 'Ã‰tagÃ¨res hexagonales', source: 'etageres-hexagonales.glb', explode: { distance: 1.1, twist: 0.7 } },
  { id: 'lampe', label: 'Lampe Vague', source: 'lampe-vague.glb', explode: { distance: 1.1, twist: 0.7 } },
  { id: 'casse-noisette', label: 'Casse-noisette', source: 'casse-noisette.glb', explode: { distance: 1.1, twist: 0.7 } },
];

export const DRACO_PATH = '/draco/';

/** URL du GLB, ou null pour le repli procÃ©dural. */
export const modelUrl = (o: ObjetConfig): string | null =>
  o.source === 'procedural' ? null : o.source.startsWith('/') ? o.source : `/models/${o.source}`;
