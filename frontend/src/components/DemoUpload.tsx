'use client';

import { useState } from 'react';

interface PlayerHeatmapData {
  player_id: string;
  player_name: string;
  deaths: Array<{ x: number; y: number; team_num?: number }>;
  kills: Array<{ x: number; y: number; team_num?: number }>;
}

interface DemoUploadProps {
  mapName: string;
  matchId?: string;
  onDataLoaded: (playersData: PlayerHeatmapData[]) => void;
}

export function DemoUpload({ mapName, matchId, onDataLoaded }: DemoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.dem')) {
      setError('Pouze .dem soubory jsou povoleny');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('demo', file);
      formData.append('mapName', mapName);
      
      if (matchId) {
        formData.append('matchId', matchId);
      }

      const response = await fetch('http://localhost:4000/api/demos/parse', {
        method: 'POST',
        body: formData
      });

      // Zkontrolovat content-type před parsováním JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        await response.text();
        throw new Error('Backend vrátil neplatnou odpověď. Zkontrolujte, zda backend server běží a soubor není příliš velký.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Neznámá chyba' }));
        throw new Error(errorData.error || 'Chyba při parsování demo souboru');
      }

      const data = await response.json();
      
      // Backend vrací objekt s { players: [...], map: "..." }
      // Extrahovat pole hráčů
      const playersData = Array.isArray(data.players) 
        ? data.players 
        : Array.isArray(data) 
          ? data 
          : [];
      onDataLoaded(playersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepodařilo se načíst demo soubor');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="block mb-2 text-sm font-medium text-gray-400">
        Nahrát demo soubor pro heatmapu
      </label>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg cursor-pointer transition-colors text-sm font-semibold text-black">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {uploading ? 'Načítám...' : 'Vybrat soubor'}
          <input
            type="file"
            accept=".dem"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {error && (
          <span className="text-sm text-red-400">{error}</span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Nahrajte .dem soubor z Faceit zápasu pro zobrazení heatmapy smrtí a zabití
      </p>
    </div>
  );
}
