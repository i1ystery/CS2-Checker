/**
 * Vrátí Tailwind CSS třídu pro barvu podle ELO hodnoty
 */
export function getEloColor(elo: number): string {
  if (elo >= 2001) return 'text-red-500';      // Level 10
  if (elo >= 1751) return 'text-orange-400';   // Level 9
  if (elo >= 1531) return 'text-orange-500';   // Level 8
  if (elo >= 1351) return 'text-yellow-500';   // Level 7
  if (elo >= 1201) return 'text-yellow-400';   // Level 6
  if (elo >= 1051) return 'text-green-400';    // Level 5
  if (elo >= 901) return 'text-green-500';     // Level 4
  if (elo >= 751) return 'text-cyan-400';      // Level 3
  if (elo >= 501) return 'text-gray-400';      // Level 2
  return 'text-gray-500';                       // Level 1
}

