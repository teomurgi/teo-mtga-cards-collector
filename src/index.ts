#!/usr/bin/env node

import { Command } from 'commander';
import { CardsCollector } from './collector/CardsCollector';
import { Logger } from './utils/Logger';

const program = new Command();

program
  .name('teo-mtga-cards-collector')
  .description('Merge 17Lands CSV data with Scryfall JSON data to create a comprehensive MTG card database')
  .version('1.0.0');

program
  .command('collect')
  .description('Download and merge 17Lands and Scryfall data into DuckDB')
  .option('-s, --scryfall-url <url>', 'Scryfall JSON URL', 'https://data.scryfall.io/default-cards/default-cards-20250825090922.json')
  .option('-l, --lands-url <url>', '17Lands CSV URL', 'https://17lands-public.s3.amazonaws.com/analysis_data/cards/cards.csv')
  .option('-o, --output <file>', 'Output DuckDB file', 'mtg_cards.duckdb')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (options) => {
    try {
      if (options.verbose) {
        Logger.setLevel('debug');
      }

      Logger.info('Starting MTG Cards Collection...');
      Logger.info(`Scryfall URL: ${options.scryfallUrl}`);
      Logger.info(`17Lands URL: ${options.landsUrl}`);
      Logger.info(`Output file: ${options.output}`);

      const collector = new CardsCollector();
      await collector.collect({
        scryfallUrl: options.scryfallUrl,
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
  .description('Show information about a DuckDB card database')
  .argument('<file>', 'DuckDB file to analyze')
  .action(async (file) => {
    try {
      const collector = new CardsCollector();
      await collector.showInfo(file);
    } catch (error) {
      Logger.error('Failed to show database info:', error);
      process.exit(1);
    }
  });

if (require.main === module) {
  program.parse();
}

export { CardsCollector };
