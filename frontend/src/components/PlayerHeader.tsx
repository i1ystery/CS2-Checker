'use client';

import { PlayerDetail } from '@/types';
import { getEloColor } from '@/utils/elo';
import { getAvatarUrl, DEFAULT_AVATAR } from '@/utils/avatar';
import { getLevelIcon } from '@/utils/level';
import Image from 'next/image';

interface PlayerHeaderProps {
  player: PlayerDetail;
}

export function PlayerHeader({ player }: PlayerHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-gray-800 rounded-xl border border-gray-700">
      {/* Avatar */}
      <img
        src={getAvatarUrl(player.avatar)}
        alt={player.nickname}
        className="w-24 h-24 rounded-full bg-gray-700 border-4 border-orange-500"
        onError={(e) => {
          (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
        }}
      />

      {/* Info */}
      <div className="flex-1 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
          <h1 className="text-3xl font-bold text-white">{player.nickname}</h1>
          {player.country && (
            <img 
              src={`https://flagcdn.com/24x18/${player.country.toLowerCase()}.png`}
              alt={player.country}
              className="w-6 h-4"
            />
          )}
        </div>
        
        {/* Recent results */}
        {player.recent_results && (
          <div className="flex items-center justify-center md:justify-start gap-1.5 mt-2">
            <span className="text-sm text-gray-500">Posledních 5:</span>
            <div className="flex gap-0.5">
              {player.recent_results.split('').map((result, i) => (
                <div
                  key={i}
                  className={`w-5 h-5 rounded-sm flex items-center justify-center text-xs font-bold text-white ${
                    result === 'W' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Faceit profil tlačítko */}
        <a
          href={`https://www.faceit.com/en/players/${player.nickname}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center mt-3 px-4 py-2 bg-[#FF5500] hover:bg-[#ff6a1a] rounded-lg font-semibold transition-colors text-sm text-black"
        >
          Faceit Profil
        </a>
      </div>

      {/* Level a ELO */}
      <div className="flex flex-row md:flex-col items-center gap-4 md:gap-2">
        {player.skill_level && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Úroveň:</span>
            <Image
              src={getLevelIcon(player.skill_level)}
              alt={`Úroveň ${player.skill_level}`}
              width={32}
              height={32}
            />
          </div>
        )}
        {player.elo && (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">ELO:</span>
            <span className={`font-bold text-2xl ${getEloColor(player.elo)}`}>
              {player.elo}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

