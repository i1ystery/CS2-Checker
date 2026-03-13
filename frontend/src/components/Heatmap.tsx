'use client';

import { useEffect, useRef, useState } from 'react';
import { SimpleHeat } from '@/lib/simpleheat';

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

const HEATMAP_GRADIENT: Record<number, string> = {
  0.0: '#0000ff',
  0.25: '#00ff00',
  0.5: '#ffff00',
  0.75: '#ff9900',
  1.0: '#ff0000',
};

export function Heatmap({
  mapName,
  deaths,
  kills,
  width = 1024,
  height = 1024,
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

  const needsLayeredMaps = layer === 'lower' && (mapName === 'de_vertigo' || mapName === 'de_train' || mapName === 'de_nuke');

  const getMapImageName = (): string => {
    if (layer === 'lower') {
      if (mapName === 'de_vertigo') return 'de_vertigo_lower';
      if (mapName === 'de_train') return 'de_train_lower';
      if (mapName === 'de_nuke') return 'de_nuke_lower';
    }
    return mapName;
  };

  const mapImageName = getMapImageName();

  useEffect(() => {
    setImageLoaded(false);
    setUpperImageLoaded(false);
    setLowerImageLoaded(false);
    setImageSize(null);
    setImageError(false);
  }, [mapName, layer]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const cvs: HTMLCanvasElement = canvasRef.current;
    const context: CanvasRenderingContext2D = cvs.getContext('2d')!;

    const teamNum = teamMode === 't' ? 2 : 3;

    const filterByTeam = (events: Array<{ x: number; y: number; team_num?: number }>) =>
      events.filter(e => e && !isNaN(e.x) && !isNaN(e.y) && e.team_num === teamNum);

    const filteredDeaths = filterByTeam(deaths);
    const filteredKills = filterByTeam(kills);

    function drawOnCanvas(baseImg: HTMLImageElement, overlayImg?: HTMLImageElement) {
      const aspectRatio = baseImg.width / baseImg.height;
      let cw = width;
      let ch = width / aspectRatio;
      if (ch > height) { ch = height; cw = height * aspectRatio; }

      cvs.width = cw;
      cvs.height = ch;

      context.globalCompositeOperation = 'source-over';
      context.globalAlpha = 1.0;

      if (overlayImg) {
        context.drawImage(baseImg, 0, 0, cw, ch);
        context.globalAlpha = 0.7;
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, cw, ch);
        context.globalAlpha = 1.0;
        context.drawImage(overlayImg, 0, 0, cw, ch);
      } else {
        context.drawImage(baseImg, 0, 0, cw, ch);
      }

      const scaleX = cw / baseImg.width;
      const scaleY = ch / baseImg.height;

      if (visualizationMode === 'dots') {
        renderDots(context, filteredDeaths, filteredKills, scaleX, scaleY);
      } else {
        renderHeatmap(context, filteredDeaths, filteredKills, scaleX, scaleY, cw, ch);
      }
    }

    if (needsLayeredMaps) {
      if (!upperImageLoaded || !lowerImageLoaded || !imageSize || !upperImgRef.current || !lowerImgRef.current) return;
      drawOnCanvas(upperImgRef.current, lowerImgRef.current);
    } else {
      if (!imageLoaded || !imageSize) return;
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => drawOnCanvas(img);
      img.onerror = () => setImageError(true);
      img.src = `/${mapImageName}.png`;
    }
  }, [mapImageName, mapName, deaths, kills, width, height, imageLoaded, imageSize, teamMode, visualizationMode, layer, needsLayeredMaps, upperImageLoaded, lowerImageLoaded]);

  function renderDots(
    ctx: CanvasRenderingContext2D,
    filteredDeaths: Array<{ x: number; y: number }>,
    filteredKills: Array<{ x: number; y: number }>,
    scaleX: number,
    scaleY: number
  ) {
    const RADIUS = 5;

    for (const d of filteredDeaths) {
      const cx = d.x * scaleX, cy = d.y * scaleY;
      if (isNaN(cx) || isNaN(cy)) continue;
      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.beginPath();
      ctx.arc(cx, cy, RADIUS, 0, 2 * Math.PI);
      ctx.fill();
    }

    for (const k of filteredKills) {
      const cx = k.x * scaleX, cy = k.y * scaleY;
      if (isNaN(cx) || isNaN(cy)) continue;
      ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
      ctx.beginPath();
      ctx.arc(cx, cy, RADIUS, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  function renderHeatmap(
    ctx: CanvasRenderingContext2D,
    filteredDeaths: Array<{ x: number; y: number }>,
    filteredKills: Array<{ x: number; y: number }>,
    scaleX: number,
    scaleY: number,
    canvasWidth: number,
    canvasHeight: number
  ) {
    const allEvents = [...filteredDeaths, ...filteredKills];
    const points: Array<[number, number, number]> = [];

    for (const e of allEvents) {
      const cx = e.x * scaleX, cy = e.y * scaleY;
      if (isNaN(cx) || isNaN(cy) || cx < 0 || cx >= canvasWidth || cy < 0 || cy >= canvasHeight) continue;
      points.push([cx, cy, 1]);
    }

    if (points.length === 0) return;

    const heatCanvas = document.createElement('canvas');
    heatCanvas.width = canvasWidth;
    heatCanvas.height = canvasHeight;

    const heat = SimpleHeat(heatCanvas);
    heat
      .data(points)
      .max(Math.max(2, Math.ceil(points.length * 0.03)))
      .radius(30, 18)
      .gradient(HEATMAP_GRADIENT)
      .draw(0.05);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.85;
    ctx.drawImage(heatCanvas, 0, 0);
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

      {needsLayeredMaps ? (
        <>
          <img
            ref={(el) => { upperImgRef.current = el; }}
            src={`/${mapName}.png`}
            alt={`${mapName} upper`}
            className="hidden"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (!imageSize) setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
              setUpperImageLoaded(true);
            }}
            onError={() => setImageError(true)}
          />
          <img
            ref={(el) => { lowerImgRef.current = el; }}
            src={`/${mapImageName}.png`}
            alt={`${mapImageName} lower`}
            className="hidden"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (!imageSize) setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
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
