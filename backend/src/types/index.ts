// === Faceit API Response Typy ===

export interface FaceitSearchResult {
  items: Array<{
    player_id: string;
    nickname: string;
    avatar: string;
    country: string;
    games?: Array<{ name: string; skill_level: string }>;
  }>;
}

export interface FaceitPlayerDetails {
  player_id: string;
  nickname: string;
  avatar: string;
  country: string;
  steam_id_64?: string; // Steam ID hráče
  games?: {
    cs2?: {
      faceit_elo: number;
      skill_level: number;
    };
  };
}

export interface FaceitMatchHistory {
  items: Array<{
    match_id: string;
    competition_name?: string;
    finished_at: number;
    i1?: string; // Map name
    i18?: string; // Map image
    elo?: number; // Player's ELO after this match
    results: {
      winner: string;
      score?: {
        faction1: number;
        faction2: number;
      };
    };
    teams: {
      faction1: { players: Array<{ player_id: string; nickname: string }> };
      faction2: { players: Array<{ player_id: string; nickname: string }> };
    };
  }>;
}

export interface FaceitPlayerStats {
  lifetime?: {
    Matches?: string;
    Wins?: string;
    'Win Rate %'?: string;
    'Average K/D Ratio'?: string;
    'Average Kills'?: string;
    'Average Deaths'?: string;
    'K/D Ratio'?: string;
    'Total Kills'?: string;
    'Total Deaths'?: string;
    'Average Headshots %'?: string;
    'Headshots per Match'?: string;
    'Total Headshots'?: string;
    'Average Assists'?: string;
    'Total Assists'?: string;
    'Average MVPs'?: string;
    'Total MVPs'?: string;
    'Longest Win Streak'?: string;
    'Current Win Streak'?: string;
    'Average Triple Kills'?: string;
    'Average Quadro Kills'?: string;
    'Average Penta Kills'?: string;
  };
  
  segments?: Array<{
    label: string;
    img_small: string;
    img_regular: string;
    stats: {
      Matches?: string;
      Wins?: string;
      'Win Rate %'?: string;
      'Average K/D Ratio'?: string;
      'Average Kills'?: string;
      'Average Deaths'?: string;
      'Average Headshots %'?: string;
    };
  }>;
}

export interface FaceitMatchStats {
  rounds: Array<{
    round_stats?: {
      Rounds?: string;
      Map?: string;
    };
    teams: Array<{
      team_id: string;
      players: Array<{
        player_id: string;
        nickname: string;
        player_stats: {
          Kills?: string;
          Deaths?: string;
          Assists?: string;
          Headshots?: string;
          MVPs?: string;
          'Triple Kills'?: string;
          'Quadro Kills'?: string;
          'Penta Kills'?: string;
          'K/D Ratio'?: string;
          'K/R Ratio'?: string;
          'Headshots %'?: string;
          ADR?: string;
          Damage?: string;
        };
      }>;
    }>;
  }>;
}

// === API Response Typy (pro frontend) ===

export interface PlayerResult {
  player_id: string;
  nickname: string;
  avatar: string;
  country: string;
  skill_level: number | null;
  elo: number | null;
  recent_results: string;
}

export interface PlayerDetail extends PlayerResult {
  stats: OverallStats | null;
  recentPerformance: RecentPerformance | null;
  maps: MapStats[];
  eloHistory: EloPoint[];
}

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

export interface MatchResult {
  match_id: string;
  map: string;
  score: string;
  result: 'win' | 'loss';
  date: number;
  elo_change: number | null;
  has_demo?: boolean; // Zda máme demo data pro tento zápas
  player_stats?: {
    kills: number;
    deaths: number;
    assists: number;
    kd: string;
    kr: string;
    adr: string;
    hs_percent: string;
  };
}

export interface EloPoint {
  date: number;
  elo: number;
  change: number;
}
