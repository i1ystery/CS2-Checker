'use client';

import { useState, useEffect } from 'react';
import { Heatmap } from './Heatmap';

interface MapHeatmapProps {
  playerId: string; // Faceit player_id (pro získání Steam ID)
  mapName: string;
  steamId?: string; // Steam ID (pokud je dostupné, použije se místo playerId pro dotaz do databáze)
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

/**
 * Komponenta pro zobrazení heatmapy hráče na konkrétní mapě
 * Načte data z databáze pro posledních 20 zápasů a spojí je dohromady
 * Používá Steam ID pro dotazy do databáze (player_id v databázi je Steam ID)
 */
export function MapHeatmap({ playerId, mapName, steamId }: MapHeatmapProps) {
  const [allDeaths, setAllDeaths] = useState<Array<{ x: number; y: number; team_num?: number; layer?: 'upper' | 'lower' }>>([]);
  const [allKills, setAllKills] = useState<Array<{ x: number; y: number; team_num?: number; layer?: 'upper' | 'lower' }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamMode, setTeamMode] = useState<'t' | 'ct'>('t');
  const [layer, setLayer] = useState<'upper' | 'lower'>('upper');
  const [matchesCount, setMatchesCount] = useState(0);

  // Normalizovat název mapy (odstranit "de_" prefix pokud není)
  const normalizeMapName = (map: string): string => {
    const normalized = map.toLowerCase().trim();
    // Pokud mapa nezačíná "de_", přidat prefix
    if (!normalized.startsWith('de_')) {
      return `de_${normalized}`;
    }
    return normalized;
  };

  const normalizedMapName = normalizeMapName(mapName);

  // Zjistit, zda mapa podporuje více pater
  const supportsLayers = normalizedMapName === 'de_vertigo' || normalizedMapName === 'de_nuke' || normalizedMapName === 'de_train';

  // Načíst data z databáze
  useEffect(() => {
    const loadDataFromDatabase = async () => {
      // Použít Steam ID pokud je dostupné, jinak zkusit získat z API
      let steamIdToUse = steamId;
      
      // Pokud nemáme Steam ID, zkusit ho získat z Faceit API
      if (!steamIdToUse && playerId) {
        try {
          const playerResponse = await fetch(`http://localhost:4000/api/players/${playerId}`);
          if (playerResponse.ok) {
            const playerData = await playerResponse.json();
            steamIdToUse = playerData.steam_id_64;
          }
        } catch (err) {
          console.warn('Nepodařilo se získat Steam ID z API:', err);
        }
      }

      if (!steamIdToUse || !normalizedMapName) {
        setError('Steam ID není dostupné. Nelze načíst data z databáze.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `http://localhost:4000/api/database/player/${steamIdToUse}/map/${normalizedMapName}`
        );

        if (!response.ok) {
          throw new Error('Nepodařilo se načíst data z databáze');
        }

        const matches: DemoDataFromDB[] = await response.json();

        if (!Array.isArray(matches) || matches.length === 0) {
          setError('Pro tuto mapu nejsou k dispozici žádná demo data');
          setLoading(false);
          return;
        }

        // Omezit na posledních 20 zápasů
        const recentMatches = matches.slice(0, 20);
        setMatchesCount(recentMatches.length);

        // Najít data pro konkrétního hráče v každém zápase a spojit je
        const combinedDeaths: Array<{ x: number; y: number; team_num?: number; layer?: 'upper' | 'lower' }> = [];
        const combinedKills: Array<{ x: number; y: number; team_num?: number; layer?: 'upper' | 'lower' }> = [];

        for (const match of recentMatches) {
          if (!match.players_data || !Array.isArray(match.players_data)) continue;

          // Najít data pro tohoto hráče (v databázi je player_id = Steam ID)
          const playerData = match.players_data.find(
            (p: PlayerHeatmapData) => p.player_id === steamIdToUse
          );

          if (playerData) {
            // Přidat smrti a zabití do kombinovaných polí
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
        console.error('Chyba při načítání dat:', err);
        setError(err instanceof Error ? err.message : 'Nepodařilo se načíst data');
      } finally {
        setLoading(false);
      }
    };

    loadDataFromDatabase();
  }, [playerId, normalizedMapName, steamId]);

  // Filtrovat události podle týmu a patra
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
        <h3 className="text-lg font-semibold text-white mb-4">Mapová analýza hráčů</h3>
        <div className="aspect-video bg-gray-900/50 rounded-lg flex items-center justify-center border border-dashed border-gray-700">
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
      <div className="bg-gray-800/40 rounded-xl border border-gray-700/30 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Mapová analýza hráčů</h3>
        <div className="aspect-video bg-gray-900/50 rounded-lg flex items-center justify-center border border-dashed border-gray-700">
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-1 text-gray-600">Pro zobrazení heatmapy je potřeba nahrát demo soubory pro zápasy na této mapě</p>
          </div>
        </div>
      </div>
    );
  }

  const totalEvents = filteredDeaths.length + filteredKills.length;

  return (
    <div className="bg-gray-800/40 rounded-xl border border-gray-700/30 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Mapová analýza hráčů</h3>
          <p className="text-sm text-gray-400 mt-1">
            Data z {matchesCount} {matchesCount === 1 ? 'zápasu' : 'zápasů'} • {totalEvents} událostí
          </p>
        </div>
      </div>

      {/* Kontroly */}
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

          {/* Přepínač pro patro (pouze pro mapy s více patry) */}
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
          visualizationMode="heatmap"
          layer={supportsLayers ? layer : undefined}
        />
      ) : (
        <div className="aspect-video bg-gray-900/50 rounded-lg flex items-center justify-center border border-dashed border-gray-700">
          <div className="text-center text-gray-500">
            <p className="text-sm">Pro vybraný tým a patro nejsou k dispozici žádné události</p>
          </div>
        </div>
      )}
    </div>
  );
}

