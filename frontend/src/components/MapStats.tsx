'use client';

import { MapStats as MapStatsType } from '@/types';

interface MapStatsProps {
  maps: MapStatsType[];
}

export function MapStatsComponent({ maps }: MapStatsProps) {
  if (!maps || maps.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Žádné statistiky map k zobrazení
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {maps.map((map) => {
        const winRate = parseFloat(map.win_rate) || 0;
        
        return (
          <div 
            key={map.name}
            className="bg-gray-800/80 rounded-xl border border-gray-700/50 overflow-hidden"
          >
            {/* Map Image Header */}
            <div className="relative h-24 bg-gray-700">
              {map.image && (
                <img 
                  src={map.image} 
                  alt={map.name}
                  className="w-full h-full object-cover opacity-60"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-800 to-transparent" />
              <div className="absolute bottom-2 left-3">
                <h3 className="text-lg font-bold text-white">{map.name}</h3>
              </div>
              <div className="absolute bottom-2 right-3">
                <span className={`text-lg font-bold ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                  {map.win_rate}%
                </span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Zápasy</span>
                <span className="text-white font-medium">{map.matches}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Výhry</span>
                <span className="text-white font-medium">{map.wins}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">K/D Ratio</span>
                <span className="text-white font-medium">{map.kd_ratio}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Avg. Kills</span>
                <span className="text-white font-medium">{map.avg_kills}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

