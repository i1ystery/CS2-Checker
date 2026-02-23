'use client';

import Link from 'next/link';
import { Match } from '@/types';

interface MatchListProps {
  matches: Match[];
  playerId?: string;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function MatchList({ matches, playerId }: MatchListProps) {
  if (matches.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Žádné zápasy k zobrazení
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header - hidden on mobile */}
      <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-3 text-xs text-gray-400 uppercase tracking-wider border-b border-gray-700/50 bg-gray-800/20">
        <div className="col-span-3">Mapa</div>
        <div className="col-span-1 text-center">Skóre</div>
        <div className="col-span-2 text-center">K / D / A</div>
        <div className="col-span-1 text-center">K/D</div>
        <div className="col-span-1 text-center">K/R</div>
        <div className="col-span-1 text-center">ADR</div>
        <div className="col-span-1 text-center">HS%</div>
        <div className="col-span-1 text-center">Demo</div>
        <div className="col-span-1 text-center">ELO</div>
      </div>

      {matches.map((match) => {
        const stats = match.player_stats;
        const kd = stats ? parseFloat(stats.kd) : 0;
        const isWin = match.result === 'win';
        
        const matchUrl = playerId 
          ? `/match/${match.match_id}?playerId=${playerId}`
          : `/match/${match.match_id}`;
        
        return (
          <Link
            key={match.match_id}
            href={matchUrl}
            className={`block rounded-lg transition-colors border ${
              isWin 
                ? 'bg-green-900/20 hover:bg-green-900/30 border-green-800/30' 
                : 'bg-red-900/20 hover:bg-red-900/30 border-red-800/30'
            } cursor-pointer`}
          >
            {/* Mobile layout */}
            <div className="sm:hidden p-3">
              {/* Top row: Map, Score, ELO */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-base truncate">{match.map}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(match.date)}</p>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-0.5">Skóre</p>
                    <span className={`text-lg font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                      {match.score}
                    </span>
                  </div>
                  {match.elo_change !== null && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-0.5">ELO</p>
                      <span className={`text-lg font-bold ${match.elo_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {match.elo_change >= 0 ? '+' : ''}{match.elo_change}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats row */}
              {stats && (
                <div className="grid grid-cols-5 gap-2 pt-2 border-t border-gray-700/30">
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">K / D / A</p>
                    <p className="text-xs font-semibold text-white leading-tight">
                      {stats.kills} / {stats.deaths} / {stats.assists}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">K/D</p>
                    <p className={`text-xs font-semibold ${kd >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.kd}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">ADR</p>
                    <p className="text-xs font-semibold text-white">{stats.adr}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">HS%</p>
                    <p className="text-xs font-semibold text-white">{stats.hs_percent}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-1">Demo</p>
                    {match.has_demo ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/20 text-green-400" title="Demo je zpracováno">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-700/50 text-gray-500" title="Demo není zpracováno">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Desktop layout */}
            <div className="hidden sm:grid grid-cols-12 gap-2 items-center px-4 py-3">
              {/* Map + Date */}
              <div className="col-span-3">
                <p className="font-semibold text-white text-sm">{match.map}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(match.date)}</p>
              </div>

              {/* Score */}
              <div className="col-span-1 text-center">
                <span className={`text-base font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                  {match.score}
                </span>
              </div>

              {/* KDA */}
              <div className="col-span-2 text-center">
                {stats ? (
                  <span className="font-medium text-white">
                    {stats.kills} / {stats.deaths} / {stats.assists}
                  </span>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </div>

              {/* K/D */}
              <div className="col-span-1 text-center">
                {stats ? (
                  <span className={`font-semibold ${kd >= 1 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.kd}
                  </span>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </div>

              {/* K/R */}
              <div className="col-span-1 text-center">
                {stats ? (
                  <span className="text-white font-medium">{stats.kr}</span>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </div>

              {/* ADR */}
              <div className="col-span-1 text-center">
                {stats ? (
                  <span className="text-white font-medium">{stats.adr}</span>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </div>

              {/* HS% */}
              <div className="col-span-1 text-center">
                {stats ? (
                  <span className="text-white font-medium">{stats.hs_percent}%</span>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </div>

              {/* Demo indicator */}
              <div className="col-span-1 text-center">
                {match.has_demo ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400" title="Demo je zpracováno">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-700/50 text-gray-500" title="Demo není zpracováno">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </span>
                )}
              </div>

              {/* ELO Change */}
              <div className="col-span-1 text-center">
                {match.elo_change !== null ? (
                  <span className={`text-base font-bold px-2 py-1 rounded ${match.elo_change >= 0 ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'}`}>
                    {match.elo_change >= 0 ? '+' : ''}{match.elo_change}
                  </span>
                ) : (
                  <span className="text-gray-500">—</span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
