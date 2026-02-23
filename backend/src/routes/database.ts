import { Router } from 'express';
import {
  getDemoDataByMatchId,
  getMatchesByPlayerAndMap,
  getMatchesByPlayer,
  getMatchesByMap,
  deleteDemoData
} from '../database/services/demoService';

const router = Router();

/**
 * GET /api/database/match/:matchId
 * Získat demo data pro konkrétní zápas
 */
router.get('/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const demoData = await getDemoDataByMatchId(matchId);
    
    if (!demoData) {
      return res.status(404).json({ error: 'Demo data pro tento zápas nebyla nalezena' });
    }
    
    res.json(demoData);
  } catch (error) {
    console.error('Chyba při získávání demo dat:', error);
    res.status(500).json({ error: 'Chyba při získávání demo dat' });
  }
});

/**
 * GET /api/database/player/:playerId/map/:mapName
 * Získat všechny zápasy pro konkrétního hráče na konkrétní mapě
 */
router.get('/player/:playerId/map/:mapName', async (req, res) => {
  try {
    const { playerId, mapName } = req.params;
    const matches = await getMatchesByPlayerAndMap(playerId, mapName);
    
    res.json(matches);
  } catch (error) {
    console.error('Chyba při získávání zápasů:', error);
    res.status(500).json({ error: 'Chyba při získávání zápasů' });
  }
});

/**
 * GET /api/database/player/:playerId
 * Získat všechny zápasy pro konkrétního hráče (na všech mapách)
 */
router.get('/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const matches = await getMatchesByPlayer(playerId);
    
    res.json(matches);
  } catch (error) {
    console.error('Chyba při získávání zápasů:', error);
    res.status(500).json({ error: 'Chyba při získávání zápasů' });
  }
});

/**
 * GET /api/database/map/:mapName
 * Získat všechny zápasy na konkrétní mapě
 */
router.get('/map/:mapName', async (req, res) => {
  try {
    const { mapName } = req.params;
    const matches = await getMatchesByMap(mapName);
    
    res.json(matches);
  } catch (error) {
    console.error('Chyba při získávání zápasů:', error);
    res.status(500).json({ error: 'Chyba při získávání zápasů' });
  }
});

/**
 * DELETE /api/database/match/:matchId
 * Smazat demo data pro konkrétní zápas
 */
router.delete('/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const deleted = await deleteDemoData(matchId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Demo data pro tento zápas nebyla nalezena' });
    }
    
    res.json({ message: 'Demo data byla úspěšně smazána' });
  } catch (error) {
    console.error('Chyba při mazání demo dat:', error);
    res.status(500).json({ error: 'Chyba při mazání demo dat' });
  }
});

export default router;




