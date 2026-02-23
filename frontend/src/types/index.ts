// === Typy pro vyhledávání ===

export interface Player {
  player_id: string;
  nickname: string;
  avatar: string;
  country: string;
  skill_level: number | null;
  elo: number | null;
  recent_results: string;
}

export interface SearchResult {
  items: Player[];
  message?: string;
}

// === Typy pro detail hráče ===

export interface OverallStats {
  matches: string;
  wins: string;
  win_rate: string;
  kd_ratio: string;
  headshots: string;
  highest_elo: number | null;
  lowest_elo: number | null;
  avg_elo: number | null;
}

export interface RecentPerformance {
  matches: number;
  wins: number;
  losses: number;
  win_rate: string;
  kd_ratio: string;
  kr_ratio: string;
  headshots_percent: string;
  adr: string;
  avg_kills: string;
  avg_deaths: string;
  triple_kills: number;
  quadro_kills: number;
  penta_kills: number;
}

export interface MapStats {
  name: string;
  image: string;
  matches: string;
  wins: string;
  win_rate: string;
  kd_ratio: string;
  avg_kills: string;
}

export interface EloPoint {
  date: number;
  elo: number;
  change: number;
}

export interface PlayerDetail extends Player {
  steam_id_64?: string; // Steam ID hráče z Faceit API
  stats: OverallStats | null;
  recentPerformance: RecentPerformance | null;
  maps: MapStats[];
  eloHistory: EloPoint[];
}

// === Typy pro zápasy ===

export interface MatchPlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  kd: string;
  kr: string;
  adr: string;
  hs_percent: string;
}

export interface Match {
  match_id: string;
  map: string;
  score: string;
  result: 'win' | 'loss';
  date: number;
  elo_change: number | null;
  has_demo?: boolean; // Zda máme demo data pro tento zápas
  player_stats?: MatchPlayerStats;
}

export interface MatchesResult {
  items: Match[];
}
