'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Player, SearchResult } from '@/types';
import { SearchForm, PlayerList, Footer } from '@/components';

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const response = await fetch(`http://localhost:4000/api/players/search?query=${encodeURIComponent(query.trim())}`);
      
      if (!response.ok) {
        throw new Error('Chyba při vyhledávání');
      }

      const data: SearchResult = await response.json();
      setPlayers(data.items || []);
    } catch (err) {
      console.error('Error:', err);
      setError('Nepodařilo se vyhledat hráče');
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerClick = (player: Player) => {
    router.push(`/player/${player.player_id}`);
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Hero sekce */}
      <div className={`flex flex-col items-center px-4 pt-16 pb-8 flex-1 ${!searched ? 'justify-center min-h-[60vh]' : ''}`}>
        <h1 className="text-5xl font-bold mb-4 text-orange-500">CS2 Checker</h1>
        <p className="text-gray-400 mb-8 text-center">
          Vyhledej hráče a zobraz jeho statistiky z Faceit
        </p>

        <SearchForm
          query={query}
          setQuery={setQuery}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>

      {/* Výsledky */}
      <div className="max-w-4xl mx-auto px-4 pb-16 mt-4 flex-1">
        {error && (
          <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-300 mb-4">
            {error}
          </div>
        )}

        {searched && !loading && players.length === 0 && !error && (
          <div className="text-center text-gray-500">
            Žádní hráči nenalezeni
        </div>
        )}

        <PlayerList 
          players={players} 
          onPlayerClick={handlePlayerClick}
        />
        </div>
      <Footer />
      </main>
  );
}
