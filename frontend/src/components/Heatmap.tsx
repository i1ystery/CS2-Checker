'use client';

import { useEffect, useRef, useState } from 'react';

interface HeatmapProps {
  mapName: string;
  deaths: Array<{ x: number; y: number; z?: number; team_num?: number }>;
  kills: Array<{ x: number; y: number; z?: number; team_num?: number }>;
  width?: number;
  height?: number;
  teamMode: 't' | 'ct';
  visualizationMode: 'dots' | 'heatmap';
  layer?: 'upper' | 'lower';
}

/**
 * Komponenta pro vykreslení heatmapy nebo tečkové mapy na herní mapě
 * Podporuje dva módy: tečková mapa (dots) a heatmapa (heatmap)
 */
export function Heatmap({ 
  mapName, 
  deaths, 
  kills, 
  width = 800, 
  height = 600, 
  teamMode, 
  visualizationMode = 'dots',
  layer
}: HeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [upperImageLoaded, setUpperImageLoaded] = useState(false);
  const [lowerImageLoaded, setLowerImageLoaded] = useState(false);
  const upperImgRef = useRef<HTMLImageElement | null>(null);
  const lowerImgRef = useRef<HTMLImageElement | null>(null);

  // Určit, zda potřebujeme zobrazit obě mapy (horní ztmavenou + dolní)
  const needsLayeredMaps = layer === 'lower' && (mapName === 'de_vertigo' || mapName === 'de_train' || mapName === 'de_nuke');

  // Určit název souboru mapy podle layer
  const getMapImageName = (): string => {
    if (layer === 'lower' && mapName === 'de_vertigo') {
      return 'de_vertigo_lower';
    }
    if (layer === 'lower' && mapName === 'de_train') {
      return 'de_train_lower';
    }
    if (layer === 'lower' && mapName === 'de_nuke') {
      return 'de_nuke_lower';
    }
    return mapName;
  };

  const mapImageName = getMapImageName();

  // Resetovat stavy při změně mapy nebo layer
  useEffect(() => {
    setImageLoaded(false);
    setUpperImageLoaded(false);
    setLowerImageLoaded(false);
    setImageSize(null);
    setImageError(false);
  }, [mapName, layer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (needsLayeredMaps) {
      // Pro vrstvené mapy - čekat na načtení obou obrázků
      if (!upperImageLoaded || !lowerImageLoaded || !imageSize || !upperImgRef.current || !lowerImgRef.current) {
        return;
      }

      const upperImg = upperImgRef.current;
      const lowerImg = lowerImgRef.current;

      // Použít rozměry z horní mapy
      const aspectRatio = upperImg.width / upperImg.height;
      let canvasWidth = width;
      let canvasHeight = width / aspectRatio;
      
      if (canvasHeight > height) {
        canvasHeight = height;
        canvasWidth = height * aspectRatio;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // 1. Vykreslit horní mapu jako základ
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.drawImage(upperImg, 0, 0, canvasWidth, canvasHeight);
      
      // 2. Ztmavit horní mapu (přidat tmavý overlay - tmavší)
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.7; // Ztmavení na 70% (tmavší)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // 3. Vykreslit dolní mapu přes ztmavenou horní
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      ctx.drawImage(lowerImg, 0, 0, canvasWidth, canvasHeight);

      // 4. Backend posílá transformované pixelové souřadnice
      // Musíme je jen škálovat na velikost canvasu
      const scaleX = canvasWidth / upperImg.width;
      const scaleY = canvasHeight / upperImg.height;

      // 5. Filtrovat události podle týmu
      const filteredDeaths = deaths.filter(d => {
        if (teamMode === 't') return d.team_num === 2;
        if (teamMode === 'ct') return d.team_num === 3;
        return false;
      });
      
      const filteredKills = kills.filter(k => {
        if (teamMode === 't') return k.team_num === 2;
        if (teamMode === 'ct') return k.team_num === 3;
        return false;
      });

      // 6. Vykreslit heatmapu až na výsledek (po vykreslení obou map)
      if (visualizationMode === 'dots') {
        renderDotMap(ctx, filteredDeaths, filteredKills, scaleX, scaleY, canvasWidth, canvasHeight);
      } else {
        renderHeatmap(ctx, filteredDeaths, filteredKills, scaleX, scaleY, canvasWidth, canvasHeight);
      }
    } else {
      // Standardní zobrazení - jen jedna mapa
      if (!imageLoaded || !imageSize) {
        return;
      }

      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Nastavit velikost canvasu podle obrázku (zachovat aspect ratio)
        const aspectRatio = img.width / img.height;
        let canvasWidth = width;
        let canvasHeight = width / aspectRatio;
        
        if (canvasHeight > height) {
          canvasHeight = height;
          canvasWidth = height * aspectRatio;
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Vykreslit mapu jako základ
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

        // Backend posílá transformované pixelové souřadnice
        // Musíme je jen škálovat na velikost canvasu
        const scaleX = canvasWidth / img.width;
        const scaleY = canvasHeight / img.height;

        // Filtrovat události podle týmu
        const filteredDeaths = deaths.filter(d => {
          if (teamMode === 't') return d.team_num === 2;
          if (teamMode === 'ct') return d.team_num === 3;
          return false;
        });
        
        const filteredKills = kills.filter(k => {
          if (teamMode === 't') return k.team_num === 2;
          if (teamMode === 'ct') return k.team_num === 3;
          return false;
        });

        if (visualizationMode === 'dots') {
          renderDotMap(ctx, filteredDeaths, filteredKills, scaleX, scaleY, canvasWidth, canvasHeight);
        } else {
          renderHeatmap(ctx, filteredDeaths, filteredKills, scaleX, scaleY, canvasWidth, canvasHeight);
        }
      };

      img.onerror = () => {
        setImageError(true);
      };

      img.src = `/${mapImageName}.png`;
    }
  }, [mapImageName, mapName, deaths, kills, width, height, imageLoaded, imageSize, teamMode, visualizationMode, layer, needsLayeredMaps, upperImageLoaded, lowerImageLoaded]);

  /**
   * Vykreslí tečkovou mapu - smrti jako červené kruhy, zabití jako zelené kruhy
   */
  function renderDotMap(
    ctx: CanvasRenderingContext2D,
    filteredDeaths: Array<{ x: number; y: number; team_num?: number }>,
    filteredKills: Array<{ x: number; y: number; team_num?: number }>,
    scaleX: number,
    scaleY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    const POINT_RADIUS = 5;
    const DEATH_COLOR = 'rgba(239, 68, 68, 0.9)'; // Červená
    const KILL_COLOR = 'rgba(34, 197, 94, 0.9)'; // Zelená

    // Vykreslit smrti
    filteredDeaths.forEach((death) => {
      if (!death || death.x === undefined || death.y === undefined || isNaN(death.x) || isNaN(death.y)) {
        return;
      }

      const canvasX = death.x * scaleX;
      const canvasY = death.y * scaleY;
      
      if (isNaN(canvasX) || isNaN(canvasY)) {
        return;
      }

      ctx.fillStyle = DEATH_COLOR;
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, POINT_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Vykreslit zabití
    filteredKills.forEach((kill) => {
      if (!kill || kill.x === undefined || kill.y === undefined || isNaN(kill.x) || isNaN(kill.y)) {
        return;
      }

      const canvasX = kill.x * scaleX;
      const canvasY = kill.y * scaleY;
      
      if (isNaN(canvasX) || isNaN(canvasY)) {
        return;
      }

      ctx.fillStyle = KILL_COLOR;
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, POINT_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  /**
   * Vykreslí heatmapu s barevnou škálou intenzity
   */
  function renderHeatmap(
    ctx: CanvasRenderingContext2D,
    filteredDeaths: Array<{ x: number; y: number; team_num?: number }>,
    filteredKills: Array<{ x: number; y: number; team_num?: number }>,
    scaleX: number,
    scaleY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    const HEATMAP_RADIUS = 30;
    const HEATMAP_INTENSITY = 0.15;
    const BLUR_RADIUS = 8;

    // Kombinovat smrti a zabití
    const allEvents = [
      ...filteredDeaths.map(d => ({ ...d, eventType: 'death' as const })),
      ...filteredKills.map(k => ({ ...k, eventType: 'kill' as const }))
    ];

    // Vytvořit heatmap buffer pro vybraný tým
    const teamNum = teamMode === 't' ? 2 : 3;
    const heatmapBuffer = createHeatmapBuffer(
      allEvents,
      teamNum,
      canvasWidth,
      canvasHeight,
      scaleX,
      scaleY,
      HEATMAP_RADIUS,
      HEATMAP_INTENSITY
    );

    // Aplikovat blur a vykreslit
    const blurredBuffer = applyBlur(heatmapBuffer, canvasWidth, canvasHeight, BLUR_RADIUS);
    drawHeatmapOnCanvas(ctx, blurredBuffer, canvasWidth, canvasHeight);
  }

  /**
   * Vytvoří heatmap buffer s intenzitami pro každý pixel
   */
  function createHeatmapBuffer(
    events: Array<{ x: number; y: number; team_num?: number; eventType: 'death' | 'kill' }>,
    teamNum: number,
    width: number,
    height: number,
    scaleX: number,
    scaleY: number,
    radius: number,
    intensity: number
  ): Uint8ClampedArray {
    const buffer = new Uint8ClampedArray(width * height * 4);

    // Přidat intenzitu pro každý bod
    events.forEach((point) => {
      if (!point || point.x === undefined || point.y === undefined || isNaN(point.x) || isNaN(point.y)) {
        return;
      }

      if (point.team_num !== teamNum) {
        return;
      }

      const canvasX = point.x * scaleX;
      const canvasY = point.y * scaleY;
      
      if (isNaN(canvasX) || isNaN(canvasY) || 
          canvasX < 0 || canvasX >= width || 
          canvasY < 0 || canvasY >= height) {
        return;
      }

      addIntensityToBuffer(buffer, canvasX, canvasY, width, height, radius, intensity);
    });

    // Najít maximální intenzitu pro normalizaci
    let maxIntensity = 0;
    for (let i = 3; i < buffer.length; i += 4) {
      maxIntensity = Math.max(maxIntensity, buffer[i] / 255);
    }

    // Převést intenzitu na barvu podle heatmap škály
    for (let i = 0; i < buffer.length; i += 4) {
      const intensity = buffer[i + 3] / 255;
      if (intensity > 0) {
        const normalizedIntensity = maxIntensity > 0 ? intensity / maxIntensity : 0;
        const color = intensityToColor(normalizedIntensity);
        
        buffer[i] = color.r;
        buffer[i + 1] = color.g;
        buffer[i + 2] = color.b;
        buffer[i + 3] = Math.round(intensity * 255);
      }
    }

    return buffer;
  }

  /**
   * Přidá intenzitu do bufferu na dané pozici
   */
  function addIntensityToBuffer(
    buffer: Uint8ClampedArray,
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    radius: number,
    intensity: number
  ) {
    const cx = Math.round(centerX);
    const cy = Math.round(centerY);
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance <= radius) {
            // Gaussian-like funkce pro plynulý pokles intenzity
            const weight = Math.exp(-(distance * distance) / (2 * radius * radius / 3));
            const alpha = weight * intensity;
            
            const index = (y * width + x) * 4;
            const currentIntensity = buffer[index + 3] / 255;
            const newIntensity = Math.min(1.0, currentIntensity + alpha);
            buffer[index + 3] = Math.round(newIntensity * 255);
          }
        }
      }
    }
  }

  /**
   * Převádí intenzitu na barvu podle heatmap škály
   * Barevná škála: modrá (nízká) -> zelená -> žlutá -> oranžová -> červená (vysoká)
   */
  function intensityToColor(intensity: number): { r: number; g: number; b: number } {
    const normalized = Math.min(1.0, intensity);
    let r, g, b;
    
    if (normalized < 0.25) {
      // Modrá -> zelená (0-0.25)
      const t = normalized / 0.25;
      r = 0;
      g = Math.round(255 * t);
      b = Math.round(255 * (1 - t));
    } else if (normalized < 0.5) {
      // Zelená -> žlutá (0.25-0.5)
      const t = (normalized - 0.25) / 0.25;
      r = Math.round(255 * t);
      g = 255;
      b = 0;
    } else if (normalized < 0.75) {
      // Žlutá -> oranžová (0.5-0.75)
      const t = (normalized - 0.5) / 0.25;
      r = 255;
      g = Math.round(255 * (1 - t * 0.5));
      b = 0;
    } else {
      // Oranžová -> červená (0.75-1.0)
      const t = (normalized - 0.75) / 0.25;
      r = 255;
      g = Math.round(255 * (0.5 - t * 0.5));
      b = 0;
    }
    
    return { r, g, b };
  }

  /**
   * Aplikuje blur efekt na heatmap buffer
   */
  function applyBlur(
    buffer: Uint8ClampedArray,
    width: number,
    height: number,
    blurRadius: number
  ): Uint8ClampedArray {
    const blurredData = new Uint8ClampedArray(buffer.length);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        let count = 0;
        
        for (let dy = -blurRadius; dy <= blurRadius; dy++) {
          for (let dx = -blurRadius; dx <= blurRadius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance <= blurRadius) {
                const weight = Math.exp(-(distance * distance) / (2 * blurRadius * blurRadius / 3));
                const idx = (ny * width + nx) * 4;
                r += buffer[idx] * weight;
                g += buffer[idx + 1] * weight;
                b += buffer[idx + 2] * weight;
                a += buffer[idx + 3] * weight;
                count += weight;
              }
            }
          }
        }
        
        if (count > 0) {
          const idx = (y * width + x) * 4;
          blurredData[idx] = Math.round(r / count);
          blurredData[idx + 1] = Math.round(g / count);
          blurredData[idx + 2] = Math.round(b / count);
          blurredData[idx + 3] = Math.round(a / count);
        }
      }
    }
    
    return blurredData;
  }

  /**
   * Vykreslí heatmapu na canvas
   */
  function drawHeatmapOnCanvas(
    ctx: CanvasRenderingContext2D,
    buffer: Uint8ClampedArray,
    width: number,
    height: number
  ) {
    const heatmapCanvas = document.createElement('canvas');
    heatmapCanvas.width = width;
    heatmapCanvas.height = height;
    const heatmapCtx = heatmapCanvas.getContext('2d');
    
    if (!heatmapCtx) return;

    const imageData = new ImageData(new Uint8ClampedArray(buffer), width, height);
    heatmapCtx.putImageData(imageData, 0, 0);
    
    // Kombinovat heatmapu s mapou pomocí source-over
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
    ctx.drawImage(heatmapCanvas, 0, 0);
    
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
  }

  if (imageError) {
    return (
      <div className="bg-gray-900/50 rounded-lg border border-dashed border-gray-700 p-16 text-center">
        <p className="text-gray-500">Nepodařilo se načíst obrázek mapy</p>
      </div>
    );
  }

  const hasData = deaths.length > 0 || kills.length > 0;

  return (
    <div className="space-y-4">
      {/* Legenda nad mapou */}
      {hasData && visualizationMode === 'dots' && (
        <div className="bg-gray-900/80 rounded-lg px-3 py-2 flex flex-col gap-2 text-sm">
          <div className="text-white font-semibold mb-1">Legenda</div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-white text-xs">Pozice smrti</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-white text-xs">Pozice zabití</span>
          </div>
        </div>
      )}
      
      {/* Legenda pro heatmapu */}
      {hasData && visualizationMode === 'heatmap' && (
        <div className="bg-gray-900/80 rounded-lg px-3 py-2 flex flex-col gap-2 text-sm">
          <div className="text-white font-semibold mb-1">Legenda</div>
          <div className="text-xs text-gray-300 mb-2">Intenzita výskytu hráče</div>
          <div className="flex flex-col gap-1">
            <div 
              className="w-full h-3 rounded" 
              style={{ background: 'linear-gradient(to right, #0000ff, #00ff00, #ffff00, #ff9900, #ff0000)' }}
            />
            <div className="flex items-center justify-between text-xs text-gray-300">
              <span>Nízká</span>
              <span>Vysoká</span>
            </div>
          </div>
        </div>
      )}

      <div className="relative w-full aspect-square">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="absolute inset-0 w-full h-full rounded-lg border border-gray-700"
        />
      </div>
      
      {/* Skryté obrázky pro načtení rozměrů */}
      {needsLayeredMaps ? (
        <>
          <img
            ref={(el) => {
              upperImgRef.current = el;
            }}
            src={`/${mapName}.png`}
            alt={`${mapName} upper`}
            className="hidden"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (!imageSize) {
                setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
              }
              setUpperImageLoaded(true);
            }}
            onError={() => setImageError(true)}
          />
          <img
            ref={(el) => {
              lowerImgRef.current = el;
            }}
            src={`/${mapImageName}.png`}
            alt={`${mapImageName} lower`}
            className="hidden"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (!imageSize) {
                setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
              }
              setLowerImageLoaded(true);
            }}
            onError={() => setImageError(true)}
          />
        </>
      ) : (
        <img
          src={`/${mapImageName}.png`}
          alt={mapImageName}
          className="hidden"
          onLoad={(e) => {
            const img = e.currentTarget;
            setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
            setImageLoaded(true);
          }}
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}
