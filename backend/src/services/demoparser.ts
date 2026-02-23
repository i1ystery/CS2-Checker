import { parseEvent, parseHeader, parsePlayerInfo } from '@laihoe/demoparser2';
import * as fs from 'fs';
import { transformPositions } from '../utils/mapTransform';
import { getMapImageSize } from '../utils/mapImageSizes';

export interface DeathEvent {
  x: number;
  y: number;
  z: number;
  player_id?: string;
  attacker_id?: string;
  team_num?: number; // 2 = T, 3 = CT
  round: number;
  tick: number;
}

export interface KillEvent {
  x: number;
  y: number;
  z: number;
  player_id?: string;
  team_num?: number; // 2 = T, 3 = CT
  round: number;
  tick: number;
}

export interface PlayerHeatmapData {
  player_id: string; // Steam ID pro identifikaci
  player_name: string; // Nickname hráče
  deaths: Array<{ x: number; y: number; team_num?: number; layer?: 'upper' | 'lower' }>;
  kills: Array<{ x: number; y: number; team_num?: number; layer?: 'upper' | 'lower' }>;
}

export interface DemoValidationResult {
  isValid: boolean;
  mapName?: string;
  demoPlayers?: Array<{ steamId: string; name: string }>;
  errors: string[];
}

/**
 * Získá název mapy z demo souboru pomocí parseHeader
 */
export function getMapNameFromDemo(demoPath: string): string | null {
  try {
    if (!fs.existsSync(demoPath)) {
      return null;
    }

    const header = parseHeader(demoPath);
    
    // Header může obsahovat mapName nebo map_name
    const mapName = header?.mapName || header?.map_name || header?.map;
    
    if (mapName && typeof mapName === 'string') {
      // Normalizovat název mapy (např. "de_mirage" -> "de_mirage")
      return mapName.toLowerCase().trim();
    }
    
    return null;
  } catch (error) {
    console.error('Chyba při získávání názvu mapy z dema:', error);
    return null;
  }
}

/**
 * Získá seznam hráčů z demo souboru pomocí parsePlayerInfo
 */
export function getPlayersFromDemo(demoPath: string): Array<{ steamId: string; name: string }> {
  try {
    if (!fs.existsSync(demoPath)) {
      return [];
    }

    const playerInfo = parsePlayerInfo(demoPath);
    
    // parsePlayerInfo vrací pole objektů s informacemi o hráčích
    if (!Array.isArray(playerInfo)) {
      return [];
    }

    const players: Array<{ steamId: string; name: string }> = [];
    
    for (const player of playerInfo) {
      // Steam ID může být v různých formátech (steamId, steamid, userid, atd.)
      const steamId = player?.steamId || player?.steamid || player?.xuid || player?.userId;
      const name = player?.name || player?.playerName || player?.player_name;
      
      if (steamId && name) {
        // Normalizovat Steam ID (může být číslo nebo string)
        const normalizedSteamId = String(steamId).replace(/[^0-9]/g, '');
        if (normalizedSteamId && name !== 'null' && name !== 'undefined') {
          players.push({
            steamId: normalizedSteamId,
            name: String(name).trim()
          });
        }
      }
    }

    return players;
  } catch (error) {
    console.error('Chyba při získávání hráčů z dema:', error);
    return [];
  }
}

/**
 * Validuje demo soubor proti informacím o zápase
 * Kontroluje název mapy a seznam hráčů
 * @param demoPath Cesta k demo souboru
 * @param expectedMapName Očekávaný název mapy
 * @param expectedPlayerIds Očekávané Steam IDs nebo Faceit player IDs hráčů
 * @param expectedPlayerNames Volitelné: očekávané nicknames hráčů pro fallback porovnání
 */
