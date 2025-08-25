import { promises as fs } from 'fs';
import { MergedCard } from '../types/Card';
import { Logger } from '../utils/Logger';

export class JSONLWriter {
  async writeToJSONL(cards: MergedCard[], outputPath: string): Promise<void> {
    Logger.debug(`Starting to write ${cards.length} cards to JSONL file...`);
    
    // Create JSONL content (one JSON object per line)
    const jsonlContent = cards.map(card => JSON.stringify(card)).join('\n');
    
    // Write to file
    await fs.writeFile(outputPath, jsonlContent, 'utf8');
    
    Logger.debug(`Successfully wrote ${cards.length} cards to ${outputPath}`);
  }

  async write(cards: MergedCard[], outputPath: string): Promise<void> {
    return this.writeToJSONL(cards, outputPath);
  }

  async showInfo(jsonlPath: string): Promise<void> {
    try {
      // Read and parse JSONL file
      const content = await fs.readFile(jsonlPath, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());
      const cards: MergedCard[] = lines.map(line => JSON.parse(line));
      
      Logger.info(`\nTotal Cards:`);
      Logger.info(`  ${JSON.stringify({total: cards.length.toString()})}`);
      
      // Get cards by source
      const sourceBreakdown = this.groupBy(cards, 'source');
      Logger.info(`\nCards by Source:`);
      Object.entries(sourceBreakdown)
        .sort(([,a], [,b]) => b.length - a.length)
        .forEach(([source, cards]) => 
          Logger.info(`  ${JSON.stringify({source, count: cards.length.toString()})}`)
        );
      
      // Get top 10 sets
      const setBreakdown = this.groupBy(cards, 'set_code');
      Logger.info(`\nCards by Set (Top 10):`);
      Object.entries(setBreakdown)
        .sort(([,a], [,b]) => b.length - a.length)
        .slice(0, 10)
        .forEach(([set_code, setCards]) => {
          const set_name = setCards[0].set_name;
          Logger.info(`  ${JSON.stringify({set_code, set_name, count: setCards.length.toString()})}`);
        });
      
      // Get rarity breakdown
      const rarityBreakdown = this.groupBy(cards, 'rarity');
      Logger.info(`\nCards by Rarity:`);
      Object.entries(rarityBreakdown)
        .sort(([,a], [,b]) => b.length - a.length)
        .forEach(([rarity, cards]) => 
          Logger.info(`  ${JSON.stringify({rarity, count: cards.length.toString()})}`)
        );
      
      // Arena ID coverage
      const arenaIdCoverage = cards.filter(card => card.arena_id != null).length;
      Logger.info(`\nArena ID Coverage:`);
      Logger.info(`  ${JSON.stringify({with_arena_id: arenaIdCoverage.toString()})}`);
      
    } catch (error) {
      throw new Error(`Failed to read JSONL file: ${error}`);
    }
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }
}
