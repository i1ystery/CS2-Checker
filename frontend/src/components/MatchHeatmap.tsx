'use client';

import { useState, useEffect } from 'react';
import { Heatmap } from './Heatmap';
import { DemoUpload } from './DemoUpload';
import { DemoUploadGuide } from './DemoUploadGuide';

interface MatchHeatmapProps {
  matchId: string;
  mapName: string;
  players?: Array<{ player_id: string; nickname: string }>;
  defaultPlayerId?: string;
}

interface PlayerHeatmapData {
  player_id: string;
  player_name: string;
  deaths: Array<{ x: number; y: number; team_num?: number; layer?: 'upper' | 'lower' }>;
  kills: Array<{ x: number; y: number; team_num?: number; layer?: 'upper' | 'lower' }>;
}

/**
 * Komponenta pro zobrazení heatmapy zápasu s možností výběru hráče a týmu
 */
export function MatchHeatmap({ matchId, mapName, players = [], defaultPlayerId }: MatchHeatmapProps) {
  const [allPlayersData, setAllPlayersData] = useState<PlayerHeatmapData[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(defaultPlayerId || '');
  const [teamMode, setTeamMode] = useState<'t' | 'ct'>('t');
  const [visualizationMode, setVisualizationMode] = useState<'dots' | 'heatmap'>('dots');
  const [layer, setLayer] = useState<'upper' | 'lower'>('upper');
  const [showReupload, setShowReupload] = useState(false);
  
  // Zjistit, zda mapa podporuje více pater
  const supportsLayers = mapName === 'de_vertigo' || mapName === 'de_nuke' || mapName === 'de_train';

  // Načíst data z databáze při načtení komponenty
  useEffect(() => {
    const loadDataFromDatabase = async () => {
      if (!matchId) return;
      
      try {
        const response = await fetch(`http://localhost:4000/api/database/match/${matchId}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.players_data && Array.isArray(data.players_data) && data.players_data.length > 0) {
            handleDataLoaded(data.players_data);
          }
        }
      } catch (error) {
        // Databáze není dostupná nebo data neexistují - to je v pořádku
        console.log('Data z databáze nejsou k dispozici, bude potřeba nahrát demo soubor');
      }
    };

    loadDataFromDatabase();
  }, [matchId]);

  // Nastavit prvního hráče jako výchozí po načtení dat
  useEffect(() => {
    if (Array.isArray(allPlayersData) && allPlayersData.length > 0) {
      // Pokud není vybrán žádný hráč, nebo vybraný hráč není v datech, nastavit prvního
      if (!selectedPlayerId || !allPlayersData.find(p => p.player_id === selectedPlayerId)) {
        // Použít defaultPlayerId pokud existuje a je v datech, jinak prvního hráče
        const playerToSelect = (defaultPlayerId && allPlayersData.find(p => p.player_id === defaultPlayerId))
          ? defaultPlayerId
          : allPlayersData[0].player_id;
        setSelectedPlayerId(playerToSelect);
      }
    }
  }, [allPlayersData, selectedPlayerId, defaultPlayerId]);

  /**
   * Zpracování načtených dat z demo souboru
   */
  const handleDataLoaded = (playersData: PlayerHeatmapData[] | unknown) => {
    // Zajistit, že data jsou pole
    const dataArray = Array.isArray(playersData) ? playersData : [];
    setAllPlayersData(dataArray);
    setShowReupload(false); // Skrýt reupload po úspěšném nahrání
    
    // Nastavit vybraného hráče pomocí funkčního updateru, aby měl přístup k aktuálnímu stavu
    if (dataArray.length > 0) {
      setSelectedPlayerId(prevSelected => {
        const currentSelected = prevSelected || defaultPlayerId || '';
        const playerExists = currentSelected && dataArray.find(p => p.player_id === currentSelected);
        
        if (!playerExists || !currentSelected) {
          // Použít defaultPlayerId pokud existuje a je v datech, jinak prvního hráče
          return (defaultPlayerId && dataArray.find(p => p.player_id === defaultPlayerId))
            ? defaultPlayerId
            : dataArray[0].player_id;
        }
        
        return prevSelected;
      });
    }
  };

  // Získat data pro vybraného hráče
  // Zajistit, že allPlayersData je pole před použitím .find()
  const selectedPlayerData = Array.isArray(allPlayersData) 
    ? allPlayersData.find(p => p.player_id === selectedPlayerId)
    : null;
  const selectedPlayerDeaths = selectedPlayerData?.deaths || [];
  const selectedPlayerKills = selectedPlayerData?.kills || [];
  
  // Kombinovat smrti a zabití a filtrovat podle vybraného týmu
  const allEvents = [
    ...selectedPlayerDeaths.map(d => ({ ...d, eventType: 'death' as const })),
    ...selectedPlayerKills.map(k => ({ ...k, eventType: 'kill' as const }))
  ];
  
  const filteredEvents = allEvents.filter(e => {
    // Filtrovat podle týmu
    const teamMatch = teamMode === 't' ? e.team_num === 2 : e.team_num === 3;
    if (!teamMatch) return false;
    
    // Filtrovat podle patra (pokud mapa podporuje vrstvy)
    if (supportsLayers && e.layer) {
      return e.layer === layer;
    }
    
    return true;
  });
  
  // Rozdělit zpět na smrti a zabití pro Heatmap komponentu
  const filteredDeaths = filteredEvents
    .filter(e => e.eventType === 'death')
    .map(({ eventType, ...rest }) => rest);
  const filteredKills = filteredEvents
    .filter(e => e.eventType === 'kill')
    .map(({ eventType, ...rest }) => rest);

  // Připravit seznam hráčů pro dropdown
  // Zajistit, že allPlayersData je pole
  const playersDataArray = Array.isArray(allPlayersData) ? allPlayersData : [];
  const availablePlayers = playersDataArray.length > 0 
    ? playersDataArray.map(p => {
        const nickname = p.player_name || 
          players.find(pl => pl.player_id === p.player_id)?.nickname || 
          `Hráč ${p.player_id.substring(0, 8)}`;
        
        return {
          player_id: p.player_id,
          nickname,
          deathsCount: p.deaths.length,
          killsCount: p.kills.length
        };
      })
    : players.map(p => ({
        player_id: p.player_id,
        nickname: p.nickname,
        deathsCount: 0,
        killsCount: 0
      }));

  availablePlayers.sort((a, b) => a.nickname.localeCompare(b.nickname));

  // Zkontrolovat, zda máme demo data
  const hasDemoData = Array.isArray(allPlayersData) && allPlayersData.length > 0;

  return (
    <div className="bg-gray-800/40 rounded-xl border border-gray-700/30 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-white">Mapová analýza hráčů</h3>
        {hasDemoData && (
          <button
            onClick={() => setShowReupload(!showReupload)}
            className="self-start sm:self-auto text-xs sm:text-sm text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-1"
          >
            {showReupload ? 'Skrýt' : 'Znovu nahrát demo'}
            <svg 
              className={`w-4 h-4 transition-transform ${showReupload ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
      
      {!hasDemoData ? (
        <div className="space-y-4">
          <DemoUploadGuide matchId={matchId} />
          <DemoUpload
            mapName={mapName}
            matchId={matchId}
            onDataLoaded={handleDataLoaded}
          />
        </div>
      ) : (
        <>
          {showReupload && (
            <div className="mb-4 space-y-4">
              <DemoUploadGuide matchId={matchId} />
              <DemoUpload
                mapName={mapName}
                matchId={matchId}
                onDataLoaded={handleDataLoaded}
              />
            </div>
          )}

          {Array.isArray(allPlayersData) && allPlayersData.length > 0 && (
            <div className="mb-4 space-y-4">
              {/* Pivot navigace pro přepínání mezi módy */}
              <div className="border-b border-gray-700">
                <nav className="flex w-full">
                  <button
                    onClick={() => setVisualizationMode('dots')}
                    className={`flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 text-center ${
                      visualizationMode === 'dots'
                        ? 'border-orange-500 text-orange-500'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    Tečková mapa
                  </button>
                  <button
                    onClick={() => setVisualizationMode('heatmap')}
                    className={`flex-1 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 text-center ${
                      visualizationMode === 'heatmap'
                        ? 'border-orange-500 text-orange-500'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    Heatmapa
                  </button>
                </nav>
              </div>

              {/* Kontroly pro vybraný mód */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-400">
                    Vybrat hráče
                  </label>
                  <select
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 text-sm bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {availablePlayers.map(player => (
                      <option key={player.player_id} value={player.player_id}>
                        {player.nickname} {playersDataArray.length > 0 && `(${player.deathsCount} smrtí, ${player.killsCount} zabití)`}
                      </option>
                    ))}
                  </select>
                </div>
                
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
          )}

          {filteredEvents.length > 0 ? (
            <Heatmap
              mapName={mapName}
              deaths={filteredDeaths.map(d => ({ ...d, z: 0 }))}
              kills={filteredKills.map(k => ({ ...k, z: 0 }))}
              teamMode={teamMode}
              visualizationMode={visualizationMode}
              layer={supportsLayers ? layer : undefined}
            />
          ) : Array.isArray(allPlayersData) && allPlayersData.length > 0 ? (
            <div className="aspect-video bg-gray-900/50 rounded-lg flex items-center justify-center border border-dashed border-gray-700">
              <div className="text-center text-gray-500">
                <p className="text-sm">Vybraný hráč nemá žádné události pro vybraný tým</p>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