export function validateDemoAgainstMatch(
  demoPath: string,
  expectedMapName: string,
  expectedPlayerIds: string[],
  expectedPlayerNames?: string[]
): DemoValidationResult {
  const errors: string[] = [];
  
  // Získat název mapy z dema
  const demoMapName = getMapNameFromDemo(demoPath);
  
  if (!demoMapName) {
    errors.push('Nepodařilo se získat název mapy z demo souboru');
  } else {
    // Normalizovat názvy map pro porovnání
    const normalizedDemoMap = demoMapName.toLowerCase().trim();
    const normalizedExpectedMap = expectedMapName.toLowerCase().trim();
    
    // Ověřit, že mapa odpovídá (může být s nebo bez "de_" prefixu)
    const demoMapWithoutPrefix = normalizedDemoMap.replace(/^de_/, '');
    const expectedMapWithoutPrefix = normalizedExpectedMap.replace(/^de_/, '');
    
    if (normalizedDemoMap !== normalizedExpectedMap && 
        demoMapWithoutPrefix !== expectedMapWithoutPrefix &&
        normalizedDemoMap !== normalizedExpectedMap.replace(/^de_/, '') &&
        normalizedExpectedMap !== normalizedDemoMap.replace(/^de_/, '')) {
      errors.push(`Název mapy v demu (${demoMapName}) neodpovídá očekávané mapě (${expectedMapName})`);
    }
  }
  
  // Získat hráče z dema
  const demoPlayers = getPlayersFromDemo(demoPath);
  
  if (demoPlayers.length === 0) {
    errors.push('Nepodařilo se získat seznam hráčů z demo souboru');
  } else {
    // Vytvořit set Steam ID z dema pro rychlé porovnání
    const demoSteamIds = new Set(demoPlayers.map(p => p.steamId));
    const expectedSteamIds = new Set(expectedPlayerIds.map(id => String(id).replace(/[^0-9]/g, '')));
    
    // Normalizovat nicknames pro porovnání (pokud jsou dostupné)
    const demoNames = new Set(demoPlayers.map(p => p.name.toLowerCase().trim()));
    const expectedNames = expectedPlayerNames 
      ? new Set(expectedPlayerNames.map(n => String(n).toLowerCase().trim()))
      : null;
    
    // Porovnat pomocí Steam IDs
    let matchCount = Array.from(demoSteamIds).filter(id => expectedSteamIds.has(id)).length;
    
    // Pokud Steam ID shoda není dostatečná, zkusit porovnat pomocí nicknames
    if (matchCount < expectedSteamIds.size * 0.5 && expectedNames) {
      const nameMatchCount = Array.from(demoNames).filter(name => expectedNames.has(name)).length;
      if (nameMatchCount > matchCount) {
        matchCount = nameMatchCount;
        console.log('Používá se porovnání podle nicknames místo Steam IDs');
      }
    }
    
    // Najít hráče, kteří jsou v demu, ale ne v zápase
    const extraPlayers = demoPlayers.filter(p => {
      const steamIdMatch = expectedSteamIds.has(p.steamId);
      const nameMatch = expectedNames ? expectedNames.has(p.name.toLowerCase().trim()) : false;
      return !steamIdMatch && !nameMatch;
    });
    
    // Najít hráče, kteří jsou v zápase, ale ne v demu
    const missingPlayers = expectedPlayerIds.filter(id => {
      const normalizedId = String(id).replace(/[^0-9]/g, '');
      return !demoSteamIds.has(normalizedId);
    });
    
    // Pokud je více než 2 hráči navíc nebo chybí více než 2 hráči, považujeme to za chybu
    // (povolujeme malé odchylky kvůli možným rozdílům v Steam ID formátu)
    if (extraPlayers.length > 2) {
      errors.push(`V demu jsou hráči, kteří nejsou v zápase: ${extraPlayers.map(p => p.name).join(', ')}`);
    }
    
    if (missingPlayers.length > 2) {
      errors.push(`V demu chybí hráči ze zápasu (${missingPlayers.length} hráčů)`);
    }
    
    // Pokud je shoda menší než 50%, považujeme to za chybu
    const totalExpected = Math.max(expectedSteamIds.size, expectedNames?.size || 0);
    const matchPercentage = totalExpected > 0 ? (matchCount / totalExpected) * 100 : 0;
    
    if (matchPercentage < 50) {
      errors.push(`Shoda hráčů je pouze ${matchPercentage.toFixed(1)}% (${matchCount}/${totalExpected})`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    mapName: demoMapName || undefined,
    demoPlayers: demoPlayers.length > 0 ? demoPlayers : undefined,
    errors
  };
}

/**
 * Parsuje demo soubor a získává pozice smrtí/zabití pro všechny hráče
 * Vrací data rozdělená podle hráčů s transformovanými souřadnicemi
 */
export async function parseDemoForAllPlayers(
  demoPath: string,
  mapName: string
): Promise<PlayerHeatmapData[]> {
  try {
    // Kontrola existence souboru
    if (!fs.existsSync(demoPath)) {
      throw new Error(`Demo soubor neexistuje: ${demoPath}`);
    }

    // Získat rozměry obrázku mapy
    const imageSize = getMapImageSize(mapName);

    // Parsování událostí player_death
    // Podle terminálu: parseEvent vrací user_X, user_Y, user_Z, user_name, user_steamid, user_team_num když použijeme ['X', 'Y', 'Z', 'name', 'team_num'] v player fields
    // Pro útočníka: když použijeme ['X', 'Y', 'Z', 'name', 'team_num'] v other fields, vrací attacker_X, attacker_Y, attacker_Z, attacker_name, attacker_team_num
    const deathEvents = parseEvent(
      demoPath, 
      'player_death', 
      ['X', 'Y', 'Z', 'name', 'team_num', 'user_steamid'],  // player fields - vrací user_X, user_Y, user_Z, user_name, user_team_num, user_steamid
      ['X', 'Y', 'Z', 'name', 'team_num', 'attacker_steamid', 'round', 'tick']  // other fields - vrací attacker_X, attacker_Y, attacker_Z, attacker_name, attacker_team_num, attacker_steamid, round, tick
    );

    console.log(`Nalezeno ${deathEvents.length} death eventů`);

    // Debug: zkontrolovat strukturu prvních death eventů
    if (deathEvents.length > 0) {
      console.log('První death event (ukázka):', JSON.stringify(deathEvents[0], null, 2));
      console.log('Klíče prvního death eventu:', Object.keys(deathEvents[0]));
    }

    // Mapa pro ukládání dat podle hráčů
    // Klíč je nickname (nebo Steam ID jako fallback)
    const playerDataMap = new Map<string, { 
      deaths: DeathEvent[]; 
      kills: KillEvent[];
      player_name: string;
      player_steamid: string;
    }>();

    // Procházení death eventů a seskupení podle hráčů
    // Používáme user_name a attacker_name pro identifikaci hráčů (místo Steam ID)
    for (const event of deathEvents) {
      // Player fields - oběť (victim)
      const victimName = (event as any).user_name;
      const victimSteamId = (event as any).user_steamid; // Použijeme jako fallback
      const victimTeamNum = (event as any).user_team_num; // 2 = T, 3 = CT
      const victimX = (event as any).user_X;
      const victimY = (event as any).user_Y;
      const victimZ = (event as any).user_Z;
      
      // Other fields - útočník (attacker)
      // POZNÁMKA: Když použijeme ['X', 'Y', 'Z', 'name', 'team_num'] v other fields,
      // parseEvent vrací attacker_X, attacker_Y, attacker_Z, attacker_name, attacker_team_num
      const attackerName = (event as any).attacker_name;
      const attackerSteamId = (event as any).attacker_steamid; // Použijeme jako fallback
      const attackerTeamNum = (event as any).attacker_team_num; // 2 = T, 3 = CT
      // Pozice útočníka - použijeme attacker_X, attacker_Y, attacker_Z z other fields
      const attackerX = (event as any).attacker_X;
      const attackerY = (event as any).attacker_Y;
      const attackerZ = (event as any).attacker_Z;
      const tick = (event as any).tick || 0;
      const round = (event as any).round || 0;
      
      // Použít nickname jako primární identifikátor, Steam ID jako fallback
      const victimId = victimName || String(victimSteamId);
      const attackerId = attackerName || String(attackerSteamId);

      // Přidat smrt oběti (victim)
      // Používáme nickname jako identifikátor
      if (victimId && victimId !== 'null' && victimId !== 'undefined' &&
          victimX !== undefined && victimX !== null &&
          victimY !== undefined && victimY !== null &&
          victimZ !== undefined && victimZ !== null) {
        const playerId = String(victimId);
        
        if (!playerDataMap.has(playerId)) {
          playerDataMap.set(playerId, { 
            deaths: [], 
            kills: [],
            player_name: victimName || String(victimSteamId),
            player_steamid: String(victimSteamId)
          });
        }
        
        playerDataMap.get(playerId)!.deaths.push({
          x: Number(victimX),
          y: Number(victimY),
          z: Number(victimZ),
          player_id: playerId,
          attacker_id: attackerId?.toString(),
          team_num: victimTeamNum !== undefined && victimTeamNum !== null ? Number(victimTeamNum) : undefined,
          round: round,
          tick: Number(tick)
        });
      }

      // Přidat zabití útočníka (attacker)
      if (attackerId && attackerId !== 'null' && attackerId !== 'undefined' &&
          attackerX !== undefined && attackerX !== null &&
          attackerY !== undefined && attackerY !== null &&
          attackerZ !== undefined && attackerZ !== null) {
        const playerId = String(attackerId);
        
        if (!playerDataMap.has(playerId)) {
          playerDataMap.set(playerId, { 
            deaths: [], 
            kills: [],
            player_name: attackerName || String(attackerSteamId),
            player_steamid: String(attackerSteamId)
          });
        }
        
        playerDataMap.get(playerId)!.kills.push({
          x: Number(attackerX),
          y: Number(attackerY),
          z: Number(attackerZ),
          player_id: playerId,
          team_num: attackerTeamNum !== undefined && attackerTeamNum !== null ? Number(attackerTeamNum) : undefined,
          round: round,
          tick: Number(tick)
        });
      }
    }

    console.log(`Zpracováno pro ${playerDataMap.size} hráčů`);

    // Transformovat souřadnice pro každého hráče
    const result: PlayerHeatmapData[] = [];
    
    for (const [playerId, data] of playerDataMap.entries()) {
      // Transformovat smrti a zachovat team_num
      const transformedDeaths = transformPositions(
        mapName,
        data.deaths.map(d => ({ x: d.x, y: d.y, z: d.z })),
        imageSize.width,
        imageSize.height
      );

      // Transformovat zabití a zachovat team_num
      const transformedKills = transformPositions(
        mapName,
        data.kills.map(k => ({ x: k.x, y: k.y, z: k.z })),
        imageSize.width,
        imageSize.height
      );

      // Spárovat transformované souřadnice s původními daty (včetně team_num a layer)
      const deathsWithTeam: Array<{ x: number; y: number; team_num?: number; layer?: 'upper' | 'lower' }> = [];
      for (let i = 0; i < data.deaths.length; i++) {
        const originalDeath = data.deaths[i];
        if (!originalDeath) continue;
        
        const transformed = transformPositions(
          mapName,
          [{ x: originalDeath.x, y: originalDeath.y, z: originalDeath.z }],
          imageSize.width,
          imageSize.height
        );
        if (transformed.length > 0 && transformed[0]) {
          deathsWithTeam.push({
            x: transformed[0].x,
            y: transformed[0].y,
            team_num: originalDeath.team_num,
            layer: transformed[0].layer
          });
        }
      }

      const killsWithTeam: Array<{ x: number; y: number; team_num?: number; layer?: 'upper' | 'lower' }> = [];
      for (let i = 0; i < data.kills.length; i++) {
        const originalKill = data.kills[i];
        if (!originalKill) continue;
        
        const transformed = transformPositions(
          mapName,
          [{ x: originalKill.x, y: originalKill.y, z: originalKill.z }],
          imageSize.width,
          imageSize.height
        );
        if (transformed.length > 0 && transformed[0]) {
          killsWithTeam.push({
            x: transformed[0].x,
            y: transformed[0].y,
            team_num: originalKill.team_num,
            layer: transformed[0].layer
          });
        }
      }

      result.push({
        player_id: data.player_steamid || playerId, // Steam ID pro mapování na frontendu
        player_name: data.player_name || playerId, // Nickname pro zobrazení
        deaths: deathsWithTeam,
        kills: killsWithTeam
      });

      console.log(`Hráč ${data.player_name || playerId} (${data.player_steamid || playerId}): ${transformedDeaths.length} smrtí, ${transformedKills.length} zabití`);
    }

    return result;
  } catch (error) {
    console.error('Chyba při parsování demo souboru:', error);
    throw error;
  }
}

/**
 * Parsuje demo soubor a získává pozice smrtí/zabití pro konkrétního hráče
 * @deprecated Použijte parseDemoForAllPlayers místo této funkce
 */
export async function parseDemoForPlayer(
  demoPath: string,
  playerId: string
): Promise<{ deaths: DeathEvent[]; kills: KillEvent[] }> {
  // Pro zpětnou kompatibilitu - použijeme parseDemoForAllPlayers
  // a pak vyfiltrujeme data pro konkrétního hráče
  // Ale potřebujeme mapName - takže tato funkce by měla být upravena
  throw new Error('Tato funkce vyžaduje mapName. Použijte parseDemoForAllPlayers místo toho.');
}
