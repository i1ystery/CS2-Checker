/**
 * Transformační parametry pro CS2 mapy
 * Založeno na HLTV overview description files
 */
export interface MapConfig {
  pos_x: number;
  pos_y: number;
  scale: number;
  rotate?: number;
  zoom?: number;
  inset_left?: number;
  inset_top?: number;
  inset_right?: number;
  inset_bottom?: number;
  z_cutoff?: number; // Pro mapy s více patry (nuke, vertigo, train)
}

/**
 * Konfigurace pro všechny podporované CS2 mapy
 */
export const MAP_CONFIGS: Record<string, MapConfig> = {
  'de_dust2': {
    pos_x: -2476,
    pos_y: 3239,
    scale: 4.4,
    rotate: 1,
    zoom: 1.1
  },
  'de_mirage': {
    pos_x: -3230,
    pos_y: 1713,
    scale: 5.0,
    rotate: 0,
    zoom: 0,
    inset_left: 0.135,
    inset_top: 0.08,
    inset_right: 0.105,
    inset_bottom: 0.08
  },
  'de_inferno': {
    pos_x: -2087,
    pos_y: 3870,
    scale: 4.9
  },
  'de_ancient': {
    pos_x: -2953,
    pos_y: 2164,
    scale: 5.0,
    rotate: 0,
    zoom: 0
  },
  'de_anubis': {
    pos_x: -2796,
    pos_y: 3328,
    scale: 5.22
  },
  'de_nuke': {
    pos_x: -3453,
    pos_y: 2887,
    scale: 7.0,
    inset_left: 0.33,
    inset_top: 0.2,
    inset_right: 0.2,
    inset_bottom: 0.2,
    z_cutoff: -495.0 // Zobrazit pouze spodní patro
  },
  'de_overpass': {
    pos_x: -4831,
    pos_y: 1781,
    scale: 5.2,
    rotate: 0,
    zoom: 0
  },
  'de_vertigo': {
    pos_x: -3168,
    pos_y: 1762,
    scale: 4.0,
    inset_left: 0.1,
    inset_top: 0.1,
    inset_right: 0.2,
    inset_bottom: 0.15,
    z_cutoff: 11700.0 // Zobrazit pouze horní patro
  },
  'de_train': {
    pos_x: -2308,
    pos_y: 2078,
    scale: 4.082077,
    z_cutoff: -50.0 // Horní patro: z >= -50, dolní patro: z < -50
  },
  'de_cache': {
    pos_x: -2000,
    pos_y: 3250,
    scale: 5.0
  }
};
