'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PlayerDetail, Match, MatchesResult } from '@/types';
import { 
  PlayerHeader, 
  OverallStatsComponent, 
  RecentPerformanceComponent, 
  MatchList,
  EloChart,
  Footer
} from '@/components';

export default function PlayerPage() {
  const params = useParams();
  const playerId = params.id as string;

  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!playerId) return;

      setLoading(true);
      setError(null);

      try {
        const [playerRes, matchesRes] = await Promise.all([
          fetch(`http://localhost:4000/api/players/${playerId}`),
          fetch(`http://localhost:4000/api/players/${playerId}/matches?limit=20`)
        ]);

        if (!playerRes.ok) {
          throw new Error('Hráč nenalezen');
        }

        const playerData: PlayerDetail = await playerRes.json();
        setPlayer(playerData);

        if (matchesRes.ok) {
          const matchesData: MatchesResult = await matchesRes.json();
          setMatches(matchesData.items || []);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Nepodařilo se načíst data hráče');
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
          <p className="text-gray-400">Načítám profil hráče...</p>
        </div>
      </main>
    );
  }

  if (error || !player) {
    return (
      <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error || 'Hráč nenalezen'}</p>
          <Link 
            href="/"
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
          >
            Zpět na vyhledávání
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
            href="/"
            className="text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zpět na vyhledávání
          </Link>
          <Link 
            href="/"
            className="text-xl font-bold text-orange-500 hover:text-orange-400 transition-colors"
          >
            CS2 Checker
          </Link>
          <div className="w-24"></div> {/* Spacer pro vyrovnání */}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 flex-1">
        {/* Header s profilem */}
        <PlayerHeader player={player} />

        {/* Celkové statistiky */}
        {player.stats && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-white">Celkové statistiky</h2>
              <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
                {parseInt(player.stats.matches).toLocaleString()} zápasů
              </span>
            </div>
            <OverallStatsComponent stats={player.stats} />
          </section>
        )}

        {/* Nedávný výkon */}
        {player.recentPerformance && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-semibold text-white">Nedávný výkon</h2>
              <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded-full border border-orange-500/20">
                Posledních {player.recentPerformance.matches} zápasů
              </span>
            </div>
            <RecentPerformanceComponent stats={player.recentPerformance} />
            
            {/* ELO Graf pod Nedávným výkonem */}
            {player.eloHistory && player.eloHistory.length > 0 && player.elo && (
              <div className="mt-4">
                <EloChart eloHistory={player.eloHistory} currentElo={player.elo} />
              </div>
            )}
          </section>
        )}

        {/* Link na statistiky map */}
        {player.maps && player.maps.length > 0 && (
          <section>
            <Link 
              href={`/player/${playerId}/maps`}
              className="flex items-center justify-between p-4 bg-gray-800/40 rounded-xl border border-gray-700/30 hover:border-orange-500/50 hover:bg-gray-800/60 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Statistiky podle map</h3>
                  <p className="text-sm text-gray-500">{player.maps.length} map • Heatmapy a detailní analýza</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-500 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </section>
        )}

        {/* Historie zápasů */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">
            Poslední zápasy
          </h2>
          <MatchList matches={matches} playerId={playerId} />
        </section>
      </div>
      <Footer />
    </main>
  );
}
