import { promises as fs } from 'fs';
import { ScryfallCard, LandsCard, MergedCard, CollectionOptions } from '../types/Card';
import { ScryfallDownloader } from './ScryfallDownloader';
import { LandsDownloader } from './LandsDownloader';
import { CardMerger } from './CardMerger';
import { DatabaseWriter } from './DatabaseWriter';
import { Logger } from '../utils/Logger';

export class CardsCollector {
  private scryfallDownloader: ScryfallDownloader;
  private landsDownloader: LandsDownloader;
  private cardMerger: CardMerger;
  private databaseWriter: DatabaseWriter;

  constructor() {
    this.scryfallDownloader = new ScryfallDownloader();
    this.landsDownloader = new LandsDownloader();
    this.cardMerger = new CardMerger();
    this.databaseWriter = new DatabaseWriter();
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

    // Step 3: Merge the data
    Logger.info('Merging card data...');
    const mergedCards = this.cardMerger.merge(scryfallCards, landsCards);
    Logger.success(`Merged data for ${mergedCards.length} unique cards`);

    // Step 4: Write to DuckDB
    Logger.info(`Writing to DuckDB file: ${options.outputFile}`);
    await this.databaseWriter.write(mergedCards, options.outputFile);
    Logger.success('Database written successfully');

    // Step 5: Show summary
    await this.showSummary(options.outputFile);
  }

  async showInfo(databaseFile: string): Promise<void> {
    Logger.info(`Analyzing database: ${databaseFile}`);
    
    try {
      await fs.access(databaseFile);
    } catch {
      throw new Error(`Database file not found: ${databaseFile}`);
    }

    await this.databaseWriter.showInfo(databaseFile);
  }

  private async showSummary(databaseFile: string): Promise<void> {
    Logger.info('\n=== COLLECTION SUMMARY ===');
    await this.databaseWriter.showInfo(databaseFile);
  }
}
