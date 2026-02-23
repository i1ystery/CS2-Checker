import Link from 'next/link';
import Image from 'next/image';
import { getAvatarUrl } from '@/utils/avatar';
import { getEloColor } from '@/utils/elo';
import { getLevelIcon } from '@/utils/level';

interface Player {
  player_id: string;
  nickname: string;
  avatar?: string;
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
}

interface TeamStatsProps {
  teamName: string;
  players: Player[];
  isWin: boolean;
}

export function TeamStats({ teamName, players, isWin }: TeamStatsProps) {
  // Vypočítat průměrné ELO týmu
  const elos = players.map(p => p.elo).filter((elo): elo is number => elo !== null);
  const avgElo = elos.length > 0 
    ? Math.round(elos.reduce((sum, elo) => sum + elo, 0) / elos.length)
    : null;

  return (
    <div className="bg-gray-800/40 rounded-xl border border-gray-700/30 overflow-hidden">
      <div className={`px-4 py-3 border-b border-gray-700/30 ${isWin ? 'bg-green-900/20' : 'bg-gray-800/20'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="font-semibold text-lg">
            {teamName}
            {isWin && <span className="ml-2 text-green-400 text-sm">(Výhra)</span>}
          </h2>
          {avgElo !== null && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs text-gray-400">Průměrné ELO:</span>
              <span className={`font-semibold ${getEloColor(avgElo)}`}>
                {avgElo}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden p-3 space-y-2">
        {players.map((player) => {
          const kd = parseFloat(player.stats.kd);
          return (
            <div key={player.player_id} className="bg-gray-900/50 border border-gray-700/40 rounded-lg p-3">
              <Link
                href={`/player/${player.player_id}`}
                className="flex items-center justify-between gap-2 text-white hover:text-blue-400 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={getAvatarUrl(player.avatar || '')}
                    alt={player.nickname}
                    className="w-7 h-7 rounded-full flex-shrink-0"
                  />
                  <span className="font-medium truncate">{player.nickname}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {player.level !== null && (
                    <Image
                      src={getLevelIcon(player.level)}
                      alt={`Úroveň ${player.level}`}
                      width={20}
                      height={20}
                    />
                  )}
                  {player.elo !== null && (
                    <span className={`font-semibold text-sm ${getEloColor(player.elo)}`}>
                      {player.elo}
                    </span>
                  )}
                </div>
              </Link>

              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div className="bg-gray-800/60 rounded p-2 text-center">
                  <p className="text-gray-400">K / D / A</p>
                  <p className="text-white font-semibold">
                    {player.stats.kills}/{player.stats.deaths}/{player.stats.assists}
                  </p>
                </div>
                <div className="bg-gray-800/60 rounded p-2 text-center">
                  <p className="text-gray-400">K/D</p>
                  <p className={`font-semibold ${kd >= 1 ? 'text-green-400' : 'text-red-400'}`}>{player.stats.kd}</p>
                </div>
                <div className="bg-gray-800/60 rounded p-2 text-center">
                  <p className="text-gray-400">ADR</p>
                  <p className="text-white font-semibold">{player.stats.adr}</p>
                </div>
                <div className="bg-gray-800/60 rounded p-2 text-center">
                  <p className="text-gray-400">HS%</p>
                  <p className="text-white font-semibold">{player.stats.hs_percent}%</p>
                </div>
                <div className="bg-gray-800/60 rounded p-2 text-center">
                  <p className="text-gray-400">MVP</p>
                  <p className="text-yellow-400 font-semibold">{player.stats.mvps || '—'}</p>
                </div>
                <div className="bg-gray-800/60 rounded p-2 text-center">
                  <p className="text-gray-400">KR</p>
                  <p className="text-white font-semibold">{player.stats.kr}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-gray-800/50">
            <tr className="text-xs text-gray-400 uppercase tracking-wider">
              <th className="px-2 sm:px-4 py-3 text-left sticky left-0 bg-gray-800/50 z-10">Hráč</th>
              <th className="px-1 sm:px-2 py-3 text-center">Úroveň</th>
              <th className="px-1 sm:px-2 py-3 text-center">ELO</th>
              <th className="px-1 sm:px-2 py-3 text-center">Zabití</th>
              <th className="px-1 sm:px-2 py-3 text-center">Smrti</th>
              <th className="px-1 sm:px-2 py-3 text-center">Asistence</th>
              <th className="px-1 sm:px-2 py-3 text-center">K/D</th>
              <th className="px-1 sm:px-2 py-3 text-center hidden sm:table-cell">K/R</th>
              <th className="px-1 sm:px-2 py-3 text-center">ADR</th>
              <th className="px-1 sm:px-2 py-3 text-center hidden md:table-cell">HS%</th>
              <th className="px-1 sm:px-2 py-3 text-center">MVP</th>
              <th className="px-1 sm:px-2 py-3 text-center hidden lg:table-cell">Multi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/30">
            {players.map((player) => {
              const kd = parseFloat(player.stats.kd);
              const totalMultikills = player.stats.triple_kills + player.stats.quadro_kills + player.stats.penta_kills;
              return (
                <tr key={player.player_id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-2 sm:px-4 py-3 sticky left-0 bg-gray-800/30 z-10">
                    <Link
                      href={`/player/${player.player_id}`}
                      className="flex items-center gap-1 sm:gap-2 text-white hover:text-blue-400 transition-colors font-medium"
                    >
                      <img
                        src={getAvatarUrl(player.avatar || '')}
                        alt={player.nickname}
                        className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex-shrink-0"
                      />
                      <span className="truncate max-w-[120px] sm:max-w-none">{player.nickname}</span>
                    </Link>
                  </td>
                  <td className="px-1 sm:px-2 py-3 text-center">
                    {player.level !== null ? (
                      <Image
                        src={getLevelIcon(player.level)}
                        alt={`Úroveň ${player.level}`}
                        width={20}
                        height={20}
                        className="mx-auto sm:w-6 sm:h-6"
                      />
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-1 sm:px-2 py-3 text-center">
                    {player.elo !== null ? (
                      <span className={`font-semibold text-xs sm:text-sm ${getEloColor(player.elo)}`}>
                        {player.elo}
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-1 sm:px-2 py-3 text-center text-white text-xs sm:text-sm">{player.stats.kills}</td>
                  <td className="px-1 sm:px-2 py-3 text-center text-white text-xs sm:text-sm">{player.stats.deaths}</td>
                  <td className="px-1 sm:px-2 py-3 text-center text-white text-xs sm:text-sm">{player.stats.assists}</td>
                  <td className={`px-1 sm:px-2 py-3 text-center font-semibold text-xs sm:text-sm ${kd >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                    {player.stats.kd}
                  </td>
                  <td className="px-1 sm:px-2 py-3 text-center text-white text-xs sm:text-sm hidden sm:table-cell">{player.stats.kr}</td>
                  <td className="px-1 sm:px-2 py-3 text-center text-white text-xs sm:text-sm">{player.stats.adr}</td>
                  <td className="px-1 sm:px-2 py-3 text-center text-white text-xs sm:text-sm hidden md:table-cell">{player.stats.hs_percent}%</td>
                  <td className="px-1 sm:px-2 py-3 text-center">
                    {player.stats.mvps > 0 ? (
                      <span className="text-yellow-400 font-semibold text-xs sm:text-sm">{player.stats.mvps}</span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-1 sm:px-2 py-3 text-center hidden lg:table-cell">
                    {totalMultikills > 0 ? (
                      <div className="flex flex-col gap-0.5 text-xs">
                        {player.stats.triple_kills > 0 && (
                          <span className="text-orange-400 font-semibold">{player.stats.triple_kills}× 3K</span>
                        )}
                        {player.stats.quadro_kills > 0 && (
                          <span className="text-orange-500 font-semibold">{player.stats.quadro_kills}× 4K</span>
                        )}
                        {player.stats.penta_kills > 0 && (
                          <span className="text-yellow-400 font-semibold">Ace</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

