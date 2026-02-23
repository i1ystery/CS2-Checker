export type SearchQueryType = 'nickname' | 'faceit_url' | 'steam_url' | 'steam_id';

export interface ParsedQuery {
  type: SearchQueryType;
  value: string;
}

/**
 * Parsování typu vyhledávání z query stringu
 * Podporuje: Faceit URL, Steam profile URL, Steam64 ID, nickname
 */
export function parseSearchQuery(query: string): ParsedQuery {
  const trimmed = query.trim();
  
  // Faceit URL: https://www.faceit.com/en/players/nickname nebo https://www.faceit.com/cs/players-cs2/nickname
  const faceitMatch = trimmed.match(/faceit\.com\/[a-z]{2}\/players(?:-cs2)?\/([^\/\?]+)/i);
  if (faceitMatch && faceitMatch[1]) {
    return { type: 'faceit_url', value: faceitMatch[1] };
  }
  
  // Steam URL: https://steamcommunity.com/profiles/76561198012345678
  const steamProfileMatch = trimmed.match(/steamcommunity\.com\/profiles\/(\d+)/i);
  if (steamProfileMatch && steamProfileMatch[1]) {
    return { type: 'steam_id', value: steamProfileMatch[1] };
  }
  
  // Steam URL: https://steamcommunity.com/id/customname
  const steamIdMatch = trimmed.match(/steamcommunity\.com\/id\/([^\/\?]+)/i);
  if (steamIdMatch && steamIdMatch[1]) {
    return { type: 'steam_url', value: steamIdMatch[1] };
  }
  
  // Čisté Steam ID (17 číslic)
  if (/^\d{17}$/.test(trimmed)) {
    return { type: 'steam_id', value: trimmed };
  }
  
  // Výchozí: nickname
  return { type: 'nickname', value: trimmed };
}

