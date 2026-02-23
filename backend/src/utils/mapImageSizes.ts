/**
 * Rozměry obrázků map v pixelech
 * Tyto hodnoty jsou potřebné pro správnou transformaci souřadnic
 */
export const MAP_IMAGE_SIZES: Record<string, { width: number; height: number }> = {
  'de_dust2': { width: 1024, height: 1024 },
  'de_mirage': { width: 1024, height: 1024 },
  'de_inferno': { width: 1024, height: 1024 },
  'de_ancient': { width: 1024, height: 1024 },
  'de_anubis': { width: 1024, height: 1024 },
  'de_nuke': { width: 1024, height: 1024 },
  'de_overpass': { width: 1024, height: 1024 },
  'de_vertigo': { width: 1024, height: 1024 },
  'de_train': { width: 1024, height: 1024 },
  'de_cache': { width: 1024, height: 1024 }
};

/**
 * Získá rozměry obrázku mapy
 */
export function getMapImageSize(mapName: string): { width: number; height: number } {
  return MAP_IMAGE_SIZES[mapName] || { width: 1024, height: 1024 };
}

