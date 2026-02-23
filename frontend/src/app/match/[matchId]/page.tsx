import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAvatarUrl } from '@/utils/avatar';
import { MatchInfo, TeamStats, Footer } from '@/components';
import { MatchHeatmap } from '@/components/MatchHeatmap';

interface MatchDetail {
  match_id: string;
  game: string;
  region: string;
  competition_name: string;
  started_at: number;
  finished_at: number;
  map: string;
  score: {
    faction1: number;
    faction2: number;
  } | null;
  winner: string;
  teams: {
    faction1: {
      team_id: string;
      name: string;
      players: Array<{
        player_id: string;
        nickname: string;
        level: number | null;
        elo: number | null;
        stats: {
          kills: number;
          deaths: number;
          assists: number;
          kd: string;
          kr: string;
          adr: string;
          hs_percent: string;
          triple_kills: number;
          quadro_kills: number;
          penta_kills: number;
          mvps: number;
        };
      }>;
    };
    faction2: {
      team_id: string;
      name: string;
      players: Array<{
        player_id: string;
        nickname: string;
        level: number | null;
        elo: number | null;
        stats: {
          kills: number;
          deaths: number;
          assists: number;
          kd: string;
          kr: string;
          adr: string;
          hs_percent: string;
          triple_kills: number;
          quadro_kills: number;
          penta_kills: number;
          mvps: number;
        };
      }>;
    };
  };
}

async function getMatchDetail(matchId: string): Promise<MatchDetail | null> {
  try {
    const response = await fetch(
      `http://localhost:4000/api/matches/${matchId}`,
      { cache: 'no-store' }
    );
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching match detail:', error);
    return null;
  }
}

async function getPlayerAvatar(playerId: string): Promise<string> {
  try {
    const response = await fetch(
      `http://localhost:4000/api/players/${playerId}`,
      { cache: 'no-store' }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.avatar || '';
    }
    return '';
  } catch {
    return '';
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default async function MatchDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ playerId?: string }>;
}) {
  const { matchId } = await params;
  const { playerId } = await searchParams;
  const match = await getMatchDetail(matchId);

  if (!match) {
    notFound();
  }

  const isFaction1Win = match.winner === 'faction1';
  const faction1Score = match.score?.faction1 || 0;
  const faction2Score = match.score?.faction2 || 0;

  // Najít hráče pro navbar (pokud je playerId v URL, použijeme ho, jinak prvního hráče z týmu 1)
  const navbarPlayer = playerId 
    ? [...match.teams.faction1.players, ...match.teams.faction2.players].find(p => p.player_id === playerId)
    : match.teams.faction1.players[0];
  
  const navbarPlayerId = navbarPlayer?.player_id || match.teams.faction1.players[0]?.player_id;
  const navbarPlayerNickname = navbarPlayer?.nickname || match.teams.faction1.players[0]?.nickname || 'Hráč';
  
  // Získat avatar hráče
  const navbarPlayerAvatar = navbarPlayerId ? await getPlayerAvatar(navbarPlayerId) : '';

  // Normalizovat název mapy pro obrázek
  const mapImageName = match.map.toLowerCase();

  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Navigace */}
      <div className="bg-gray-800/50 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <Link 
            href={navbarPlayerId ? `/player/${navbarPlayerId}` : '/'}
            className="text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Zpět na profil</span>
            <span className="sm:hidden">Zpět</span>
          </Link>
          <Link 
            href="/"
            className="text-lg sm:text-xl font-bold text-orange-500 hover:text-orange-400 transition-colors flex-shrink-0"
          >
            CS2 Checker
          </Link>
          {navbarPlayerId && (
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <img
                src={getAvatarUrl(navbarPlayerAvatar)}
                alt={navbarPlayerNickname}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
              />
              <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline truncate max-w-[100px]">{navbarPlayerNickname}</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:p-8 space-y-4 sm:space-y-6 flex-1">
        <MatchInfo
          matchId={match.match_id}
          map={match.map}
          competition_name={match.competition_name}
          finished_at={match.finished_at}
          score={match.score}
          isFaction1Win={isFaction1Win}
          team1Name={match.teams.faction1.name}
          team2Name={match.teams.faction2.name}
        />

        <div className="space-y-6">
          <TeamStats
            teamName={match.teams.faction1.name || 'Tým 1'}
            players={match.teams.faction1.players}
            isWin={isFaction1Win}
          />
          <TeamStats
            teamName={match.teams.faction2.name || 'Tým 2'}
            players={match.teams.faction2.players}
            isWin={!isFaction1Win}
          />
        </div>

        <MatchHeatmap
          matchId={match.match_id}
          mapName={mapImageName}
          players={[...match.teams.faction1.players, ...match.teams.faction2.players].map(p => ({
            player_id: p.player_id,
            nickname: p.nickname
          }))}
          defaultPlayerId={navbarPlayerId || undefined}
        />
      </div>
      <Footer />
    </main>
  );
}

