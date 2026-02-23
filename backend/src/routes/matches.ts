import { Router } from 'express';
import { getMatchStats, faceitFetch, getPlayerById, getSteamIdFromPlayer } from '../services/faceit';

const router = Router();

/**
 * GET /api/matches/:matchId
 * Získání detailních informací o zápase včetně statistik všech hráčů
 */
router.get('/:matchId', async (req, res) => {
  const { matchId } = req.params;

  try {
    // Získat základní informace o zápase
    const matchInfo = await faceitFetch<any>(`/matches/${matchId}`);
    
    // Získat statistiky zápasu
    const matchStats = await getMatchStats(matchId);
    
    if (!matchInfo || !matchStats) {
      return res.status(404).json({ error: 'Zápas nenalezen' });
    }

    // Zpracovat statistiky hráčů
    const roundStats = matchStats.rounds?.[0];
    const teams = roundStats?.teams || [];
    
    // Získat všechny player IDs
    const allPlayerIds = teams.flatMap(team => team.players.map(p => p.player_id));
    
    // Načíst level a ELO pro všechny hráče paralelně
    const playerDetailsPromises = allPlayerIds.map(playerId => getPlayerById(playerId));
    const playerDetails = await Promise.all(playerDetailsPromises);
    
    // Vytvořit mapu player_id -> {level, elo, avatar, steam_id_64}
    const playerInfoMap = new Map<string, { level: number | null; elo: number | null; avatar: string; steam_id_64: string | null }>();
    playerDetails.forEach((player, index) => {
      const playerId = allPlayerIds[index];
      if (player && playerId) {
        const cs2Data = player.games?.cs2;
        const steamId = getSteamIdFromPlayer(player);
        playerInfoMap.set(playerId, {
          level: cs2Data?.skill_level || null,
          elo: cs2Data?.faceit_elo || null,
          avatar: player.avatar || '',
          steam_id_64: steamId
        });
      }
    });
    
    // Vypočítat KAST (Kill, Assist, Survive, Trade)
    // KAST = (Kills + Assists + Survives + Trades) / Rounds
    // Survive = Rounds - Deaths
    // Trade = když hráč zabije někoho, kdo zabil jeho spoluhráče (toto není přímo dostupné, použijeme zjednodušený výpočet)
    const totalRounds = parseInt(roundStats?.round_stats?.Rounds || '0') || 30; // Default 30 rounds
    
    const playersStats = teams.flatMap(team => 
      team.players.map(player => {
        const kills = parseInt(player.player_stats?.Kills || '0');
        const deaths = parseInt(player.player_stats?.Deaths || '0');
        const assists = parseInt(player.player_stats?.Assists || '0');
        
        const playerInfo = playerInfoMap.get(player.player_id) || { level: null, elo: null, avatar: '', steam_id_64: null };
        
        return {
          player_id: player.player_id,
          steam_id_64: playerInfo.steam_id_64, // Přidat Steam ID do response
          nickname: player.nickname,
          avatar: playerInfo.avatar,
          level: playerInfo.level,
          elo: playerInfo.elo,
          team_id: team.team_id,
          stats: {
            kills,
            deaths,
            assists,
            kd: player.player_stats?.['K/D Ratio'] || '0',
            kr: player.player_stats?.['K/R Ratio'] || '0',
            adr: player.player_stats?.ADR || '0',
            hs_percent: player.player_stats?.['Headshots %'] || '0',
            triple_kills: parseInt(player.player_stats?.['Triple Kills'] || '0'),
            quadro_kills: parseInt(player.player_stats?.['Quadro Kills'] || '0'),
            penta_kills: parseInt(player.player_stats?.['Penta Kills'] || '0'),
            mvps: parseInt(player.player_stats?.MVPs || '0')
          }
        };
      })
    );

    res.json({
      match_id: matchId,
      game: matchInfo.game,
      region: matchInfo.region,
      competition_name: matchInfo.competition_name || 'Europe 5v5 Queue',
      started_at: matchInfo.started_at,
      finished_at: matchInfo.finished_at,
      map: roundStats?.round_stats?.Map || matchInfo.voting?.map?.pick?.[0] || 'Unknown',
      score: matchInfo.results?.score ? {
        faction1: matchInfo.results.score.faction1,
        faction2: matchInfo.results.score.faction2
      } : null,
      winner: matchInfo.results?.winner,
      teams: {
        faction1: {
          team_id: matchInfo.teams?.faction1?.faction_id,
          name: matchInfo.teams?.faction1?.name,
          players: playersStats.filter(p => {
            const faction1PlayerIds = matchInfo.teams?.faction1?.roster?.map((p: any) => p.player_id) || [];
            return faction1PlayerIds.includes(p.player_id);
          })
        },
        faction2: {
          team_id: matchInfo.teams?.faction2?.faction_id,
          name: matchInfo.teams?.faction2?.name,
          players: playersStats.filter(p => {
            const faction2PlayerIds = matchInfo.teams?.faction2?.roster?.map((p: any) => p.player_id) || [];
            return faction2PlayerIds.includes(p.player_id);
          })
        }
      }
    });
  } catch (error) {
    console.error('Chyba při získávání zápasu:', error);
    res.status(500).json({ error: 'Chyba při komunikaci s Faceit API' });
  }
});

export default router;

