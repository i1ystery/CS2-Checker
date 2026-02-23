'use client';

import { Player } from '@/types';
import { PlayerCard } from './PlayerCard';

interface PlayerListProps {
  players: Player[];
  onPlayerClick?: (player: Player) => void;
}

export function PlayerList({ players, onPlayerClick }: PlayerListProps) {
  if (players.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold mb-4 text-gray-300">
        Nalezení hráči ({players.length})
      </h2>
      
      {players.map((player) => (
        <PlayerCard
          key={player.player_id}
          player={player}
          onClick={() => onPlayerClick?.(player)}
        />
      ))}
    </div>
  );
}

