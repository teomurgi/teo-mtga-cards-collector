import { ScryfallCard, LandsCard, MergedCard } from '../types/Card';
import { Logger } from '../utils/Logger';

export class EnhancedCardMerger {
  // Digital-only set codes that may not be in regular Scryfall data
  private readonly digitalOnlySets = new Set([
    'y22', 'y23', 'y24', 'y25', 'ymid', 'yvow', 'ysnc', 'yneo', 'ydmu', 'ybro', 'yotj', 'ylci',
    'hbg', 'fin', 'arenasup'
  ]);

  // Token/generated card names that are commonly unmatched
  private readonly commonTokens = new Set([
    'Treasure', 'Food', 'Clue', 'Gold', 'Blood', 'Map',
    'Angel', 'Zombie', 'Spirit', 'Elemental', 'Goblin', 'Thopter',
    'Soldier', 'Knight', 'Beast', 'Cat', 'Wolf', 'Snake', 'Insect',
    'Human', 'Warrior', 'Saproling', 'Spider'
  ]);

  merge(scryfallCards: ScryfallCard[], landsCards: LandsCard[]): MergedCard[] {
    Logger.debug('Starting enhanced card merge process...');
    
    // Create comprehensive indexes for matching
    const indexes = this.createIndexes(scryfallCards);
    
    const mergedCards: MergedCard[] = [];
    let bothSourcesCount = 0;
    let landsOnlyCount = 0;
    let enhancedMatchesCount = 0;
    
    // Process ALL 17Lands cards (17Lands is master)
    for (const landsCard of landsCards) {
      const matchResult = this.findBestMatch(landsCard, indexes);
      
      if (matchResult.scryfallCard) {
        mergedCards.push(this.createMergedCard(matchResult.scryfallCard, landsCard, 'both'));
        bothSourcesCount++;
        
        if (matchResult.matchType !== 'exact') {
          enhancedMatchesCount++;
        }
      } else {
        // No match found - create enriched 17Lands-only card
        mergedCards.push(this.createEnhancedLandsOnlyCard(landsCard));
        landsOnlyCount++;
      }
    }

    Logger.debug(`Enhanced merge complete: ${mergedCards.length} total cards`);
    Logger.debug(`Enhanced breakdown: ${bothSourcesCount} with Scryfall matches (${enhancedMatchesCount} via enhanced matching), ${landsOnlyCount} 17Lands only`);
    
    const bothCount = mergedCards.filter(c => c.source === 'both').length;
    const landsOnlyCountCheck = mergedCards.filter(c => c.source === 'lands_only').length;
    
    Logger.info(`Enhanced merge stats: ${bothCount} both sources, 0 Scryfall only, ${landsOnlyCountCheck} 17Lands only`);
    
    return mergedCards;
  }

  private createIndexes(scryfallCards: ScryfallCard[]) {
    const byNameSet = new Map<string, ScryfallCard>();
    const byArenaId = new Map<number, ScryfallCard>();
    const byNameOnly = new Map<string, ScryfallCard[]>();
    const byNameNormalized = new Map<string, ScryfallCard[]>();
    
    let splitCardsCount = 0;
    
    for (const card of scryfallCards) {
      // Primary index: exact name+set
      const nameSetKey = `${card.name}|${card.set.toLowerCase()}`;
      byNameSet.set(nameSetKey, card);
      
      // Arena ID index
      if (card.arena_id) {
        byArenaId.set(card.arena_id, card);
      }
      
      // Name-only index (for cross-set matches)
      if (!byNameOnly.has(card.name)) {
        byNameOnly.set(card.name, []);
      }
      byNameOnly.get(card.name)!.push(card);
      
      // Normalized name index (remove special characters, case insensitive)
      const normalizedName = this.normalizeName(card.name);
      if (!byNameNormalized.has(normalizedName)) {
        byNameNormalized.set(normalizedName, []);
      }
      byNameNormalized.get(normalizedName)!.push(card);
      
      if (card.name.includes(' // ')) {
        splitCardsCount++;
      }
    }
    
    Logger.debug(`Found ${splitCardsCount} split cards in Scryfall data`);
    Logger.debug(`Created indexes: ${byNameSet.size} name+set, ${byArenaId.size} Arena ID, ${byNameOnly.size} name-only, ${byNameNormalized.size} normalized`);
    
    return { byNameSet, byArenaId, byNameOnly, byNameNormalized };
  }

