'use client';

import { useState, useEffect } from 'react';
import { Heatmap } from './Heatmap';

interface MapHeatmapProps {
  playerId: string;
  mapName: string;
  steamId?: string;
}

interface PlayerHeatmapData {
  player_id: string;
  player_name: string;
  deaths: Array<{ x: number; y: number; team_num?: number; layer?: 'upper' | 'lower' }>;
  kills: Array<{ x: number; y: number; team_num?: number; layer?: 'upper' | 'lower' }>;
}

interface DemoDataFromDB {
  match_id: string;
  map_name: string;
  players_data: PlayerHeatmapData[];
  created_at: string;
  updated_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function MapHeatmap({ playerId, mapName, steamId }: MapHeatmapProps) {
  const [allDeaths, setAllDeaths] = useState<Array<{ x: number; y: number; team_num?: number; layer?: 'upper' | 'lower' }>>([]);
  const [allKills, setAllKills] = useState<Array<{ x: number; y: number; team_num?: number; layer?: 'upper' | 'lower' }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamMode, setTeamMode] = useState<'t' | 'ct'>('t');
  const [visualizationMode, setVisualizationMode] = useState<'dots' | 'heatmap'>('heatmap');
  const [layer, setLayer] = useState<'upper' | 'lower'>('upper');
  const [matchesCount, setMatchesCount] = useState(0);

  const normalizeMapName = (map: string): string => {
    const normalized = map.toLowerCase().trim();
    if (!normalized.startsWith('de_')) {
      return `de_${normalized}`;
    }
    return normalized;
  };

  const normalizedMapName = normalizeMapName(mapName);

  const supportsLayers = normalizedMapName === 'de_vertigo' || normalizedMapName === 'de_nuke' || normalizedMapName === 'de_train';

