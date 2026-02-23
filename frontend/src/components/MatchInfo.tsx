interface MatchInfoProps {
  matchId: string;
  map: string;
  competition_name: string;
  finished_at: number;
  score: {
    faction1: number;
    faction2: number;
  } | null;
  isFaction1Win: boolean;
  team1Name?: string;
  team2Name?: string;
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

export function MatchInfo({ matchId, map, competition_name, finished_at, score, isFaction1Win, team1Name, team2Name }: MatchInfoProps) {
  const faction1Score = score?.faction1 || 0;
  const faction2Score = score?.faction2 || 0;
  const faceitMatchroomUrl = `https://www.faceit.com/en/cs2/room/${matchId}`;

  return (
    <div className="bg-gray-800/40 rounded-xl border border-gray-700/30 p-4 sm:p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Detail zápasu</h1>
          <div className="text-sm text-gray-400 space-y-1">
            <p>Mapa: <span className="text-white font-medium">{map}</span></p>
            <p>Režim: <span className="text-white font-medium">{competition_name}</span></p>
            <p>Datum: <span className="text-white font-medium">{formatDate(finished_at)}</span></p>
          </div>
          <a
            href={faceitMatchroomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full sm:w-auto justify-center items-center gap-2 mt-4 px-4 py-2 bg-[#FF5500] hover:bg-[#ff6a1a] rounded-lg font-semibold transition-colors text-sm text-black"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Otevřít Faceit Matchroom
          </a>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 justify-center lg:justify-end">
          <div className={`text-center px-3 sm:px-6 py-2 sm:py-3 rounded-lg flex-1 sm:flex-none min-w-[96px] sm:min-w-0 ${isFaction1Win ? 'bg-green-900/30 border border-green-700/50' : 'bg-gray-800/50 border border-gray-700/50'}`}>
            <p className="text-xs sm:text-sm text-gray-400 mb-1 truncate">{team1Name || 'Tým 1'}</p>
            <p className={`text-2xl sm:text-3xl font-bold ${isFaction1Win ? 'text-green-400' : 'text-gray-400'}`}>
              {faction1Score}
            </p>
          </div>
          <span className="text-gray-500 text-xl sm:text-2xl">vs</span>
          <div className={`text-center px-3 sm:px-6 py-2 sm:py-3 rounded-lg flex-1 sm:flex-none min-w-[96px] sm:min-w-0 ${!isFaction1Win ? 'bg-green-900/30 border border-green-700/50' : 'bg-gray-800/50 border border-gray-700/50'}`}>
            <p className="text-xs sm:text-sm text-gray-400 mb-1 truncate">{team2Name || 'Tým 2'}</p>
            <p className={`text-2xl sm:text-3xl font-bold ${!isFaction1Win ? 'text-green-400' : 'text-gray-400'}`}>
              {faction2Score}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

