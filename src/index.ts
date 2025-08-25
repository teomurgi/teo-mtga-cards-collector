#!/usr/bin/env node

import { Command } from 'commander';
import { CardsCollector } from './collector/CardsCollector';
import { Logger } from './utils/Logger';
import { ScryfallApi } from './utils/ScryfallApi';

const program = new Command();

program
  .name('teo-mtga-cards-collector')
  .description('Merge 17Lands CSV data with Scryfall JSON data to create a comprehensive MTG card collection')
  .version('1.0.0');

program
  .command('collect')
  .description('Download and merge 17Lands and Scryfall data into JSONL file')
  .option('-s, --scryfall-url <url>', 'Scryfall JSON URL (if not provided, fetches latest automatically)')
  .option('-l, --lands-url <url>', '17Lands CSV URL', 'https://17lands-public.s3.amazonaws.com/analysis_data/cards/cards.csv')
  .option('-o, --output <file>', 'Output JSONL file', 'mtg_cards.jsonl')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (options) => {
    try {
      if (options.verbose) {
        Logger.setLevel('debug');
      }

      Logger.info('Starting MTG Cards Collection...');
      
      // Fetch latest Scryfall URL if not provided
      let scryfallUrl = options.scryfallUrl;
      if (!scryfallUrl) {
        Logger.info('🔍 Fetching latest Scryfall data URL...');
        scryfallUrl = await ScryfallApi.getLatestDefaultCardsUrl();
        
        const timestamp = ScryfallApi.extractTimestamp(scryfallUrl);
        if (timestamp) {
          const formattedDate = ScryfallApi.formatTimestamp(timestamp);
          Logger.info(`📅 Latest Scryfall data from: ${formattedDate}`);
        }
      }
      
      Logger.info(`Scryfall URL: ${scryfallUrl}`);
      Logger.info(`17Lands URL: ${options.landsUrl}`);
      Logger.info(`Output file: ${options.output}`);

      const collector = new CardsCollector();
      await collector.collect({
        scryfallUrl: scryfallUrl,
        landsUrl: options.landsUrl,
        outputFile: options.output
      });

      Logger.success('Collection completed successfully!');
    } catch (error) {
      Logger.error('Collection failed:', error);
      process.exit(1);
    }
  });

program
  .command('info')
  .description('Show information about a JSONL card collection file')
  .argument('<file>', 'JSONL file to analyze')
  .action(async (file) => {
    try {
      const collector = new CardsCollector();
      await collector.showInfo(file);
    } catch (error) {
      Logger.error('Failed to show collection info:', error);
      process.exit(1);
    }
  });

program
  .command('scryfall-info')
  .description('Show information about the latest Scryfall data')
  .action(async () => {
    try {
      Logger.info('🔍 Fetching latest Scryfall bulk data information...');
      const latestUrl = await ScryfallApi.getLatestDefaultCardsUrl();
      
      console.log('\n📊 Latest Scryfall Default Cards Data:');
      console.log(`🔗 Download URL: ${latestUrl}`);
      
      const timestamp = ScryfallApi.extractTimestamp(latestUrl);
      if (timestamp) {
        const formattedDate = ScryfallApi.formatTimestamp(timestamp);
        console.log(`📅 Last Updated: ${formattedDate}`);
      }
      
      console.log('\n💡 Use this URL with: npm run collect -- --scryfall-url "' + latestUrl + '"');
      console.log('💡 Or simply run: npm run collect (automatically uses latest)');
      
    } catch (error) {
      Logger.error('Failed to fetch Scryfall info:', error);
      process.exit(1);
    }
  });

if (require.main === module) {
  program.parse();
}

export { CardsCollector };
