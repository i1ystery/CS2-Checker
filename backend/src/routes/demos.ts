import { Router } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { parseDemoForAllPlayers, validateDemoAgainstMatch, getMapNameFromDemo } from '../services/demoparser';
import { saveDemoData } from '../database/services/demoService';
import { faceitFetch, getPlayerById, getSteamIdFromPlayer } from '../services/faceit';

const router = Router();

// Vytvořit uploads složku pokud neexistuje
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Konfigurace multer pro upload demo souborů
const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 1000 * 1024 * 1024 // 500MB limit (demo soubory mohou být velké)
  },
  fileFilter: (_req, file, cb) => {
    if (file.originalname.endsWith('.dem')) {
      cb(null, true);
    } else {
      cb(new Error('Pouze .dem soubory jsou povoleny'));
    }
  }
});

/**
 * POST /api/demos/parse
 * Upload a parse demo soubor pro konkrétního hráče
 */
router.post('/parse', (req, res, next) => {
  upload.single('demo')(req, res, (err) => {
    if (err) {
      // Multer chyba - vždy vracet JSON
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Soubor je příliš velký. Maximální velikost je 1GB.' });
        }
        return res.status(400).json({ error: `Chyba při nahrávání: ${err.message}` });
      }
      return res.status(400).json({ error: err.message || 'Chyba při nahrávání souboru' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Chybí demo soubor' });
    }

    const { mapName, matchId } = req.body;

    if (!mapName) {
      // Smazat nahraný soubor
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Chybí mapName' });
    }

    if (!matchId) {
      // Smazat nahraný soubor
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Chybí matchId' });
    }

    const demoPath = req.file.path;

    // Získat informace o zápase z Faceit API pro validaci
    let matchInfo: any = null;
    let expectedMapName = mapName;
    let expectedPlayerIds: string[] = [];

    try {
      matchInfo = await faceitFetch<any>(`/matches/${matchId}`);
      
      if (matchInfo) {
        // Získat název mapy ze zápasu
        const matchStats = await faceitFetch<any>(`/matches/${matchId}/stats`);
        if (matchStats?.rounds?.[0]?.round_stats?.Map) {
          expectedMapName = matchStats.rounds[0].round_stats.Map;
        } else if (matchInfo.voting?.map?.pick?.[0]) {
          expectedMapName = matchInfo.voting.map.pick[0];
        }

        // Získat všechny player IDs ze zápasu a jejich Steam IDs
        const allPlayers = [
          ...(matchInfo.teams?.faction1?.roster || []),
          ...(matchInfo.teams?.faction2?.roster || [])
        ];
        const faceitPlayerIds = allPlayers.map((p: any) => p.player_id || p.id).filter(Boolean);
        
        // Získat nicknames hráčů pro fallback porovnání
        const expectedPlayerNames = allPlayers.map((p: any) => p.nickname || p.name).filter(Boolean);
        
        // Získat Steam IDs pro všechny hráče paralelně
        try {
          const playerDetailsPromises = faceitPlayerIds.map((playerId: string) => getPlayerById(playerId));
          const playerDetails = await Promise.all(playerDetailsPromises);
          
          // Extrahovat Steam IDs pomocí getSteamIdFromPlayer funkce
          expectedPlayerIds = playerDetails
            .map((player, index) => {
              const steamId = player ? getSteamIdFromPlayer(player) : null;
              
              if (steamId) {
                return steamId;
              }
              // Fallback na Faceit player ID pokud Steam ID není dostupné
              return faceitPlayerIds[index];
            })
            .filter(Boolean);
        } catch (error) {
          console.warn('Nepodařilo se získat Steam IDs hráčů, použijeme Faceit IDs:', error);
          // Fallback na Faceit player IDs
          expectedPlayerIds = faceitPlayerIds;
        }
      }
    } catch (error) {
      console.warn('Nepodařilo se získat informace o zápase pro validaci:', error);
      // Pokračovat i bez validace, pokud se nepodařilo získat informace o zápase
    }

    // Validovat demo soubor proti informacím o zápase
    if (matchInfo && expectedPlayerIds.length > 0) {
      // Získat nicknames hráčů pro fallback porovnání (pokud ještě nejsou získány)
      const allPlayersForNames = [
        ...(matchInfo.teams?.faction1?.roster || []),
        ...(matchInfo.teams?.faction2?.roster || [])
      ];
      const expectedPlayerNames = allPlayersForNames.map((p: any) => p.nickname || p.name).filter(Boolean);
      
      const validation = validateDemoAgainstMatch(
        demoPath, 
        expectedMapName, 
        expectedPlayerIds,
        expectedPlayerNames.length > 0 ? expectedPlayerNames : undefined
      );
      
      if (!validation.isValid) {
        // Smazat nahraný soubor
        fs.unlinkSync(demoPath);
        return res.status(400).json({
          error: 'Demo soubor neodpovídá zápasu',
          details: validation.errors,
          demoMapName: validation.mapName,
          expectedMapName: expectedMapName
        });
      }

      // Pokud validace prošla, použít mapu z dema (je přesnější)
      if (validation.mapName) {
        expectedMapName = validation.mapName;
        console.log(`Používá se název mapy z dema: ${validation.mapName}`);
      }
    } else {
      // Pokud nemáme informace o zápase, zkusit získat mapu z dema
      const demoMapName = getMapNameFromDemo(demoPath);
      if (demoMapName) {
        expectedMapName = demoMapName;
        console.log(`Používá se název mapy z dema: ${demoMapName}`);
      }
    }

    // Parsování demo souboru pro všechny hráče
    // Backend vrací data rozdělená podle hráčů s transformovanými souřadnicemi
    const playersData = await parseDemoForAllPlayers(demoPath, expectedMapName);

    console.log('Parsování dokončeno:', {
      playersCount: playersData.length,
      totalDeaths: playersData.reduce((sum, p) => sum + p.deaths.length, 0),
      totalKills: playersData.reduce((sum, p) => sum + p.kills.length, 0)
    });

    // Uložit data do databáze
    try {
      await saveDemoData(matchId, expectedMapName, playersData);
      console.log(`Demo data uložena do databáze pro zápas ${matchId}`);
    } catch (dbError) {
      console.error('Chyba při ukládání do databáze:', dbError);
      // Pokračovat i když se nepodařilo uložit do databáze
    }

    // Smazat nahraný soubor po parsování
    fs.unlinkSync(demoPath);

    res.json({
      players: playersData,
      map: expectedMapName,
      matchId: matchId
    });
  } catch (error) {
    console.error('Chyba při parsování demo:', error);
    
    // Smazat soubor v případě chyby
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // Ignorovat chyby při mazání
      }
    }

    res.status(500).json({ error: 'Chyba při parsování demo souboru' });
  }
});

export default router;