  private findBestMatch(landsCard: LandsCard, indexes: any): { scryfallCard: ScryfallCard | null, matchType: string } {
    const nameSetKey = `${landsCard.name}|${landsCard.expansion.toLowerCase()}`;
    
    // 1. Try exact name+set match first (highest priority)
    let scryfallCard = indexes.byNameSet.get(nameSetKey);
    if (scryfallCard) {
      return { scryfallCard, matchType: 'exact' };
    }
    
    // 2. Try Arena ID match (for reprints/different sets)
    if (landsCard.arena_id) {
      scryfallCard = indexes.byArenaId.get(landsCard.arena_id);
      if (scryfallCard) {
        return { scryfallCard, matchType: 'arena_id' };
      }
    }
    
    // 3. Try finding split/adventure card matches (common issue)
    const splitMatch = this.findSplitCardMatch(landsCard, indexes);
    if (splitMatch) {
      return { scryfallCard: splitMatch, matchType: 'split_card' };
    }
    
    // 4. Try transform/MDFC card matches
    const transformMatch = this.findTransformCardMatch(landsCard, indexes);
    if (transformMatch) {
      return { scryfallCard: transformMatch, matchType: 'transform_card' };
    }
    
    // 5. Try exact name match across sets (for digital reprints)
    const nameMatches = indexes.byNameOnly.get(landsCard.name);
    if (nameMatches && nameMatches.length > 0) {
      // Prefer most recent or most standard set
      const bestNameMatch = this.selectBestFromCandidates(nameMatches, landsCard);
      if (bestNameMatch) {
        return { scryfallCard: bestNameMatch, matchType: 'name_cross_set' };
      }
    }
    
    // 6. Try normalized name matching (handles minor text differences)
    const normalizedLandsName = this.normalizeName(landsCard.name);
    const normalizedMatches = indexes.byNameNormalized.get(normalizedLandsName);
    if (normalizedMatches && normalizedMatches.length > 0) {
      const bestNormalizedMatch = this.selectBestFromCandidates(normalizedMatches, landsCard);
      if (bestNormalizedMatch) {
        return { scryfallCard: bestNormalizedMatch, matchType: 'normalized' };
      }
    }
    
    // 7. Special handling for digital-only cards
    if (this.digitalOnlySets.has(landsCard.expansion.toLowerCase())) {
      // For digital-only sets, try to find the original printing
      const originalMatch = this.findOriginalPrinting(landsCard, indexes);
      if (originalMatch) {
        return { scryfallCard: originalMatch, matchType: 'digital_original' };
      }
    }
    
    return { scryfallCard: null, matchType: 'none' };
  }

  private findSplitCardMatch(landsCard: LandsCard, indexes: any): ScryfallCard | null {
    // Look for cards where the 17Lands name might be part of a split card
    // Example: "Swift End" should match "Murderous Rider // Swift End"
    
    // Check if any split cards contain this name as a component
    for (const [fullName, scryfallCard] of indexes.byNameOnly.entries()) {
      if (fullName.includes(' // ')) {
        const parts = fullName.split(' // ');
        
        // Check if our card name matches either part
        if (parts.some((part: string) => part.trim() === landsCard.name)) {
          // Verify set matches or use best candidate
          const candidates = scryfallCard;
          if (Array.isArray(candidates)) {
            return this.selectBestFromCandidates(candidates, landsCard);
          } else {
            return candidates;
          }
        }
      }
    }
    
    return null;
  }

