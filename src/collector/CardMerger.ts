import { ScryfallCard, LandsCard, MergedCard } from '../types/Card';
import { Logger } from '../utils/Logger';

export class CardMerger {
  merge(scryfallCards: ScryfallCard[], landsCards: LandsCard[]): MergedCard[] {
    Logger.debug('Starting card merge process...');
    
    // Check for duplicate Arena IDs in 17Lands data
    const arenaIdCounts = new Map<number, number>();
    for (const card of landsCards) {
      arenaIdCounts.set(card.arena_id, (arenaIdCounts.get(card.arena_id) || 0) + 1);
    }
    
    const duplicates = Array.from(arenaIdCounts.entries()).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
      Logger.debug(`Found ${duplicates.length} Arena IDs with duplicates in 17Lands data`);
      Logger.debug(`First few duplicates: ${duplicates.slice(0, 5).map(([id, count]) => `${id}(${count}x)`).join(', ')}`);
    }
    
    // Create maps for efficient Scryfall lookups
    // Primary: exact name+set matching, Fallback: Arena ID matching
    const scryfallByName = new Map<string, ScryfallCard>();
    const scryfallByArenaId = new Map<number, ScryfallCard>();
    
    // Index Scryfall cards by exact name+set and Arena ID
    let splitCardsCount = 0;
    for (const card of scryfallCards) {
      // Primary index: name|set
      const nameSetKey = `${card.name}|${card.set.toLowerCase()}`;
      scryfallByName.set(nameSetKey, card);
      
      // Fallback index: Arena ID (if available)
      if (card.arena_id) {
        scryfallByArenaId.set(card.arena_id, card);
      }
      
      // Count split cards for debugging
      if (card.name.includes(' // ')) {
        splitCardsCount++;
      }
    }
    
    Logger.debug(`Found ${splitCardsCount} split cards in Scryfall data`);
    Logger.debug(`Indexed ${scryfallByName.size} cards by name+set, ${scryfallByArenaId.size} cards by Arena ID`);
    
    const mergedCards: MergedCard[] = [];
    let bothSourcesCount = 0;
    let landsOnlyCount = 0;
    let arenaIdFallbackCount = 0;
    
    // Process ALL 17Lands cards (17Lands is master)
    for (const landsCard of landsCards) {
      const nameSetKey = `${landsCard.name}|${landsCard.expansion.toLowerCase()}`;
      
      // Try exact name+set match first
      let scryfallCard = scryfallByName.get(nameSetKey);
      let matchType = 'exact';
      
      // Fallback to Arena ID match if exact match fails
      if (!scryfallCard && landsCard.arena_id) {
        scryfallCard = scryfallByArenaId.get(landsCard.arena_id);
        if (scryfallCard) {
          matchType = 'arena_id';
          arenaIdFallbackCount++;
        }
      }
      
      if (scryfallCard) {
        // Found a match - create enriched card
        mergedCards.push(this.createMergedCard(scryfallCard, landsCard, 'both'));
        bothSourcesCount++;
      } else {
        // No Scryfall match - create 17Lands-only card
        mergedCards.push(this.createLandsOnlyCard(landsCard));
        landsOnlyCount++;
      }
    }

    Logger.debug(`Merge complete: ${mergedCards.length} total cards`);
    Logger.debug(`Merge breakdown: ${bothSourcesCount} with Scryfall matches (${arenaIdFallbackCount} via Arena ID fallback), ${landsOnlyCount} 17Lands only`);
    
    // Check for duplicate Arena IDs in merged data
    const mergedArenaIdCounts = new Map<number, number>();
    for (const card of mergedCards) {
      mergedArenaIdCounts.set(card.arena_id, (mergedArenaIdCounts.get(card.arena_id) || 0) + 1);
    }
    
    const duplicateArenaIds = Array.from(mergedArenaIdCounts.entries()).filter(([_, count]) => count > 1);
    if (duplicateArenaIds.length > 0) {
      Logger.debug(`Found ${duplicateArenaIds.length} Arena IDs with duplicates in merged data`);
      Logger.debug(`First few duplicate Arena IDs: ${duplicateArenaIds.slice(0, 5).map(([id, count]) => `${id}(${count}x)`).join(', ')}`);
    } else {
      Logger.debug('No duplicate Arena IDs found in merged data');
    }
    
