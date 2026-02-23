import { Router } from 'express';
import { parseSearchQuery } from '../utils/parseQuery';
import {
  getPlayerByNickname,
  getPlayerBySteamId,
  getPlayerById,
  getPlayerStats,
  getMatchHistory,
  searchPlayers,
  processSearchResults,
  playerToResult,
  getRecentResults,
  getRecentPerformance,
  getEloHistory,
  getSteamIdFromPlayer
} from '../services/faceit';
import { PlayerResult } from '../types';

const router = Router();

/**
 * GET /api/players/search?query=...
 * Vyhledávání hráčů podle nicku, Faceit URL nebo Steam ID
 */
router.get('/search', async (req, res) => {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Chybí vyhledávací dotaz' });
  }

  const parsed = parseSearchQuery(query);
  console.log(`Vyhledávání: typ=${parsed.type}, hodnota=${parsed.value}`);

  try {
    let results: PlayerResult[] = [];

    if (parsed.type === 'faceit_url') {
      // Přímé vyhledání podle nicku z URL
      const player = await getPlayerByNickname(parsed.value);
      if (player) {
        const result = await playerToResult(player);
        if (result) results = [result];
      } else {
        // Fallback na search
        const searchData = await searchPlayers(parsed.value, 5);
        results = await processSearchResults(searchData);
      }
    } else if (parsed.type === 'steam_id') {
      // Vyhledání podle Steam64 ID
      const player = await getPlayerBySteamId(parsed.value);
      if (player) {
        const result = await playerToResult(player);
        if (result) results = [result];
      } else {
        return res.json({ items: [], message: 'Hráč s tímto Steam ID nemá propojený Faceit účet' });
      }
    } else if (parsed.type === 'steam_url') {
      // Steam vanity URL - nepodporováno bez Steam API
      return res.status(400).json({ 
        error: 'Steam custom URL není podporováno. Použijte Steam64 ID (17 číslic) nebo Faceit přezdívku.',
        hint: 'Steam64 ID najdete na steamid.io'
      });
    } else {
      // Standardní vyhledávání podle nicku
      const searchData = await searchPlayers(parsed.value, 10);
      results = await processSearchResults(searchData);
    }

    res.json({ items: results });
  } catch (error) {
    console.error('Chyba při vyhledávání:', error);
    res.status(500).json({ error: 'Chyba při komunikaci s Faceit API' });
  }
});

/**
 * GET /api/players/:playerId
 * Získání detailních informací o hráči
 */
router.get('/:playerId', async (req, res) => {
  const { playerId } = req.params;

  try {
    const player = await getPlayerById(playerId);
    
    if (!player) {
      return res.status(404).json({ error: 'Hráč nenalezen' });
    }

    const cs2Data = player.games?.cs2;
    const currentElo = cs2Data?.faceit_elo || 1000;
    
    // Získat statistiky, poslední výsledky, nedávný výkon a ELO historii paralelně
    const [stats, recentResults, recentPerformance, eloHistory] = await Promise.all([
      getPlayerStats(playerId),
      getRecentResults(playerId, 5),
      getRecentPerformance(playerId, 20),
      getEloHistory(playerId, currentElo, 20)
    ]);
    
    // Calculate ELO stats from history
    let highestElo: number | null = null;
    let lowestElo: number | null = null;
    let avgElo: number | null = null;
    
    if (eloHistory && eloHistory.length > 0) {
      const elos = eloHistory.map(e => e.elo);
      highestElo = Math.max(...elos);
      lowestElo = Math.min(...elos);
      avgElo = Math.round(elos.reduce((a, b) => a + b, 0) / elos.length);
    }
    
    // Získat Steam ID z Faceit API
    const steamId = getSteamIdFromPlayer(player);
    
    res.json({
      player_id: player.player_id,
      steam_id_64: steamId, // Přidat Steam ID do response
      nickname: player.nickname,
      avatar: player.avatar || '',
      country: player.country,
      skill_level: cs2Data?.skill_level || null,
      elo: cs2Data?.faceit_elo || null,
      recent_results: recentResults,
      stats: stats ? {
        matches: stats.lifetime?.Matches || '0',
        wins: stats.lifetime?.Wins || '0',
        win_rate: stats.lifetime?.['Win Rate %'] || '0',
        kd_ratio: stats.lifetime?.['Average K/D Ratio'] || '0',
        headshots: stats.lifetime?.['Average Headshots %'] || '0',
        highest_elo: highestElo,
        lowest_elo: lowestElo,
        avg_elo: avgElo
      } : null,
      recentPerformance,
      eloHistory,
      maps: stats?.segments?.map(seg => ({
        name: seg.label,
        image: seg.img_small,
        matches: seg.stats?.Matches || '0',
        wins: seg.stats?.Wins || '0',
        win_rate: seg.stats?.['Win Rate %'] || '0',
        kd_ratio: seg.stats?.['Average K/D Ratio'] || '0',
        avg_kills: seg.stats?.['Average Kills'] || '0'
      })) || []
    });
  } catch (error) {
    console.error('Chyba při získávání hráče:', error);
    res.status(500).json({ error: 'Chyba při komunikaci s Faceit API' });
  }
});

/**
 * GET /api/players/:playerId/matches
 * Získání historie zápasů hráče
 */
router.get('/:playerId/matches', async (req, res) => {
  const { playerId } = req.params;
  const limit = parseInt(req.query.limit as string) || 20;

  try {
    const matches = await getMatchHistory(playerId, limit);
    res.json({ items: matches });
  } catch (error) {
    console.error('Chyba při získávání zápasů:', error);
    res.status(500).json({ error: 'Chyba při komunikaci s Faceit API' });
  }
});

export default router;

