/**
 * Vrátí URL ikonky pro Faceit level
 */
export function getLevelIcon(level: number | null): string {
  if (level === null || level < 1 || level > 10) {
    return '/1.png'; // Default level 1
  }
  return `/${level}.png`;
}

/**
 * Vrátí URL ikonky pro challenger (elite) level
 */
export function getChallengerIcon(): string {
  return '/challenger.png';
}

