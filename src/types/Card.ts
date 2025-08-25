// Scryfall JSON Card structure
export interface ScryfallCard {
  id: string;
  arena_id?: number;
  name: string;
  mana_cost?: string;
  cmc?: number;
  type_line?: string;
  oracle_text?: string;
  colors?: string[];
  color_identity?: string[];
  keywords?: string[];
  set: string;
  set_name?: string;
  rarity?: string;
  collector_number?: string;
  artist?: string;
  flavor_text?: string;
  prices?: {
    usd?: string;
    usd_foil?: string;
  };
  image_uris?: {
    normal?: string;
    large?: string;
  };
  scryfall_uri?: string;
  legalities?: {
    standard?: string;
    modern?: string;
    commander?: string;
  };
  digital?: boolean;
  foil?: boolean;
  nonfoil?: boolean;
}

// 17Lands CSV Card structure
export interface LandsCard {
  arena_id: number;
  name: string;
  expansion: string;
  rarity: string;
  color_identity: string;
  mana_value: number;
  types: string;
  is_booster: boolean;
}

// Merged card structure for database
export interface MergedCard {
  // Core identifiers (from both sources)
  id: string;
  arena_id: number;
  name: string;
  
  // Basic properties
  mana_cost?: string;
  cmc?: number;
  type_line?: string;
  oracle_text?: string;
  
  // Colors and identity
  colors?: string[];
  color_identity?: string[];
  keywords?: string[];
  
  // Set information
  set_code: string;
  set_name?: string;
  rarity: string;
  collector_number?: string;
  
  // Art and flavor
  artist?: string;
  flavor_text?: string;
  
  // Pricing
  prices_usd?: number;
  prices_usd_foil?: number;
  
  // Images
  image_uris_normal?: string;
  image_uris_large?: string;
  
  // Links and legalities
  scryfall_uri?: string;
  legalities_standard?: string;
  legalities_modern?: string;
  legalities_commander?: string;
  
  // Flags
  digital?: boolean;
  foil?: boolean;
  nonfoil?: boolean;
  
  // 17Lands specific
  is_booster: boolean;
  
  // Metadata
  source: 'both' | 'scryfall_only' | 'lands_only';
  created_at: string;
}

// Collection options
export interface CollectionOptions {
  scryfallUrl: string;
  landsUrl: string;
  outputFile: string;
}
