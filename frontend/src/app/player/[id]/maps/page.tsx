'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PlayerDetail, MapStats } from '@/types';
import { getAvatarUrl } from '@/utils/avatar';
import { MapHeatmap, Footer } from '@/components';

export default function MapsPage() {
  const params = useParams();
  const playerId = params.id as string;

  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [selectedMap, setSelectedMap] = useState<MapStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!playerId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:4000/api/players/${playerId}`);
        
        if (!response.ok) {
          throw new Error('Hráč nenalezen');
        }

        const data: PlayerDetail = await response.json();
        setPlayer(data);
        
        // Vybrat první mapu jako výchozí
        if (data.maps && data.maps.length > 0) {
          setSelectedMap(data.maps[0]);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Nepodařilo se načíst data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [playerId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Načítám statistiky map...</p>
        </div>
      </main>
    );
  }

  if (error || !player) {
    return (
      <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error || 'Data nenalezena'}</p>
          <Link 
            href={`/player/${playerId}`}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
          >
            Zpět na profil
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Navigace */}
      <div className="bg-gray-800/50 border-b border-gray-700/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link 
            href={`/player/${playerId}`}
            className="text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zpět na profil
          </Link>
          <Link 
            href="/"
            className="text-xl font-bold text-orange-500 hover:text-orange-400 transition-colors"
          >
            CS2 Checker
          </Link>
          <div className="flex items-center gap-2">
            <img
              src={getAvatarUrl(player.avatar)}
              alt={player.nickname}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-sm text-gray-400">{player.nickname}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 flex-1">
        <h1 className="text-2xl font-bold text-white mb-6">Statistiky podle map</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seznam map */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-gray-400 mb-3">Vyberte mapu</h2>
            {player.maps?.map((map) => {
              const winRate = parseFloat(map.win_rate) || 0;
              const isSelected = selectedMap?.name === map.name;
              
              return (
                <button
                  key={map.name}
                  onClick={() => setSelectedMap(map)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                    isSelected 
                      ? 'bg-orange-500/20 border border-orange-500/50' 
                      : 'bg-gray-800/40 border border-gray-700/30 hover:border-gray-600'
                  }`}
                >
                  {map.image && (
                    <img src={map.image} alt={map.name} className="w-12 h-8 object-cover rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${isSelected ? 'text-orange-400' : 'text-white'}`}>
                      {map.name}
                    </p>
                    <p className="text-xs text-gray-500">{map.matches} zápasů</p>
                  </div>
                  <span className={`text-sm font-semibold ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                    {map.win_rate}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detail mapy */}
          <div className="lg:col-span-2">
            {selectedMap ? (
              <div className="space-y-6">
                {/* Header mapy */}
                <div className="relative rounded-xl overflow-hidden">
                  {selectedMap.image && (
                    <div className="relative h-48">
                      <img 
                        src={selectedMap.image} 
                        alt={selectedMap.name} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        <h2 className="text-3xl font-bold text-white">{selectedMap.name}</h2>
                      </div>
                    </div>
                  )}
                </div>

                {/* Statistiky */}
                <div className="bg-gray-800/40 rounded-xl border border-gray-700/30 overflow-hidden">
                  <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-700/30">
                    <div className="p-3 sm:p-4 text-center">
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Zápasy</p>
                      <p className="text-xl sm:text-2xl font-bold text-white">{selectedMap.matches}</p>
                    </div>
                    <div className="p-3 sm:p-4 text-center">
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Výhry</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-400">{selectedMap.wins}</p>
                    </div>
                    <div className="p-3 sm:p-4 text-center">
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Výhernost</p>
                      <p className={`text-xl sm:text-2xl font-bold ${parseFloat(selectedMap.win_rate) >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedMap.win_rate}%
                      </p>
                    </div>
                    <div className="p-3 sm:p-4 text-center">
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">K/D</p>
                      <p className={`text-xl sm:text-2xl font-bold ${parseFloat(selectedMap.kd_ratio) >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedMap.kd_ratio}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-gray-700/30 px-4 py-3 flex items-center justify-center gap-8 text-sm bg-gray-800/20">
                    <div className="text-center">
                      <span className="text-gray-500">Ø Zabití</span>
                      <p className="text-white font-semibold">{selectedMap.avg_kills}</p>
                    </div>
                  </div>
                </div>

                {/* Heatmapa */}
                <MapHeatmap 
                  playerId={playerId} 
                  mapName={selectedMap.name}
                  steamId={player?.steam_id_64}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                Vyberte mapu pro zobrazení detailů
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}