    const bothCount = mergedCards.filter(c => c.source === 'both').length;
    const landsOnlyCountCheck = mergedCards.filter(c => c.source === 'lands_only').length;
    
    Logger.info(`Merge stats: ${bothCount} both sources, 0 Scryfall only, ${landsOnlyCountCheck} 17Lands only`);
    
    return mergedCards;
  }
  
  private createMergedCard(scryfallCard: ScryfallCard, landsCard: LandsCard, source: 'both'): MergedCard {
    return {
      // Core identifiers - use composite ID like Python version to ensure uniqueness
      id: `${landsCard.expansion.toLowerCase()}_${landsCard.arena_id}`,
      arena_id: landsCard.arena_id,
      name: scryfallCard.name,
      
      // Basic properties from Scryfall
      mana_cost: scryfallCard.mana_cost,
      cmc: scryfallCard.cmc,
      type_line: scryfallCard.type_line,
      oracle_text: scryfallCard.oracle_text,
      
      // Colors and identity
      colors: scryfallCard.colors,
      color_identity: scryfallCard.color_identity,
      keywords: scryfallCard.keywords,
      
      // Set information - prefer Scryfall for names, 17Lands for codes
      set_code: landsCard.expansion.toLowerCase(),
      set_name: scryfallCard.set_name,
      rarity: landsCard.rarity, // Prefer 17Lands rarity as it's more current
      collector_number: scryfallCard.collector_number,
      
      // Art and flavor
      artist: scryfallCard.artist,
      flavor_text: scryfallCard.flavor_text,
      
      // Pricing
      prices_usd: scryfallCard.prices?.usd ? parseFloat(scryfallCard.prices.usd) : undefined,
      prices_usd_foil: scryfallCard.prices?.usd_foil ? parseFloat(scryfallCard.prices.usd_foil) : undefined,
      
      // Images
      image_uris_normal: scryfallCard.image_uris?.normal,
      image_uris_large: scryfallCard.image_uris?.large,
      
      // Links and legalities
      scryfall_uri: scryfallCard.scryfall_uri,
      legalities_standard: scryfallCard.legalities?.standard,
      legalities_modern: scryfallCard.legalities?.modern,
      legalities_commander: scryfallCard.legalities?.commander,
      
      // Flags
      digital: scryfallCard.digital,
      foil: scryfallCard.foil,
      nonfoil: scryfallCard.nonfoil,
      
      // 17Lands specific
      is_booster: landsCard.is_booster,
      
      // Metadata
      source,
      created_at: new Date().toISOString()
    };
  }
  
  private createLandsOnlyCard(landsCard: LandsCard): MergedCard {
    return {
      id: `${landsCard.expansion.toLowerCase()}_${landsCard.arena_id}`,
      arena_id: landsCard.arena_id,
      name: landsCard.name,
      mana_cost: undefined,
      cmc: landsCard.mana_value,
      type_line: landsCard.types,
      oracle_text: undefined,
      colors: this.parseColorIdentity(landsCard.color_identity),
      color_identity: this.parseColorIdentity(landsCard.color_identity),
      keywords: undefined,
      set_code: landsCard.expansion.toLowerCase(),
      set_name: undefined,
      rarity: landsCard.rarity,
      collector_number: undefined,
      artist: undefined,
      flavor_text: undefined,
      prices_usd: undefined,
      prices_usd_foil: undefined,
      image_uris_normal: undefined,
      image_uris_large: undefined,
      scryfall_uri: undefined,
      legalities_standard: undefined,
      legalities_modern: undefined,
      legalities_commander: undefined,
      digital: undefined,
      foil: undefined,
      nonfoil: undefined,
      is_booster: landsCard.is_booster,
      source: 'lands_only',
      created_at: new Date().toISOString()
    };
  }
  
  private parseColorIdentity(colorString: string): string[] | undefined {
    if (!colorString) return undefined;
    
    // Convert string like "WU" to array ["W", "U"]
    return colorString.split('').filter(c => ['W', 'U', 'B', 'R', 'G'].includes(c));
  }
}
