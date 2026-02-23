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
}

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
    inset_bottom: 0.2
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
    inset_bottom: 0.15
  },
  'de_train': {
    pos_x: -2308,
    pos_y: 2078,
    scale: 4.082077
  },
  'de_cache': {
    pos_x: -2000,
    pos_y: 3250,
    scale: 5.0
  }
};

/**
 * Transformuje Source engine souřadnice na pixelové souřadnice na mapě
 * @param x Source engine X souřadnice
 * @param y Source engine Y souřadnice
 * @param z Source engine Z souřadnice (výška) - prozatím nepoužíváno
 * @param mapName Název mapy (např. 'de_dust2')
 * @param imageWidth Šířka obrázku mapy v pixelech
 * @param imageHeight Výška obrázku mapy v pixelech
 * @returns Pixelové souřadnice {x, y} na obrázku mapy
 */
export function transformCoordinates(
  x: number,
  y: number,
  z: number,
  mapName: string,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } {
  const config = MAP_CONFIGS[mapName];
  
  if (!config) {
    // Fallback: lineární transformace
    const minX = -2500;
    const maxX = 2500;
    const minY = -2500;
    const maxY = 2500;
    
    const normalizedX = (x - minX) / (maxX - minX);
    const normalizedY = (y - minY) / (maxY - minY);
    
    return {
      x: normalizedX * imageWidth,
      y: (1 - normalizedY) * imageHeight // Obrátit Y osu
    };
  }

  // Transformace podle HLTV overview parametrů
  // Vzorec: pixel = (source - pos) * scale
  // Poznámka: pos_x a pos_y jsou souřadnice levého horního rohu v Source engine souřadnicích
  let pixelX = (x - config.pos_x) * config.scale;
  let pixelY = (y - config.pos_y) * config.scale;

  // Aplikovat inset (okraje) pokud jsou definovány
  // Inset definuje, jaká část obrázku je skutečně použitelná
  if (config.inset_left || config.inset_top || config.inset_right || config.inset_bottom) {
    const insetLeft = (config.inset_left || 0) * imageWidth;
    const insetTop = (config.inset_top || 0) * imageHeight;
    const insetRight = (config.inset_right || 0) * imageWidth;
    const insetBottom = (config.inset_bottom || 0) * imageHeight;
    
    // Přepočítat souřadnice na efektivní oblast (bez inset)
    // pixelX a pixelY jsou nyní v souřadnicích celého obrázku
    // Musíme je přepočítat na efektivní oblast
    const effectiveWidth = imageWidth - insetLeft - insetRight;
    const effectiveHeight = imageHeight - insetTop - insetBottom;
    
    // Normalizovat na 0-1 rozsah v efektivní oblasti
    const normalizedX = pixelX / imageWidth;
    const normalizedY = pixelY / imageHeight;
    
    // Přepočítat na souřadnice v efektivní oblasti
    pixelX = insetLeft + normalizedX * effectiveWidth;
    pixelY = insetTop + normalizedY * effectiveHeight;
  }

  // Aplikovat rotaci pokud je potřeba
  if (config.rotate === 1) {
    // Rotace o 90° proti směru hodinových ručiček
    // Pro rotate=1: nové X = staré Y, nové Y = imageWidth - staré X
    const tempX = pixelX;
    pixelX = imageHeight - pixelY;
    pixelY = tempX;
  }

  // Obrátit Y osu (Source engine má kladné Y nahoru, obrázek má kladné Y dolů)
  pixelY = imageHeight - pixelY;

  return {
    x: pixelX,
    y: pixelY
  };
}

