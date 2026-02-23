'use client';

import { OverallStats, RecentPerformance } from '@/types';

// === OVERALL STATS COMPONENT ===
interface OverallStatsProps {
  stats: OverallStats;
}

export function OverallStatsComponent({ stats }: OverallStatsProps) {
  const winRate = parseFloat(stats.win_rate) || 0;
  const matches = parseInt(stats.matches) || 0;
  const wins = parseInt(stats.wins) || 0;
  const losses = matches - wins;
  const kd = parseFloat(stats.kd_ratio) || 0;
  
  return (
    <div className="bg-gray-800/40 rounded-xl border border-gray-700/30 overflow-hidden">
      {/* Main stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-700/30">
        <div className="p-3 sm:p-4 text-center">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">K/D Ratio</p>
          <p className={`text-xl sm:text-2xl font-bold ${kd >= 1 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.kd_ratio}
          </p>
        </div>
        <div className="p-3 sm:p-4 text-center">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Headshot %</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{stats.headshots}%</p>
        </div>
        <div className="p-3 sm:p-4 text-center">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Výhernost</p>
          <p className={`text-xl sm:text-2xl font-bold ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
            {winRate}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            <span className="text-green-400">{wins}V</span> / <span className="text-red-400">{losses}P</span>
          </p>
        </div>
        <div className="p-3 sm:p-4 text-center">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Zápasy</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{matches.toLocaleString()}</p>
        </div>
      </div>
      
      {/* ELO stats */}
      {(stats.highest_elo || stats.lowest_elo || stats.avg_elo) && (
        <div className="border-t border-gray-700/30 px-4 py-3 flex items-center justify-center gap-8 text-sm bg-gray-800/20">
          {stats.highest_elo && (
            <div className="text-center">
              <span className="text-gray-500">Nejvyšší ELO</span>
              <p className="text-green-400 font-semibold">{stats.highest_elo}</p>
            </div>
          )}
          {stats.avg_elo && (
            <div className="text-center">
              <span className="text-gray-500">Průměrné ELO</span>
              <p className="text-white font-semibold">{stats.avg_elo}</p>
            </div>
          )}
          {stats.lowest_elo && (
            <div className="text-center">
              <span className="text-gray-500">Nejnižší ELO</span>
              <p className="text-red-400 font-semibold">{stats.lowest_elo}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// === RECENT PERFORMANCE COMPONENT ===
interface RecentPerformanceProps {
  stats: RecentPerformance;
}

export function RecentPerformanceComponent({ stats }: RecentPerformanceProps) {
  const winRate = parseFloat(stats.win_rate) || 0;
  const kd = parseFloat(stats.kd_ratio) || 0;
  const totalMultikills = stats.triple_kills + stats.quadro_kills + stats.penta_kills;
  
  return (
    <div className="bg-gray-800/40 rounded-xl border border-gray-700/30 overflow-hidden">
      {/* Main stats row */}
      <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-gray-700/30">
        <div className="p-3 sm:p-4 text-center">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">K/D</p>
          <p className={`text-xl sm:text-2xl font-bold ${kd >= 1 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.kd_ratio}
          </p>
        </div>
        <div className="p-3 sm:p-4 text-center">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">K/R</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{stats.kr_ratio}</p>
        </div>
        <div className="p-3 sm:p-4 text-center">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">HS %</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{stats.headshots_percent}%</p>
        </div>
        <div className="p-3 sm:p-4 text-center">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">ADR</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{stats.adr}</p>
        </div>
        <div className="p-3 sm:p-4 text-center">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Ø Zabití</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{stats.avg_kills}</p>
        </div>
        <div className="p-3 sm:p-4 text-center">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Výhernost</p>
          <p className={`text-xl sm:text-2xl font-bold ${winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
            {winRate}%
          </p>
          <p className="text-xs text-gray-500 mt-1">{stats.wins}V / {stats.losses}P</p>
        </div>
      </div>
      
      {/* Multi-kills row */}
      <div className="border-t border-gray-700/30 px-3 sm:px-4 py-3 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm bg-gray-800/20">
        <div className="text-center">
          <span className="text-gray-500">Multi-killy</span>
          <p className="text-white font-semibold">{totalMultikills}</p>
        </div>
        <div className="text-center">
          <span className="text-gray-500">3K</span>
          <p className="text-white font-semibold">{stats.triple_kills}</p>
        </div>
        <div className="text-center">
          <span className="text-gray-500">4K</span>
          <p className="text-white font-semibold">{stats.quadro_kills}</p>
        </div>
        <div className="text-center">
          <span className="text-gray-500">Ace</span>
          <p className="text-white font-semibold">{stats.penta_kills}</p>
        </div>
      </div>
    </div>
  );
}

// Legacy export
export function PlayerStatsComponent({ stats }: { stats: OverallStats }) {
  return <OverallStatsComponent stats={stats} />;
}
