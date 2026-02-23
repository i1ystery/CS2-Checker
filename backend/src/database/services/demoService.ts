import { IDemoData, PlayerHeatmapData } from '../models/DemoData';
import { getDb, isDatabaseConnected } from '../connection';

interface EventRow {
  player_id: string;
  player_name: string;
  event_type: string;
  x: number;
  y: number;
  team_num: number | null;
  layer: string | null;
}

interface MatchRow {
  id: number;
  match_id: string;
  map_name: string;
  created_at: string;
  updated_at: string;
}

function reshapeRows(matchRow: MatchRow, eventRows: EventRow[]): IDemoData {
  const playerMap = new Map<string, PlayerHeatmapData>();

  for (const row of eventRows) {
    let player = playerMap.get(row.player_id);
    if (!player) {
      player = {
        player_id: row.player_id,
        player_name: row.player_name,
        deaths: [],
        kills: []
      };
      playerMap.set(row.player_id, player);
    }

    const point: { x: number; y: number; team_num?: number; layer?: 'upper' | 'lower' } = {
      x: row.x,
      y: row.y
    };
    if (row.team_num != null) point.team_num = row.team_num;
    if (row.layer) point.layer = row.layer as 'upper' | 'lower';

    if (row.event_type === 'kill') {
      player.kills.push(point);
    } else {
      player.deaths.push(point);
    }
  }

  return {
    match_id: matchRow.match_id,
    map_name: matchRow.map_name,
    players_data: Array.from(playerMap.values()),
    created_at: new Date(matchRow.created_at),
    updated_at: new Date(matchRow.updated_at)
  };
}

export async function saveDemoData(
  matchId: string,
  mapName: string,
  playersData: PlayerHeatmapData[]
): Promise<IDemoData | null> {
  if (!isDatabaseConnected()) {
    console.warn('Database not connected, data will not be saved');
    return null;
  }

  const db = getDb()!;

  try {
    const saveTransaction = db.transaction(() => {
      const existing = db.prepare('SELECT id FROM demo_matches WHERE match_id = ?').get(matchId) as { id: number } | undefined;

      let matchDbId: number;

      if (existing) {
        db.prepare("UPDATE demo_matches SET map_name = ?, updated_at = datetime('now') WHERE id = ?")
          .run(mapName, existing.id);
        db.prepare('DELETE FROM player_events WHERE demo_match_id = ?').run(existing.id);
        matchDbId = existing.id;
      } else {
        const result = db.prepare('INSERT INTO demo_matches (match_id, map_name) VALUES (?, ?)')
          .run(matchId, mapName);
        matchDbId = result.lastInsertRowid as number;
      }

      const insertEvent = db.prepare(
        'INSERT INTO player_events (demo_match_id, player_id, player_name, event_type, x, y, team_num, layer) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );

      for (const player of playersData) {
        for (const kill of player.kills) {
          insertEvent.run(matchDbId, player.player_id, player.player_name, 'kill', kill.x, kill.y, kill.team_num ?? null, kill.layer ?? null);
        }
        for (const death of player.deaths) {
          insertEvent.run(matchDbId, player.player_id, player.player_name, 'death', death.x, death.y, death.team_num ?? null, death.layer ?? null);
        }
      }

      const row = db.prepare('SELECT * FROM demo_matches WHERE id = ?').get(matchDbId) as MatchRow;
      const events = db.prepare('SELECT * FROM player_events WHERE demo_match_id = ?').all(matchDbId) as EventRow[];
      return reshapeRows(row, events);
    });

    return saveTransaction();
  } catch (error) {
    console.error('Error saving demo data:', error);
    return null;
  }
}

export async function getDemoDataByMatchId(matchId: string): Promise<IDemoData | null> {
  if (!isDatabaseConnected()) {
    return null;
  }

  const db = getDb()!;

  try {
    const matchRow = db.prepare('SELECT * FROM demo_matches WHERE match_id = ?').get(matchId) as MatchRow | undefined;
    if (!matchRow) return null;

    const eventRows = db.prepare('SELECT * FROM player_events WHERE demo_match_id = ?').all(matchRow.id) as EventRow[];
    return reshapeRows(matchRow, eventRows);
  } catch (error) {
    console.error('Error fetching demo data:', error);
    return null;
  }
}

export async function getMatchesByPlayerAndMap(
  playerId: string,
  mapName: string
): Promise<IDemoData[]> {
  if (!isDatabaseConnected()) {
    return [];
  }

  const db = getDb()!;

  try {
    const matchRows = db.prepare(`
      SELECT DISTINCT dm.* FROM demo_matches dm
      JOIN player_events pe ON pe.demo_match_id = dm.id
      WHERE pe.player_id = ? AND dm.map_name = ?
      ORDER BY dm.created_at DESC
    `).all(playerId, mapName) as MatchRow[];

    return matchRows.map(matchRow => {
      const eventRows = db.prepare('SELECT * FROM player_events WHERE demo_match_id = ?').all(matchRow.id) as EventRow[];
      return reshapeRows(matchRow, eventRows);
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
}

export async function getMatchesByPlayer(playerId: string): Promise<IDemoData[]> {
  if (!isDatabaseConnected()) {
    return [];
  }

  const db = getDb()!;

  try {
    const matchRows = db.prepare(`
      SELECT DISTINCT dm.* FROM demo_matches dm
      JOIN player_events pe ON pe.demo_match_id = dm.id
      WHERE pe.player_id = ?
      ORDER BY dm.created_at DESC
    `).all(playerId) as MatchRow[];

    return matchRows.map(matchRow => {
      const eventRows = db.prepare('SELECT * FROM player_events WHERE demo_match_id = ?').all(matchRow.id) as EventRow[];
      return reshapeRows(matchRow, eventRows);
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
}

export async function deleteDemoData(matchId: string): Promise<boolean> {
  if (!isDatabaseConnected()) {
    return false;
  }

  const db = getDb()!;

  try {
    const result = db.prepare('DELETE FROM demo_matches WHERE match_id = ?').run(matchId);
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting demo data:', error);
    return false;
  }
}

export async function getMatchesByMap(mapName: string): Promise<IDemoData[]> {
  if (!isDatabaseConnected()) {
    return [];
  }

  const db = getDb()!;

  try {
    const matchRows = db.prepare('SELECT * FROM demo_matches WHERE map_name = ? ORDER BY created_at DESC').all(mapName) as MatchRow[];

    return matchRows.map(matchRow => {
      const eventRows = db.prepare('SELECT * FROM player_events WHERE demo_match_id = ?').all(matchRow.id) as EventRow[];
      return reshapeRows(matchRow, eventRows);
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
}
