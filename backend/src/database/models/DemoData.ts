export interface IDemoData {
  match_id: string;
  map_name: string;
  players_data: PlayerHeatmapData[];
  created_at: Date;
  updated_at: Date;
}

export interface PlayerHeatmapData {
  player_id: string;
  player_name: string;
  deaths: Array<{ x: number; y: number; team_num?: number; layer?: 'upper' | 'lower' }>;
  kills: Array<{ x: number; y: number; team_num?: number; layer?: 'upper' | 'lower' }>;
}