  useEffect(() => {
    const loadDataFromDatabase = async () => {
      let steamIdToUse = steamId;
      
      if (!steamIdToUse && playerId) {
        try {
          const playerResponse = await fetch(`${API_URL}/api/players/${playerId}`);
          if (playerResponse.ok) {
            const playerData = await playerResponse.json();
            steamIdToUse = playerData.steam_id_64;
          }
        } catch (err) {
          console.warn('Failed to get Steam ID from API:', err);
        }
      }

      if (!steamIdToUse || !normalizedMapName) {
        setError('no_steam_id');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_URL}/api/database/player/${steamIdToUse}/map/${normalizedMapName}`
        );

        if (!response.ok) {
          throw new Error('Failed to load data from database');
        }

        const matches: DemoDataFromDB[] = await response.json();

        if (!Array.isArray(matches) || matches.length === 0) {
          setError('no_data');
          setLoading(false);
          return;
        }

        const recentMatches = matches.slice(0, 20);
        setMatchesCount(recentMatches.length);

        const combinedDeaths: Array<{ x: number; y: number; team_num?: number; layer?: 'upper' | 'lower' }> = [];
        const combinedKills: Array<{ x: number; y: number; team_num?: number; layer?: 'upper' | 'lower' }> = [];

        for (const match of recentMatches) {
          if (!match.players_data || !Array.isArray(match.players_data)) continue;

          const playerData = match.players_data.find(
            (p: PlayerHeatmapData) => p.player_id === steamIdToUse
          );

          if (playerData) {
            if (playerData.deaths && Array.isArray(playerData.deaths)) {
              combinedDeaths.push(...playerData.deaths);
            }
            if (playerData.kills && Array.isArray(playerData.kills)) {
              combinedKills.push(...playerData.kills);
            }
          }
        }

        setAllDeaths(combinedDeaths);
        setAllKills(combinedKills);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('fetch_error');
      } finally {
        setLoading(false);
      }
    };

    loadDataFromDatabase();
  }, [playerId, normalizedMapName, steamId]);

  const filteredDeaths = allDeaths.filter(e => {
    const teamMatch = teamMode === 't' ? e.team_num === 2 : e.team_num === 3;
    if (!teamMatch) return false;
    
    if (supportsLayers && e.layer) {
      return e.layer === layer;
    }
    
    return true;
  });

  const filteredKills = allKills.filter(e => {
    const teamMatch = teamMode === 't' ? e.team_num === 2 : e.team_num === 3;
    if (!teamMatch) return false;
    
    if (supportsLayers && e.layer) {
      return e.layer === layer;
    }
    
    return true;
  });

  if (loading) {
    return (
      <div className="bg-gray-800/40 rounded-xl border border-gray-700/30 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Heatmapa z více zápasů</h3>
        <div className="bg-gray-900/50 rounded-lg flex items-center justify-center border border-dashed border-gray-700 py-16">
          <div className="text-center text-gray-500">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Načítám data z databáze...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/40 rounded-xl border border-gray-700/30 p-6 min-w-0">
        <h3 className="text-lg font-semibold text-white mb-4">Heatmapa z více zápasů</h3>
        <div className="bg-gray-900/50 rounded-lg border border-dashed border-gray-700 p-8 min-w-0 overflow-hidden">
          <div className="text-center w-full min-w-0 max-w-sm mx-auto">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            {error === 'no_data' ? (
              <>
                <p className="text-gray-300 font-medium">Žádná demo data pro tuto mapu</p>
                <p className="text-sm text-gray-500 break-words">
                  Pro zobrazení heatmapy nahrajte demo soubory ze zápasů na této mapě.
                </p>
                <div className="bg-gray-800/60 rounded-lg p-3 text-left text-sm space-y-2">
                  <p className="text-orange-400 font-medium">Jak na to:</p>
                  <ol className="text-gray-400 space-y-1 list-decimal list-inside">
                    <li>Otevřete detail zápasu ze seznamu</li>
                    <li>Nahrajte .dem soubor na stránce zápasu</li>
                    <li>Data se automaticky uloží a zobrazí zde</li>
                  </ol>
                </div>
              </>
            ) : error === 'no_steam_id' ? (
              <>
                <p className="text-gray-300 font-medium mb-2">Steam ID není dostupné</p>
                <p className="text-sm text-gray-500">Nelze načíst data bez Steam ID hráče.</p>
              </>
            ) : (
              <>
                <p className="text-gray-300 font-medium mb-2">Nepodařilo se načíst data</p>
                <p className="text-sm text-gray-500">Zkuste stránku obnovit nebo zkontrolujte backend.</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const totalDeaths = filteredDeaths.length;
  const totalKills = filteredKills.length;
  const totalEvents = totalDeaths + totalKills;

  return (
    <div className="bg-gray-800/40 rounded-xl border border-gray-700/30 p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Heatmapa z více zápasů</h3>
          <p className="text-sm text-gray-400 mt-1">
            Data z {matchesCount} {matchesCount === 1 ? 'zápasu' : matchesCount < 5 ? 'zápasů' : 'zápasů'} • {totalKills} zabití, {totalDeaths} smrtí
          </p>
        </div>
      </div>

      {/* Visualization mode toggle */}
      <div className="mb-4">
        <div className="border-b border-gray-700">
          <nav className="flex w-full">
            <button
              onClick={() => setVisualizationMode('dots')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors border-b-2 text-center ${
                visualizationMode === 'dots'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              Tečková mapa
            </button>
            <button
              onClick={() => setVisualizationMode('heatmap')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors border-b-2 text-center ${
                visualizationMode === 'heatmap'
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              Heatmapa
            </button>
          </nav>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-400">
              Tým
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setTeamMode('t')}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  teamMode === 't'
                    ? 'bg-yellow-500 text-black font-semibold'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                T
              </button>
              <button
                onClick={() => setTeamMode('ct')}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  teamMode === 'ct'
                    ? 'bg-blue-500 text-black font-semibold'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                CT
              </button>
            </div>
          </div>

          {supportsLayers && (
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-400">
                Patro
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLayer('upper')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    layer === 'upper'
                      ? 'bg-orange-500 text-black font-semibold'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Horní
                </button>
                <button
                  onClick={() => setLayer('lower')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    layer === 'lower'
                      ? 'bg-orange-500 text-black font-semibold'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Dolní
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {totalEvents > 0 ? (
        <Heatmap
          mapName={normalizedMapName}
          deaths={filteredDeaths.map(d => ({ ...d, z: 0 }))}
          kills={filteredKills.map(k => ({ ...k, z: 0 }))}
          teamMode={teamMode}
          visualizationMode={visualizationMode}
          layer={supportsLayers ? layer : undefined}
        />
      ) : (
        <div className="bg-gray-900/50 rounded-lg flex items-center justify-center border border-dashed border-gray-700 py-16">
          <div className="text-center text-gray-500">
            <p className="text-sm">Pro vybraný tým a patro nejsou k dispozici žádné události</p>
          </div>
        </div>
      )}
    </div>
  );
}
