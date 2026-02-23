'use client';

import { useState, useRef, useEffect } from 'react';
import { EloPoint } from '@/types';

interface EloChartProps {
  eloHistory: EloPoint[];
  currentElo: number;
}

export function EloChart({ eloHistory, currentElo }: EloChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  if (!eloHistory || eloHistory.length < 2) {
    return null;
  }

  const elos = eloHistory.map(p => typeof p.elo === 'string' ? parseInt(p.elo) : p.elo);
  const highestElo = Math.max(...elos);
  const lowestElo = Math.min(...elos);
  const minElo = lowestElo - 25;
  const maxElo = highestElo + 25;
  const eloRange = maxElo - minElo;
  
  // Sečteme všechny změny pro přesnou celkovou změnu
  const eloChange = eloHistory.reduce((sum, point) => {
    const change = typeof point.change === 'string' ? parseInt(point.change) : point.change;
    return sum + change;
  }, 0);
  const isPositive = eloChange >= 0;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' });
  };

  const padding = 4;
  const chartWidth = dimensions.width || 800;
  const chartHeight = dimensions.height || 120;

  const getX = (index: number) => padding + (index / (eloHistory.length - 1)) * (chartWidth - padding * 2);
  const getY = (elo: number) => padding + (1 - (elo - minElo) / eloRange) * (chartHeight - padding * 2);
  const getElo = (point: EloPoint) => typeof point.elo === 'string' ? parseInt(point.elo) : point.elo;
  const getChange = (point: EloPoint) => typeof point.change === 'string' ? parseInt(point.change) : point.change;

  const pathData = eloHistory.map((point, i) => {
    const x = getX(i);
    const y = getY(getElo(point));
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  return (
    <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-400 text-sm font-medium">ELO Historie</span>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Výhra
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Prohra
          </span>
        </div>
      </div>
      
      {/* Chart */}
      <div className="relative h-28" ref={containerRef}>
        {dimensions.width > 0 && (
          <svg 
            width={chartWidth} 
            height={chartHeight} 
            className="absolute inset-0"
          >
            {/* Grid lines */}
            <line x1={0} y1={chartHeight/2} x2={chartWidth} y2={chartHeight/2} stroke="#374151" strokeWidth="1" strokeDasharray="4" opacity="0.3" />
            
            {/* Area fill */}
            <path
              d={`${pathData} L ${getX(eloHistory.length - 1)} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`}
              fill={isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}
            />
            
            {/* Line */}
            <path
              d={pathData}
              fill="none"
              stroke={isPositive ? '#22c55e' : '#ef4444'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Points */}
            {eloHistory.map((point, i) => {
              const x = getX(i);
              const y = getY(getElo(point));
              const isHovered = hoveredIndex === i;
              const change = getChange(point);
              
              return (
                <g key={i}>
                  {/* Point */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 6 : 4}
                    fill={change >= 0 ? '#22c55e' : '#ef4444'}
                    stroke={isHovered ? 'white' : 'transparent'}
                    strokeWidth="2"
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Hover area - larger invisible circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={20}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </g>
              );
            })}
          </svg>
        )}
        
        {/* Tooltip */}
        {hoveredIndex !== null && dimensions.width > 0 && (() => {
          const point = eloHistory[hoveredIndex];
          const elo = getElo(point);
          const change = getChange(point);
          return (
            <div 
              className="absolute pointer-events-none z-50"
              style={{ 
                left: getX(hoveredIndex) + 12,
                top: getY(elo),
                transform: 'translateY(-50%)'
              }}
            >
              <div className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 shadow-2xl">
                <p className="text-white font-bold">{elo}</p>
                <p className="text-gray-400 text-xs">{formatDate(point.date)}</p>
                <p className={`text-xs font-medium ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {change >= 0 ? '+' : ''}{change}
                </p>
              </div>
            </div>
          );
        })()}
      </div>
      
      {/* Stats footer */}
      <div className="flex items-center justify-center gap-4 sm:gap-8 mt-3 pt-3 border-t border-gray-700/30 text-xs sm:text-sm">
        <div className="text-center">
          <span className="text-gray-500">Nejvyšší</span>
          <p className="text-green-400 font-semibold">{highestElo}</p>
        </div>
        <div className="text-center">
          <span className="text-gray-500">Nejnižší</span>
          <p className="text-red-400 font-semibold">{lowestElo}</p>
        </div>
        <div className="text-center">
          <span className="text-gray-500">Změna</span>
          <p className={`font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{eloChange}
          </p>
        </div>
      </div>
    </div>
  );
}