  private findTransformCardMatch(landsCard: LandsCard, indexes: any): ScryfallCard | null {
    // Look for transform cards where 17Lands might have one face name
    // Example: "Heliod, the Warped Eclipse" might be the back face of a MDFC
    
    // Common transform/MDFC patterns
    const transformPatterns = [
      // Try adding common transform suffixes/prefixes
      `${landsCard.name}, the Radiant Dawn`,
      `${landsCard.name}, the Warped Eclipse`,
      // Try removing transform-specific parts
      landsCard.name.replace(/, the Radiant Dawn$/, ''),
      landsCard.name.replace(/, the Warped Eclipse$/, ''),
      landsCard.name.replace(/, the Moon's Fury$/, ''),
      landsCard.name.replace(/, the Midnight Scourge$/, ''),
      landsCard.name.replace(/, Infernal Seer$/, ''),
      landsCard.name.replace(/, Cosmic Impostor$/, ''),
      landsCard.name.replace(/, Lord of the Deep$/, ''),
      landsCard.name.replace(/, Primal Sickness$/, ''),
    ];
    
    for (const pattern of transformPatterns) {
      if (pattern !== landsCard.name) {
        const matches = indexes.byNameOnly.get(pattern);
        if (matches && matches.length > 0) {
          return this.selectBestFromCandidates(matches, landsCard);
        }
      }
    }
    
    // Also try to find the card by looking for similar names with different suffixes
    for (const [fullName, candidates] of indexes.byNameOnly.entries()) {
      const baseName = landsCard.name.split(',')[0].trim();
      if (fullName.startsWith(baseName) && fullName !== landsCard.name) {
        if (Array.isArray(candidates)) {
          return this.selectBestFromCandidates(candidates, landsCard);
        } else {
          return candidates;
        }
      }
    }
    
    return null;
  }

  private selectBestFromCandidates(candidates: ScryfallCard[], landsCard: LandsCard): ScryfallCard | null {
    if (candidates.length === 1) {
      return candidates[0];
    }
    
    // Prefer cards with Arena IDs
    const withArenaId = candidates.filter(c => c.arena_id);
    if (withArenaId.length === 1) {
      return withArenaId[0];
    }
    
    // Prefer standard/premier sets over supplemental
    const standardSets = candidates.filter(c => 
      !['sld', 'plst', 'plist', 'mb1', 'mb2', 'akh', 'hou'].includes(c.set.toLowerCase())
    );
    if (standardSets.length > 0) {
      return standardSets[0];
    }
    
    // Return first candidate as fallback
    return candidates[0];
  }

  private findOriginalPrinting(landsCard: LandsCard, indexes: any): ScryfallCard | null {
    // For Alchemy cards that start with "A-", try to find the original
    if (landsCard.name.startsWith('A-')) {
      const originalName = landsCard.name.substring(2); // Remove "A-" prefix
      const originalMatches = indexes.byNameOnly.get(originalName);
      if (originalMatches && originalMatches.length > 0) {
        return this.selectBestFromCandidates(originalMatches, landsCard);
      }
    }
    
    // Try finding the original card by name without digital prefixes/suffixes
    const nameMatches = indexes.byNameOnly.get(landsCard.name);
    if (nameMatches && nameMatches.length > 0) {
      return this.selectBestFromCandidates(nameMatches, landsCard);
    }
    
    return null;
  }

  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/['']/g, "'") // Normalize apostrophes
      .replace(/[""]/g, '"') // Normalize quotes
      .replace(/[^\w\s'"-]/g, '') // Remove special characters except apostrophes and hyphens
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private createMergedCard(scryfallCard: ScryfallCard, landsCard: LandsCard, source: 'both'): MergedCard {
    return {
      // Core identifiers
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
      
      // Set information
      set_code: landsCard.expansion,
      set_name: scryfallCard.set_name,
      rarity: scryfallCard.rarity || 'unknown',
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

  private createEnhancedLandsOnlyCard(landsCard: LandsCard): MergedCard {
    const isToken = this.commonTokens.has(landsCard.name);
    const isDigitalOnly = this.digitalOnlySets.has(landsCard.expansion.toLowerCase());
    
    return {
      // Core identifiers
      id: `${landsCard.expansion.toLowerCase()}_${landsCard.arena_id}`,
      arena_id: landsCard.arena_id,
      name: landsCard.name,
      
      // Minimal inferred properties
      mana_cost: undefined,
      cmc: undefined,
      type_line: isToken ? `Token — ${landsCard.name}` : landsCard.types,
      oracle_text: undefined,
      
      // Colors (empty for unknown)
      colors: [],
      color_identity: landsCard.color_identity ? landsCard.color_identity.split('') : [],
      keywords: [],
      
      // Set information
      set_code: landsCard.expansion,
      set_name: this.inferSetName(landsCard.expansion),
      rarity: isToken ? 'token' : landsCard.rarity,
      collector_number: undefined,
      
      // Art and flavor
      artist: undefined,
      flavor_text: undefined,
      
      // No pricing for 17Lands-only cards
      prices_usd: undefined,
      prices_usd_foil: undefined,
      
      // No images for 17Lands-only cards
      image_uris_normal: undefined,
      image_uris_large: undefined,
      
      // Links and legalities
      scryfall_uri: undefined,
      legalities_standard: undefined,
      legalities_modern: undefined,
      legalities_commander: undefined,
      
      // Flags
      digital: isDigitalOnly,
      foil: undefined,
      nonfoil: undefined,
      
      // 17Lands specific
      is_booster: landsCard.is_booster,
      
      // Metadata
      source: 'lands_only' as const,
      created_at: new Date().toISOString()
    };
  }

  private inferSetName(setCode: string): string {
    const setNames: Record<string, string> = {
      'y22': 'Alchemy: Innistrad',
      'y23': 'Alchemy: The Brothers\' War',
      'y24': 'Alchemy: Wilds of Eldraine',
      'y25': 'Alchemy: Foundations',
      'ymid': 'Alchemy: Midnight Hunt',
      'yvow': 'Alchemy: Crimson Vow',
      'ysnc': 'Alchemy: Streets of New Capenna',
      'yneo': 'Alchemy: Kamigawa',
      'ydmu': 'Alchemy: Dominaria United',
      'ybro': 'Alchemy: The Brothers\' War',
      'yotj': 'Alchemy: Outlaws of Thunder Junction',
      'ylci': 'Alchemy: Lost Caverns of Ixalan',
      'fin': 'Final Fantasy',
      'arenasup': 'Arena Supplemental',
      'tj25': 'Timeless Jump-In',
      'hbg': 'Alchemy Horizons: Baldur\'s Gate'
    };
    
    return setNames[setCode.toLowerCase()] || `Unknown Set (${setCode.toUpperCase()})`;
  }
}
