import {
  FaceitSearchResult,
  FaceitPlayerDetails,
  FaceitMatchHistory,
  FaceitPlayerStats,
  FaceitMatchStats,
  PlayerResult,
  MatchResult,
  RecentPerformance,
  EloPoint
} from '../types';
import { getDemoDataByMatchId } from '../database/services/demoService';

const FACEIT_API_URL = 'https://open.faceit.com/data/v4';

/**
 * Získání API klíče (načte se až při volání, po dotenv.config())
 */
function getApiKey(): string {
  return process.env.FACEIT_API_KEY || '';
}

/**
 * Základní fetch wrapper pro Faceit API
 */
export async function faceitFetch<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${FACEIT_API_URL}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${getApiKey()}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Faceit API error: ${response.status}`);
  }
  
  return response.json() as Promise<T>;
}

/**
 * Získání posledních výsledků hráče (W/L string)
 */
export async function getRecentResults(playerId: string, limit: number = 5): Promise<string> {
  try {
    const history = await faceitFetch<FaceitMatchHistory>(
      `/players/${playerId}/history?game=cs2&offset=0&limit=${limit}`
    );
    
    const results = history.items.map(match => {
      const isInFaction1 = match.teams.faction1.players.some(p => p.player_id === playerId);
      const playerFaction = isInFaction1 ? 'faction1' : 'faction2';
      return match.results.winner === playerFaction ? 'W' : 'L';
    });
    
    return results.join('');
  } catch {
    return '';
  }
}

/**
 * Získání detailní historie zápasů hráče s player stats a ELO změnami
 */
export async function getMatchHistory(playerId: string, limit: number = 20): Promise<MatchResult[]> {
  try {
    const history = await faceitFetch<FaceitMatchHistory>(
      `/players/${playerId}/history?game=cs2&offset=0&limit=${limit}`
    );
    
    // Získat ELO změny z interního API (stejný endpoint jako používá faceittracker.net)
    let eloChangesMap: Map<string, number> = new Map();
    try {
      const eloResponse = await fetch(
        `https://api.faceit.com/stats/v1/stats/time/users/${playerId}/games/cs2?page=0&size=${limit}`
      );
      if (eloResponse.ok) {
        const eloData = await eloResponse.json() as FaceitInternalStats[];
        eloData.forEach((match: FaceitInternalStats) => {
          if (match.matchId && match.elo_delta !== undefined && match.elo_delta !== null) {
            eloChangesMap.set(match.matchId, typeof match.elo_delta === 'string' ? parseInt(match.elo_delta) : match.elo_delta);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching ELO changes:', error);
      // Pokračujeme bez ELO změn
    }
    
    // Fetch stats for all matches in parallel
    const matchStatsPromises = history.items.map(match => getMatchStats(match.match_id));
    const allMatchStats = await Promise.all(matchStatsPromises);
    
    // Zkontrolovat, zda máme demo data pro všechny zápasy paralelně
    const demoCheckPromises = history.items.map(match => getDemoDataByMatchId(match.match_id));
    const demoDataResults = await Promise.all(demoCheckPromises);
    
    return history.items.map((match, index) => {
      const hasDemo = demoDataResults[index] !== null;
      const isInFaction1 = match.teams.faction1.players.some(p => p.player_id === playerId);
      const playerFaction = isInFaction1 ? 'faction1' : 'faction2';
      const isWin = match.results.winner === playerFaction;
      
      // Get ELO change from internal API
      const eloChange = eloChangesMap.get(match.match_id) ?? null;
      
      // Get player stats from match
      const matchStats = allMatchStats[index];
      let playerStats = undefined;
      
      if (matchStats?.rounds?.[0]?.teams) {
        const mapName = matchStats.rounds[0].round_stats?.Map;
        
        for (const team of matchStats.rounds[0].teams) {
          const player = team.players.find((p: { player_id: string }) => p.player_id === playerId);
          if (player?.player_stats) {
            const ps = player.player_stats;
            const kills = parseInt(ps.Kills || '0');
            const deaths = parseInt(ps.Deaths || '0');
            const assists = parseInt(ps.Assists || '0');
            
            playerStats = {
              kills,
              deaths,
              assists,
              kd: ps['K/D Ratio'] || (deaths > 0 ? (kills / deaths).toFixed(2) : kills.toString()),
              kr: ps['K/R Ratio'] || '0',
              adr: ps.ADR || '0',
              hs_percent: ps['Headshots %'] || '0'
            };
            
            // Use actual map name if available
            if (mapName) {
              return {
                match_id: match.match_id,
                map: mapName,
                score: match.results.score ? 
                  `${match.results.score.faction1}-${match.results.score.faction2}` : 
                  'N/A',
                result: isWin ? 'win' : 'loss' as const,
                date: match.finished_at,
                elo_change: eloChange,
                has_demo: hasDemo,
                player_stats: playerStats
              };
            }
            break;
          }
        }
      }
      
      return {
        match_id: match.match_id,
        map: match.i1 || 'Unknown Map',
        score: match.results.score ? 
          `${match.results.score.faction1}-${match.results.score.faction2}` : 
          'N/A',
        result: isWin ? 'win' : 'loss' as const,
        date: match.finished_at,
        elo_change: eloChange,
        has_demo: hasDemo,
        player_stats: playerStats
      };
    });
  } catch (error) {
    console.error('Error fetching match history:', error);
    return [];
  }
}

// Interface pro interní Faceit API response
interface FaceitInternalStats {
  matchId: string;
  date: number;
  elo: number;
  elo_delta: number;
  i1?: string; // map name
  i18?: string; // score
}

/**
 * Získání ELO historie ze skutečných dat z interního Faceit API
 * POZNÁMKA: Tento endpoint není oficiálně dokumentovaný, ale používá se i jinými trackery
 * (např. faceittracker.net). Vrací přesné ELO změny pro každý zápas.
 */
export async function getEloHistory(playerId: string, currentElo: number, limit: number = 20): Promise<EloPoint[]> {
  try {
    // Použijeme interní Faceit API pro přesné ELO hodnoty
    // Tento endpoint používají i jiné trackery (faceittracker.net)
    const response = await fetch(
      `https://api.faceit.com/stats/v1/stats/time/users/${playerId}/games/cs2?page=0&size=${limit}`
    );
    
    if (!response.ok) {
      console.error(`Faceit internal API error: ${response.status}`);
      return [];
    }
    
    const data = await response.json() as FaceitInternalStats[];
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Data jsou seřazena od nejnovějšího po nejstarší
    // Převrátíme na chronologické pořadí pro graf
    const points: EloPoint[] = data
      .filter(match => match.elo !== undefined && match.elo !== null)
      .map(match => ({
        date: Math.floor(match.date / 1000), // Převod na sekundy
        elo: typeof match.elo === 'string' ? parseInt(match.elo) : match.elo,
        change: typeof match.elo_delta === 'string' ? parseInt(match.elo_delta) : (match.elo_delta || 0)
      }))
      .reverse(); // Od nejstaršího po nejnovější pro graf
    
    return points;
  } catch (error) {
    console.error('Error getting ELO history from internal API:', error);
    return [];
  }
}

/**
 * Získání statistik hráče pro CS2
 */
export async function getPlayerStats(playerId: string): Promise<FaceitPlayerStats | null> {
  try {
    return await faceitFetch<FaceitPlayerStats>(`/players/${playerId}/stats/cs2`);
  } catch {
    return null;
  }
}

/**
 * Získání Steam ID z Faceit player details
 */
export function getSteamIdFromPlayer(player: FaceitPlayerDetails): string | null {
  // Zkusit získat steam_id_64 z Faceit API response
  const steamId = (player as any)?.steam_id_64 || 
                 (player as any)?.steamId || 
                 (player as any)?.steamid ||
                 player.steam_id_64;
  
  if (steamId) {
    return String(steamId).replace(/[^0-9]/g, '');
  }
  
  return null;
}

/**
 * Převod FaceitPlayerDetails na PlayerResult
 */
export async function playerToResult(player: FaceitPlayerDetails): Promise<PlayerResult | null> {
  const cs2Elo = player.games?.cs2?.faceit_elo || null;
  const cs2Level = player.games?.cs2?.skill_level || null;
  
  if (!cs2Elo) return null;
  
  const recentResults = await getRecentResults(player.player_id);
  
  return {
    player_id: player.player_id,
    nickname: player.nickname,
    avatar: player.avatar || '',
    country: player.country,
    skill_level: cs2Level,
    elo: cs2Elo,
    recent_results: recentResults
  };
}

/**
 * Zpracování výsledků vyhledávání
 */
export async function processSearchResults(searchData: FaceitSearchResult): Promise<PlayerResult[]> {
  const playersWithElo = await Promise.all(
    searchData.items.map(async (player) => {
      try {
        const details = await faceitFetch<FaceitPlayerDetails>(`/players/${player.player_id}`);
        return playerToResult(details);
      } catch {
        return null;
      }
    })
  );
  
  return playersWithElo.filter((p): p is PlayerResult => p !== null);
}

/**
 * Vyhledání hráče podle nicku
 */
export async function getPlayerByNickname(nickname: string): Promise<FaceitPlayerDetails | null> {
  try {
    return await faceitFetch<FaceitPlayerDetails>(`/players?nickname=${encodeURIComponent(nickname)}`);
  } catch {
    return null;
  }
}

/**
 * Vyhledání hráče podle Steam ID
 */
export async function getPlayerBySteamId(steamId: string): Promise<FaceitPlayerDetails | null> {
  try {
    return await faceitFetch<FaceitPlayerDetails>(`/players?game=cs2&game_player_id=${steamId}`);
  } catch {
    return null;
  }
}

/**
 * Vyhledání hráče podle Faceit ID
 */
export async function getPlayerById(playerId: string): Promise<FaceitPlayerDetails | null> {
  try {
    return await faceitFetch<FaceitPlayerDetails>(`/players/${playerId}`);
  } catch {
    return null;
  }
}

/**
 * Vyhledávání hráčů podle nicku
 */
export async function searchPlayers(nickname: string, limit: number = 10): Promise<FaceitSearchResult> {
  return await faceitFetch<FaceitSearchResult>(`/search/players?nickname=${encodeURIComponent(nickname)}&limit=${limit}`);
}

/**
 * Získání statistik jednotlivého zápasu
 */
export async function getMatchStats(matchId: string): Promise<FaceitMatchStats | null> {
  try {
    return await faceitFetch<FaceitMatchStats>(`/matches/${matchId}/stats`);
  } catch {
    return null;
  }
}

/**
 * Získání nedávného výkonu hráče z posledních N zápasů
 */
export async function getRecentPerformance(playerId: string, limit: number = 20): Promise<RecentPerformance | null> {
  try {
    // Získat historii zápasů
    const history = await faceitFetch<FaceitMatchHistory>(
      `/players/${playerId}/history?game=cs2&offset=0&limit=${limit}`
    );

    if (!history.items || history.items.length === 0) {
      return null;
    }

    // Získat detailní statistiky pro každý zápas
    const matchStatsPromises = history.items.map(match => getMatchStats(match.match_id));
    const allMatchStats = await Promise.all(matchStatsPromises);

    // Agregovat statistiky hráče
    let totalKills = 0;
    let totalDeaths = 0;
    let totalHeadshots = 0;
    let totalRounds = 0;
    let totalDamage = 0;
    let totalTripleKills = 0;
    let totalQuadroKills = 0;
    let totalPentaKills = 0;
    let wins = 0;
    let matchCount = 0;

    for (let i = 0; i < history.items.length; i++) {
      const match = history.items[i];
      const matchStats = allMatchStats[i];

      if (!match || !matchStats?.rounds?.[0]?.teams) continue;

      // Najít statistiky hráče v zápase
      const teams = matchStats.rounds[0].teams;
      const roundStats = matchStats.rounds[0].round_stats;
      const roundsInMatch = parseInt(roundStats?.Rounds || '24'); // default 24 rounds
      
      let playerStats = null;

      for (const team of teams) {
        const player = team.players.find((p: { player_id: string }) => p.player_id === playerId);
        if (player) {
          playerStats = player.player_stats;
          
          // Zjistit jestli hráč vyhrál
          const isInFaction1 = match.teams.faction1.players.some((p: { player_id: string }) => p.player_id === playerId);
          const playerFaction = isInFaction1 ? 'faction1' : 'faction2';
          if (match.results.winner === playerFaction) {
            wins++;
          }
          break;
        }
      }

      if (playerStats) {
        totalKills += parseInt(playerStats.Kills || '0');
        totalDeaths += parseInt(playerStats.Deaths || '0');
        totalHeadshots += parseInt(playerStats.Headshots || '0');
        totalRounds += roundsInMatch;
        totalDamage += parseInt(playerStats.Damage || '0');
        totalTripleKills += parseInt(playerStats['Triple Kills'] || '0');
        totalQuadroKills += parseInt(playerStats['Quadro Kills'] || '0');
        totalPentaKills += parseInt(playerStats['Penta Kills'] || '0');
        matchCount++;
      }
    }

    if (matchCount === 0) return null;

    const kdRatio = totalDeaths > 0 ? (totalKills / totalDeaths) : totalKills;
    const krRatio = totalRounds > 0 ? (totalKills / totalRounds) : 0;
    const hsPercent = totalKills > 0 ? (totalHeadshots / totalKills * 100) : 0;
    const adr = totalRounds > 0 ? (totalDamage / totalRounds) : 0;

    return {
      matches: matchCount,
      wins,
      losses: matchCount - wins,
      win_rate: ((wins / matchCount) * 100).toFixed(0),
      kd_ratio: kdRatio.toFixed(2),
      kr_ratio: krRatio.toFixed(2),
      headshots_percent: hsPercent.toFixed(0),
      adr: adr.toFixed(1),
      avg_kills: (totalKills / matchCount).toFixed(1),
      avg_deaths: (totalDeaths / matchCount).toFixed(1),
      triple_kills: totalTripleKills,
      quadro_kills: totalQuadroKills,
      penta_kills: totalPentaKills
    };
  } catch (error) {
    console.error('Error getting recent performance:', error);
    return null;
  }
}

