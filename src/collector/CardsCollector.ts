import { promises as fs } from 'fs';
import { ScryfallCard, LandsCard, MergedCard, CollectionOptions } from '../types/Card';
import { ScryfallDownloader } from './ScryfallDownloader';
import { LandsDownloader } from './LandsDownloader';
import { CardMerger } from './CardMerger';
import { EnhancedCardMerger } from './EnhancedCardMerger';
import { JSONLWriter } from './JSONLWriter';
import { Logger } from '../utils/Logger';

export class CardsCollector {
  private scryfallDownloader: ScryfallDownloader;
  private landsDownloader: LandsDownloader;
  private cardMerger: CardMerger;
  private enhancedCardMerger: EnhancedCardMerger;
  private jsonlWriter: JSONLWriter;

  constructor() {
    this.scryfallDownloader = new ScryfallDownloader();
    this.landsDownloader = new LandsDownloader();
    this.cardMerger = new CardMerger();
    this.enhancedCardMerger = new EnhancedCardMerger();
    this.jsonlWriter = new JSONLWriter();
  }

  async collect(options: CollectionOptions): Promise<void> {
    Logger.info('Starting card collection process...');

    // Step 1: Download Scryfall data
    Logger.info('Downloading Scryfall JSON data...');
    const scryfallCards = await this.scryfallDownloader.download(options.scryfallUrl);
    Logger.success(`Downloaded ${scryfallCards.length} cards from Scryfall`);

    // Step 2: Download 17Lands data
    Logger.info('Downloading 17Lands CSV data...');
    const landsCards = await this.landsDownloader.download(options.landsUrl);
    Logger.success(`Downloaded ${landsCards.length} cards from 17Lands`);

    // Step 3: Merge the data with enhanced matching
    Logger.info('Merging card data...');
    const mergedCards = this.enhancedCardMerger.merge(scryfallCards, landsCards);
    Logger.success(`Merged data for ${mergedCards.length} unique cards`);

    // Step 4: Write to JSONL
    Logger.info(`Writing to JSONL file: ${options.outputFile}`);
    await this.jsonlWriter.write(mergedCards, options.outputFile);
    Logger.success('JSONL file written successfully');

    // Step 5: Show summary
    await this.showSummary(options.outputFile);
  }

  async showInfo(jsonlFile: string): Promise<void> {
    Logger.info(`Analyzing JSONL file: ${jsonlFile}`);
    
    try {
      await fs.access(jsonlFile);
    } catch {
      throw new Error(`JSONL file not found: ${jsonlFile}`);
    }

    await this.jsonlWriter.showInfo(jsonlFile);
  }

  private async showSummary(jsonlFile: string): Promise<void> {
    Logger.info('\n=== COLLECTION SUMMARY ===');
    await this.jsonlWriter.showInfo(jsonlFile);
  }
}
