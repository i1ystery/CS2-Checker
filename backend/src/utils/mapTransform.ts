import { MAP_CONFIGS, MapConfig } from './mapConfig';

/**
 * Transformuje Source engine souřadnice na mapové souřadnice
 * Implementace podle awpy transformačních parametrů
 * 
 * @param mapName - Název mapy (např. "de_dust2")
 * @param x - X souřadnice z Source enginu
 * @param y - Y souřadnice z Source enginu
 * @param z - Z souřadnice (výška) z Source enginu
 * @param imageWidth - Šířka obrázku mapy v pixelech
 * @param imageHeight - Výška obrázku mapy v pixelech
 * @returns Transformované souřadnice {x, y, layer} nebo null pokud je pozice mimo mapu
 */
export function transformPosition(
  mapName: string,
  x: number,
  y: number,
  z: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; layer: 'upper' | 'lower' } | null {
  const mapParams = MAP_CONFIGS[mapName];

  if (!mapParams) {
    // Fallback: lineární transformace
    const minX = -2500;
    const maxX = 2500;
    const minY = -2500;
    const maxY = 2500;

    const normalizedX = (x - minX) / (maxX - minX);
    const normalizedY = (y - minY) / (maxY - minY);

    return {
      x: normalizedX * imageWidth,
      y: (1 - normalizedY) * imageHeight,
      layer: 'upper' // Výchozí pro mapy bez z_cutoff
    };
  }

  // Určit patro pro mapy s z_cutoff
  let layer: 'upper' | 'lower' = 'upper';
  if (mapParams.z_cutoff !== undefined) {
    if (mapName === 'de_nuke') {
      // Pro nuke: z >= z_cutoff je horní patro, z < z_cutoff je dolní patro
      layer = z >= mapParams.z_cutoff ? 'upper' : 'lower';
    } else if (mapName === 'de_vertigo') {
      // Pro vertigo: z >= z_cutoff je horní patro, z < z_cutoff je dolní patro
      layer = z >= mapParams.z_cutoff ? 'upper' : 'lower';
    } else if (mapName === 'de_train') {
      // Pro train: z >= z_cutoff je horní patro, z < z_cutoff je dolní patro
      layer = z >= mapParams.z_cutoff ? 'upper' : 'lower';
    }
  }

  // - Pro X osu: (position - start) / scale
  // - Pro Y osu: (start - position) / scale  <-- Y je obráceně!
  const transformedX = (x - mapParams.pos_x) / mapParams.scale;
  const transformedY = (mapParams.pos_y - y) / mapParams.scale;

  return {
    x: transformedX,
    y: transformedY,
    layer
  };
}

/**
 * Transformuje pole souřadnic
 * @param mapName - Název mapy
 * @param coords - Pole objektů {x, y, z}
 * @param imageWidth - Šířka obrázku mapy
 * @param imageHeight - Výška obrázku mapy
 * @returns Pole transformovaných souřadnic {x, y, layer} (null hodnoty jsou filtrovány)
 */
export function transformPositions(
  mapName: string,
  coords: Array<{ x: number; y: number; z: number }>,
  imageWidth: number,
  imageHeight: number
): Array<{ x: number; y: number; layer: 'upper' | 'lower' }> {
  return coords
    .map(coord => {
      try {
        return transformPosition(mapName, coord.x, coord.y, coord.z, imageWidth, imageHeight);
      } catch (e) {
        console.warn(`Chyba při transformaci: ${e instanceof Error ? e.message : String(e)}`);
        return null;
      }
    })
    .filter((coord): coord is { x: number; y: number; layer: 'upper' | 'lower' } => coord !== null);
}
