'use client';

import { Player } from '@/types';
import { getEloColor } from '@/utils/elo';
import { getAvatarUrl, DEFAULT_AVATAR } from '@/utils/avatar';
import { getLevelIcon } from '@/utils/level';
import Image from 'next/image';

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
}

export function PlayerCard({ player, onClick }: PlayerCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-orange-500 transition-colors cursor-pointer"
    >
      {/* Avatar */}
      <img
        src={getAvatarUrl(player.avatar)}
        alt={player.nickname}
        className="w-12 h-12 rounded-full bg-gray-700"
        onError={(e) => {
          (e.target as HTMLImageElement).src = DEFAULT_AVATAR;
        }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white truncate">{player.nickname}</span>
          <img 
            src={`https://flagcdn.com/16x12/${player.country?.toLowerCase()}.png`}
            alt={player.country}
            className="w-4 h-3"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        {/* Poslední zápasy */}
        {player.recent_results && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs text-gray-500">Posledních 5 zápasů:</span>
            <div className="flex gap-0.5">
              {player.recent_results.split('').map((result, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-sm flex items-center justify-center text-[10px] font-bold text-white ${
                    result === 'W' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                >
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Level + ELO */}
      <div className="flex flex-col items-end gap-1 text-right">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Úroveň:</span>
          {player.skill_level ? (
            <Image
              src={getLevelIcon(player.skill_level)}
              alt={`Úroveň ${player.skill_level}`}
              width={24}
              height={24}
            />
          ) : (
            <span className="text-gray-500">—</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">ELO:</span>
          <span className={`font-bold ${player.elo ? getEloColor(player.elo) : 'text-gray-500'}`}>
            {player.elo || '-'}
          </span>
        </div>
      </div>
    </div>
  );
}

